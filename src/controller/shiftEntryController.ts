import {server,q, client} from '../fauna_utils'
import type { Request, Response } from 'express';
import { delete_file_from_space } from '../s3_utils';
import { DateTime } from "luxon";
import { response_bad_request, response_success, response_internal_server_error, response_unauthorized } from '../response_utils';
import type { Account, Data, LocationFunction,ShiftEntry, CronArray, ShiftEntriesUserPaginateData, PaginateArray, ShiftEntryDetails, FaceRecogResponse , Shifts} from '../interfaces/interface';
import cron from 'node-cron';
import { authorize_token, check_req_field,check_role, check_exist, iso_string_checker,organization_id_by_user_id, get_shift_start_and_end_time, time_comparer, sql_date_string_checker } from '../utils';
import haversine from "haversine";
import axios, { Axios, AxiosError, AxiosResponse } from 'axios';

export async function create_shift_entry(req: Request, res: Response): Promise<Response> {
    try {
        const { user_ref,shift_id,overtime_enabled, overtime_duration} = req.body;
        const required_fields = [
			'user_ref',
			'shift_id',
		];

        const data:ShiftEntry[] = []

		for (const fields of required_fields) {
			let valid = check_req_field(req.body[fields])
            if(!valid){
                throw new Error(`${fields} cannot be empty`)
            }
		}

        
        const {status,user_id} = await authorize_token(req);
        if(status == "Failed"){
            return response_unauthorized(res,"Invalid Token");
        }
        const role:string = await check_role(user_id);
        if(role != "admin"){
            return response_unauthorized(res,"Invalid Access Level");
        }

        const shift_exist:Boolean = await check_exist("shifts",shift_id);
        if(!shift_exist){
            return response_bad_request(res,"Shift does not exist");
        }

        const shift_data:Data<Shifts> = await server.query(q.Get(q.Ref(q.Collection("shifts"),shift_id))); 
        if(!shift_data.data.approved){
            throw new Error("Cannot create a shift entry with a shift that has not been approved")
        }


        if(overtime_enabled){
            if(typeof overtime_enabled != "boolean"){
                throw new Error("overtime_enabled must be boolean")
            }
            if(overtime_enabled == true && !overtime_duration){
            throw new Error("Overtime duration field required if Overtime is enabled");
            }
            if(overtime_duration <= 0){
                throw new Error("Overtime duration fieldm must be above 0");
            }
            let end_time_conv:DateTime = DateTime.fromISO(shift_data.data.end_time,{zone:"UTC+7"});
            const date_limit = DateTime.fromObject({
                year:end_time_conv.year,
                month: end_time_conv.month,
                day: end_time_conv.day,
                hour:0,
                minute:0,
                second:0,
                millisecond:0,
    
            },{zone:"UTC+7"}).plus({days: 1})
            let end_time_with_ot:DateTime = end_time_conv.plus({minutes:overtime_duration})
    
            if(time_comparer(end_time_with_ot,date_limit) < 20){
                throw new Error("Shift with overtime duration must be within the same day with the max time at 23:40")
            }

        }


        if(Array.isArray(user_ref)){
            for (const item of user_ref){
                if(typeof item != "string"){
                    throw new Error("Value inside the user_ref array must be string")
                }

                const user_exist:Boolean = await check_exist("users",item);
                if(!user_exist){
                   throw new Error("One of the user inside the user_ref array does not exist")
                } 

                const shift_entry_exist:Boolean = await check_exist("shifts_entry",[item,shift_id],"by_user_id_and_shift_id");
                if(shift_entry_exist){
                    throw new Error("One of the user is already assigned to the shift")
                }
            }
  
            for (const item of user_ref){
                const shift_entry: Data<ShiftEntry> = await server.query(
                    q.Create(q.Collection('shifts_entry'),
                    {
                        data:{
                            user_id:item,
                            shift_id,
                            overtime_enabled: overtime_enabled?overtime_enabled:false,
                             ...(overtime_enabled == true && {overtime_duration}),
                            status:"created"
                        }
                    }
                    )
                )
                data.push(shift_entry.data);
            }


        }
        else{
            throw new Error('user_ref field must be an array')
        }
        
        
        return response_success(res,{"data": data},"Successfully Created Shift Entries")

    } catch (error:any) {
        if(error instanceof Error){
            return response_bad_request(res,error.message)
        } 
        return response_internal_server_error(res, error.message)
    }
}

export async function edit_shift_entry(req: Request, res: Response): Promise<Response> {
    try {
        const {shift_entry_id,overtime_enabled, overtime_duration,clock_in_time,clock_out_time,is_late,forgot_clockout,new_status} = req.body;
        const required_fields = [
			'shift_entry_id',
		];

		for (const fields of required_fields) {
			let valid = check_req_field(req.body[fields])
            if(!valid){
                throw new Error(`${fields} cannot be empty`)
            }
		}

        const {status,user_id} = await authorize_token(req);
        if(status == "Failed"){
            return response_unauthorized(res,"Invalid Token");
        }

        const role:string = await check_role(user_id);
        if(role != "admin"){
            return response_unauthorized(res,"Invalid Access Level");
        }

        const shift_exist:Boolean = await check_exist("shifts_entry",shift_entry_id);
        if(!shift_exist){
            return response_bad_request(res,"Shift Entry does not exist");
        }
        
        const original_data:Data<ShiftEntry> = await server.query(q.Get(q.Ref(q.Collection("shifts_entry"),shift_entry_id))); 
        if(overtime_enabled){
            if(typeof overtime_enabled != "boolean"){
                throw new Error("overtime_enabled must be boolean")
            }
            if(overtime_enabled == true){
                if(!original_data.data.overtime_duration){
                    if(!overtime_duration){
                        throw new Error("Overtime Duration is needed if overtime enabled is true");
                    }
                    if(typeof overtime_duration != "number"){
                        throw new Error("Overtime Duration must be number");
                    }
                    if(overtime_duration && overtime_duration <= 0){
                        throw new Error("Overtime duration field must be above 0");
                    }
                    let ot = overtime_duration?overtime_duration:original_data.data.overtime_duration
                    const shift_data:Data<Shifts> = await server.query(q.Get(q.Ref(q.Collection("shifts"),original_data.data.shift_id))); 
                    let end_time_conv:DateTime = DateTime.fromISO(shift_data.data.end_time,{zone:"UTC+7"});
                    const date_limit = DateTime.fromObject({
                        year:end_time_conv.year,
                        month: end_time_conv.month,
                        day: end_time_conv.day,
                        hour:0,
                        minute:0,
                        second:0,
                        millisecond:0,
        
                    },{zone:"UTC+7"}).plus({days: 1})
                    let end_time_with_ot:DateTime = end_time_conv.plus({minutes:ot})
                    if(time_comparer(end_time_with_ot,date_limit) < 20){
                        throw new Error("Shift with overtime duration must be within the same day with the max time at 23:40")
                    }
                }
            }
        } else if(overtime_duration && original_data.data.overtime_enabled){
            if(typeof overtime_duration != "number"){
                throw new Error("Overtime Duration must be number");
            }
            if(overtime_duration && overtime_duration <= 0){
                throw new Error("Overtime duration field must be above 0");
            }
            let ot = overtime_duration
            const shift_data:Data<Shifts> = await server.query(q.Get(q.Ref(q.Collection("shifts"),original_data.data.shift_id))); 
            let end_time_conv:DateTime = DateTime.fromISO(shift_data.data.end_time,{zone:"UTC+7"});
            const date_limit = DateTime.fromObject({
                year:end_time_conv.year,
                month: end_time_conv.month,
                day: end_time_conv.day,
                hour:0,
                minute:0,
                second:0,
                millisecond:0,
            },{zone:"UTC+7"}).plus({days: 1})
            let end_time_with_ot:DateTime = end_time_conv.plus({minutes:ot})
            if(time_comparer(end_time_with_ot,date_limit) < 20){
                throw new Error("Shift with overtime duration must be within the same day with the max time at 23:40")
            }
        }

        if(is_late){
            if(typeof is_late != "boolean"){
                throw new Error("is_late must be boolean")
            }
        }

        if(forgot_clockout){
            if(typeof forgot_clockout != "boolean"){
                throw new Error("forgot_clockout must be boolean")
            }
        }
        if(clock_in_time || clock_out_time){
            const [shift_start_time, shift_end_time] = await get_shift_start_and_end_time(original_data.data.shift_id)
            const start_time_conv = DateTime.fromISO(shift_start_time,{zone:"UTC+7"})
            const end_time_conv = DateTime.fromISO(shift_end_time,{zone:"UTC+7"})
            let clock_in_conv:DateTime = DateTime.local();
            let clock_out_conv:DateTime = DateTime.local(); 
            if(clock_in_time){
                const clock_in_valid = iso_string_checker(clock_in_time);
                if(!clock_in_valid){
                    throw new Error("Clock in time must be in iso string format")
                }
                clock_in_conv = DateTime.fromISO(clock_in_time,{zone:"UTC+7"})
                let clock_in_time_diff = time_comparer(clock_in_conv,start_time_conv)
                if( clock_in_time_diff >15|| clock_in_time_diff < -30){
                    throw new Error("Clock in time must be either 15 minutes before or at max 30 minutesafter the start time")
                }
            }
            if(clock_out_time){
                const clock_out_valid = iso_string_checker(clock_out_time);
                if(!clock_out_valid){
                    throw new Error("Clock out must be in iso string format")
                } 
                clock_out_conv = DateTime.fromISO(clock_out_time,{zone:"UTC+7"})
                if(overtime_enabled || (original_data.data.overtime_enabled && overtime_enabled == null)){
                    let overtime_duration_value = overtime_duration?overtime_duration:original_data.data.overtime_duration;
                    let end_time_plussed = end_time_conv.plus({"minutes":overtime_duration_value})
                    let clock_out_time_diff = time_comparer(clock_out_conv,end_time_plussed)
                    let clock_out_time_untampered = time_comparer(clock_out_conv,end_time_conv)
                    if( (clock_out_time_diff < -15)|| clock_out_time_untampered > 5){
                        throw new Error("Clock out time must be either 5 minutes before the shift start time or 15 minute after the shift end time + overtime duration")
                    }
                }else{
                    let clock_out_time_diff = time_comparer(clock_out_conv,end_time_conv)
                    if( clock_out_time_diff < -15|| clock_out_time_diff > 5){
                        throw new Error("Clock out time must be either 5 minutes before the shift start time or 15 minutes after the shift end time")
                    }
                }
            }
            if(clock_in_time && clock_out_time){
                clock_in_conv = DateTime.fromISO(clock_in_time,{zone:"UTC+7"})
                clock_out_conv = DateTime.fromISO(clock_out_time,{zone:"UTC+7"})
                if(time_comparer(clock_in_conv,clock_out_conv)<0){
                    throw new Error("Clock out must be greater or equal than clock in")
                }
            }
            else if(clock_in_time && original_data.data.clock_out){
                clock_out_conv = DateTime.fromISO(original_data.data.clock_out,{zone:"UTC+7"})
                if(time_comparer(clock_in_conv,clock_out_conv)<0){
                    throw new Error("Clock out must be greater or equal than clock in")
                }
            }
            else if(clock_out_time && original_data.data.clock_in){
                clock_in_conv = DateTime.fromISO(original_data.data.clock_in,{zone:"UTC+7"})
                if(time_comparer(clock_in_conv,clock_out_conv)<0){
                    throw new Error("Clock out must be greater or equal than clock in")
                }
            }
        }

        const shift_entry: Data<ShiftEntry> = await server.query(
            q.Update(q.Ref(q.Collection('shifts_entry'),shift_entry_id),
            {
                data:{
                    ...(is_late && {is_late}),
                    ...(forgot_clockout != null && {forgot_clockout}),
                    ...(clock_in_time && {clock_in:clock_in_time}),
                    ...(clock_out_time && {clock_out:clock_out_time}),
                    ...(overtime_enabled != null && {overtime_enabled}),
                    ...(overtime_enabled == true && {overtime_duration}),
                    ...(new_status && {"status":new_status})
                }
            }
            )
        )
        return response_success(res,{"id":shift_entry.ref.id,"data": shift_entry.data},"Successfully Updated Shift Entry")

    } catch (error:any) {
        if(error instanceof Error){
            return response_bad_request(res,error.message)
        } 
        return response_internal_server_error(res, error.message)
    }
}

export async function delete_shift_entry(req: Request, res: Response): Promise<Response> {
    try {
        const { shift_entry_id} = req.params; 
        const {status,user_id} = await authorize_token(req);
        if(status == "Failed"){
            return response_unauthorized(res,"Invalid Token");
        }
        const role:string = await check_role(user_id);
        if(role != "admin"){
            return response_unauthorized(res,"Invalid Access Level");
        }

        const shift_exist:Boolean = await check_exist("shifts_entry",shift_entry_id);
        if(!shift_exist){
            return response_bad_request(res,"Shift Entry does not exist");
        }
        const shift_entry_data: Data<ShiftEntry> = await server.query(
            q.Get(q.Ref(q.Collection("shifts_entry"),shift_entry_id))
        )
        if(shift_entry_data.data.image_url){
            let original_file_folder = shift_entry_data.data.image_url.split("/")[3];
            let original_file_name = shift_entry_data.data.image_url.split("/")[4]
            if(original_file_name != "default.png"){
                await delete_file_from_space(original_file_folder,original_file_name)
            }
        }
        if(shift_entry_data.data.image_clock_out_url){
            let original_file_folder = shift_entry_data.data.image_clock_out_url.split("/")[3];
            let original_file_name = shift_entry_data.data.image_clock_out_url.split("/")[4]
            if(original_file_name != "default.png"){
                await delete_file_from_space(original_file_folder,original_file_name)
            }
        }
        
        await server.query(q.Delete(q.Ref(q.Collection("shifts_entry"),shift_entry_id)))
        return response_success(res,{},`Successfully Deleted Shift Entry with id ${shift_entry_id}`)

    } catch (error:any) {
        if(error instanceof Error){
            return response_bad_request(res,error.message)
        } 
        return response_internal_server_error(res, error.message)
    }
}

export async function get_shift_entry(req: Request, res: Response): Promise<Response> {
    try {
        const { shift_entry_id} = req.params; 
        const {status,user_id} = await authorize_token(req);
        if(status == "Failed"){
            return response_unauthorized(res,"Invalid Token");
        }
        const role:string = await check_role(user_id);
        if(role != "admin"){
            return response_unauthorized(res,"Invalid Access Level");
        }

        const shift_exist:Boolean = await check_exist("shifts_entry",shift_entry_id);
        if(!shift_exist){
            return response_bad_request(res,"Shift Entry does not exist");
        }

        const shift_entry_data: Data<ShiftEntryDetails> = await server.query(
            q.Call(q.Function("shift_entry_details"),
            [shift_entry_id])
            )
        
       
        return response_success(res,{data: shift_entry_data.data},`Successfully Retrieved Shift Entry data with id ${shift_entry_id}`)

    } catch (error:any) {
        if(error instanceof Error){
            return response_bad_request(res,error.message)
        } 
        return response_internal_server_error(res, error.message)
    }
}


export async function clock_in(req: Request, res: Response): Promise<Response> {
    try {
        let clock_in_time = DateTime.now().setZone("UTC+7");
        const { shift_entry_id, location} = req.body;
        const required_fields = [
			'shift_entry_id',
            'location'
		];

		for (const fields of required_fields) {
			let valid = check_req_field(req.body[fields])
            if(!valid){
                throw new Error(`${fields} cannot be empty`)
            }
		}
        const location_splitted:Array<string> = location.split(",")
        if(location_splitted.length !=2){
            throw new Error("location length must be 2")
        }
        const converted_location = location_splitted.map((e:string) => {
            if(isNaN(parseFloat(e))){
                throw new Error("Langitude and Latitude must be number")
            }
            return parseFloat(e)
        })
        const {status,user_id} = await authorize_token(req);
        if(status == "Failed"){
            delete_file_from_space("attendanceimages",req.file?req.file.originalname:"")
            return response_unauthorized(res,"Invalid Token");
        }
        if(!req.file){
            throw new Error("User Selfie Image Required")
        }
        
        const shift_exist:Boolean = await check_exist("shifts_entry",shift_entry_id);
        if(!shift_exist){
            delete_file_from_space("attendanceimages",req.file?req.file.originalname:"")
            return response_bad_request(res,"Shift Entry does not exist");
        }

        const original_data:Data<ShiftEntry> = await server.query(q.Get(q.Ref(q.Collection("shifts_entry"),shift_entry_id))); 
        if(user_id != original_data.data.user_id){
            throw new Error("User assigned in the shift does not match")
        }
        const original_coordinates:Data<LocationFunction> = await server.query(q.Call(q.Function("location_array_by_shift_id"),original_data.data.shift_id))
        const currentposition = {
            latitude: converted_location[0],
            longitude: converted_location[1]
        }

        const officeposition = {
            latitude: original_coordinates.data.location_coordinates[0],
            longitude: original_coordinates.data.location_coordinates[1]
        }

        const position_valid:boolean = haversine(currentposition,officeposition,{unit:'km',threshold: 0.135})
        if(!position_valid){
            throw new Error("Position Invalid")
        }
        
        const [shift_start_time, shift_end_time] = await get_shift_start_and_end_time(original_data.data.shift_id)
        const setted_clock_in_time = DateTime.fromISO(shift_start_time,{ zone:"UTC+7"});
        const clock_in_time_dif: number = time_comparer(clock_in_time,setted_clock_in_time)
        
        if(clock_in_time_dif> 15 || clock_in_time_dif<-30){
            throw new Error("Can only check in atleast 15 minutes before or at max 30 minutes after the start time")
        }
        
        let picture_match:boolean = true
        const user_data: Data<Account> = await server.query(q.Get(q.Ref(q.Collection("users"),original_data.data.user_id))); 
        const face_recog: AxiosResponse|void = await axios.post('https://absensia-faceverification.herokuapp.com/face/verify',{
            file1:user_data.data.s3_image,
            file2:`https://assignmentsystem.s3.ap-southeast-1.amazonaws.com/attendanceimages/${req.file.originalname}`
        }).then((resp) => {
        let resp_obj:FaceRecogResponse = resp.data;
        picture_match = resp_obj.result
        }).catch((err:AxiosError<any, any>) =>{
            throw new Error("Error from the face recog server")
        })
        
        if(!picture_match){
            throw new Error("Face does not match")
        }
        let is_late = false;
        if(clock_in_time_dif<-15){
            is_late = true
        }
        if(original_data.data.image_url){
            let original_file_folder = original_data.data.image_url.split("/")[3];
            let original_file_name = original_data.data.image_url.split("/")[4]
            console.log(original_file_name)
            if(original_file_name != "default.png"){
                await delete_file_from_space(original_file_folder,original_file_name)
            }
        }

        const shift_entry: Data<ShiftEntry> = await server.query(
            q.Update(q.Ref(q.Collection('shifts_entry'),shift_entry_id),
            {
                data:{
                    status: "in-progress",
                    clock_in: clock_in_time.toISO().toString(),
                    image_url: `https://assignmentsystem.s3.ap-southeast-1.amazonaws.com/attendanceimages/${req.file.originalname}`,
                    is_late
                }
            }
            )
        )
        return response_success(res,{"id":shift_entry.ref.id},"Successfully Clocked In")

    } catch (error:any) {
        if(req.file){
        delete_file_from_space("attendanceimages",req.file.originalname)
        }
        if(error instanceof Error){
            return response_bad_request(res,error.message)
        } 
        return response_internal_server_error(res, error.message)
    }
}

export async function clock_out(req: Request, res: Response): Promise<Response> {
    try {
        let clock_out_time = DateTime.now().setZone("UTC+7");
        const { shift_entry_id, location} = req.body;
        const required_fields = [
			'shift_entry_id',
            'location'
		];

		for (const fields of required_fields) {
			let valid = check_req_field(req.body[fields])
            if(!valid){
                throw new Error(`${fields} cannot be empty`)
            }
		}
        const location_splitted:Array<string> = location.split(",")
        if(location_splitted.length !=2){
            throw new Error("location length must be 2")
        }
        const converted_location = location_splitted.map((e:string) => {
            if(isNaN(parseFloat(e))){
                throw new Error("Langitude and Latitude must be number")
            }
            return parseFloat(e)
        })
        const {status,user_id} = await authorize_token(req);
        if(status == "Failed"){
            return response_unauthorized(res,"Invalid Token");
        }        
        if(!req.file){
            throw new Error("User Selfie Image Required")
        }
        const shift_exist:Boolean = await check_exist("shifts_entry",shift_entry_id);
        if(!shift_exist){
            return response_bad_request(res,"Shift Entry does not exist");
        }

        const original_data:Data<ShiftEntry> = await server.query(q.Get(q.Ref(q.Collection("shifts_entry"),shift_entry_id))); 
        if(!original_data.data.clock_in){
            throw new Error("Cant clock out if you haven't clock in")
        }
        if(user_id != original_data.data.user_id){
            throw new Error("User assigned in the shift does not match")
        }
        const original_coordinates:Data<LocationFunction> = await server.query(q.Call(q.Function("location_array_by_shift_id"),original_data.data.shift_id))
        const currentposition = {
            latitude: converted_location[0],
            longitude: converted_location[1]
        }

        const officeposition = {
            latitude: original_coordinates.data.location_coordinates[0],
            longitude: original_coordinates.data.location_coordinates[1]
        }

        const position_valid:boolean = haversine(currentposition,officeposition,{unit:'km',threshold: 0.135})
        if(!position_valid){
            throw new Error("Position Invalid")
        }
        let picture_match:boolean = true
        const user_data: Data<Account> = await server.query(q.Get(q.Ref(q.Collection("users"),original_data.data.user_id))); 
        const face_recog: AxiosResponse|void = await axios.post('https://absensia-faceverification.herokuapp.com/face/verify',{
            file1:user_data.data.s3_image,
            file2:`https://assignmentsystem.s3.ap-southeast-1.amazonaws.com/attendanceimages/${req.file.originalname}`
        }).then((resp) => {
        let resp_obj:FaceRecogResponse = resp.data;
        picture_match = resp_obj.result
        }).catch((err:AxiosError<any, any>) =>{
            throw new Error("Error from the face recog server")
        })
        
        if(!picture_match){
            throw new Error("Face does not match")
        }

        if(original_data.data.image_clock_out_url){
            let original_file_folder = original_data.data.image_clock_out_url.split("/")[3];
            let original_file_name = original_data.data.image_clock_out_url.split("/")[4]
            console.log(original_file_name)
            if(original_file_name != "default.png"){
                await delete_file_from_space(original_file_folder,original_file_name)
            }
        }

        const [shift_start_time, shift_end_time] = await get_shift_start_and_end_time(original_data.data.shift_id)
        const setted_clock_out_time = DateTime.fromISO(shift_end_time,{ zone:"UTC+7"});
        let clock_out_diff = time_comparer(clock_out_time,setted_clock_out_time)
        if(clock_out_diff > 5){
            throw new Error("Can only clock out atleast 5 minutes before the end time")
        }
        
        if(original_data.data.overtime_enabled){
            const original_shift_plus_duration = DateTime.fromISO(shift_end_time,{zone:"UTC+7"}).plus({minutes:original_data.data.overtime_duration})
            clock_out_diff = time_comparer(clock_out_time,original_shift_plus_duration)
            if(clock_out_diff< -15){
                throw new Error("Can only clock out 15 minutes at max after the overtime duration")
            }
        }else{
            if(clock_out_diff < -15){
                throw new Error("Can only clock out 15 minutes at max after the end time")
            }
        }
        const shift_entry: Data<ShiftEntry> = await server.query(
            q.Update(q.Ref(q.Collection('shifts_entry'),shift_entry_id),
            {
                data:{
                    status: "finished",
                    clock_out: clock_out_time.toISO().toString(),
                    forgot_clockout: false,
                    image_clock_out_url: `https://assignmentsystem.s3.ap-southeast-1.amazonaws.com/attendanceimages/${req.file.originalname}`
                }
            }
            )
        )
        return response_success(res,{"id":shift_entry.ref.id},"Successfully Clocked Out")

    } catch (error:any) {
        if(req.file){
            delete_file_from_space("attendanceimages",req.file.originalname)
        }
        if(error instanceof Error){
            return response_bad_request(res,error.message)
        } 
        return response_internal_server_error(res, error.message)
    }
}

export async function paginate_shifts_entries(req: Request, res: Response): Promise<Response> {
    try {
        const { start_date,end_date,page,size} = req.body;
        const required_fields = [
			'start_date',
			'end_date',
            'page',
            'size'
		];

		for (const fields of required_fields) {
			let valid = check_req_field(req.body[fields])
            if(!valid){
                throw new Error(`${fields} cannot be empty`)
            }
		}

        const start_date_valid = sql_date_string_checker(start_date);
        if(!start_date_valid){
            throw new Error("Start date must be in YYYY-MM-dd string format")
        } 
        const end_date_valid = sql_date_string_checker(end_date);
        if(!end_date_valid){
            throw new Error("End date must be in YYYY-MM-dd string format")
        }

        const {status,user_id} = await authorize_token(req);
        if(status == "Failed"){
            return response_unauthorized(res,"Invalid Token");
        }
        const organization_id:String = await organization_id_by_user_id(user_id);
        
        if(typeof page != "number" || typeof size != "number"){
            throw new Error("page and size must be a number")
        }

        const start_date_conv = DateTime.fromSQL(start_date);
        const end_date_conv = DateTime.fromSQL(end_date);
        const paginate_start_date = DateTime.fromObject(
            {
                year:start_date_conv.year,
                month: start_date_conv.month,
                day: start_date_conv.day,
                hour:0,
                minute:0,
                second:0,
                millisecond:0,
            },{zone:"UTC+7"}
        )

        const paginate_end_date = DateTime.fromObject(
            {
                year:end_date_conv.year,
                month: end_date_conv.month,
                day: end_date_conv.day,
                hour:0,
                minute:0,
                second:0,
                millisecond:0,
            },{zone:"UTC+7"}
        )
        
        if(time_comparer(paginate_start_date,paginate_end_date) <0){
            throw new Error("End date must be greater or equal to start date")
        }
        const shift_entry: PaginateArray<Array<ShiftEntriesUserPaginateData|String>> = await server.query(
            q.Call(q.Function("paginate_shift_entries_user"),
            [organization_id,paginate_start_date.toISO().toString(),paginate_end_date.toISO().toString(),user_id,page,size])
            )
        if(shift_entry.data[0] == "invalid"){
            throw new Error("invalid pagination page");
        }
        return response_success(res,{"data": shift_entry.data, "current_page": shift_entry.current_page, "total_page": shift_entry.total_page},"Succesfully Paginate Data")

    } catch (error:any) {
        if(error instanceof Error){
            return response_bad_request(res,error.message)
        } 
        return response_internal_server_error(res, error.message)
    }
}


const cronjob = cron.schedule('0 0 * * *', async () => {
    const current_time = DateTime.now().setZone("UTC+7");
    const constructed_time = DateTime.fromObject({
        year:current_time.year,
        month: current_time.month,
        day: current_time.day,
        hour:0,
        minute:0,
        second:0,
        millisecond:0,
    }, {zone:"UTC+7"});
    console.log(constructed_time.toISO().toString());
    let shift_entry_filtered_arrays:CronArray = await server.query(q.Call(q.Function("cron_function"),constructed_time.toISO().toString()));
    const absent: Array<Data<ShiftEntry>> = shift_entry_filtered_arrays.data.absent
    const ot_enabled: Array<Data<ShiftEntry>> = shift_entry_filtered_arrays.data.ot_enabled
    const ot_disabled: Array<Data<ShiftEntry>> = shift_entry_filtered_arrays.data.ot_disabled

    console.log(absent);
    if(ot_enabled.length == 0){
        console.log("No data to update for ot_enabled")
    }
    else{
        for (const e of ot_enabled){
            const shift_exist:Boolean = await check_exist("shifts_entry",e.ref.id);
            if(shift_exist){
                const [shift_start_time, shift_end_time] = await get_shift_start_and_end_time(e.data.shift_id);
                await server.query(q.Update(q.Ref(q.Collection("shifts_entry"),e.ref.id),{
                    data:{
                        clock_out: DateTime.fromISO(shift_end_time,{zone:"UTC+7"}).plus({minutes:e.data.overtime_duration}).toISO().toString(),
                        status:"finished",
                        forgot_clockout: true
                    }
                }))
            }
        }
    }
    console.log("working until here");
    if(ot_disabled.length == 0){
        console.log("No Data to update for ot_disabled")
    } else{
        for (const e of ot_disabled){
            const shift_exist:Boolean = await check_exist("shifts_entry",e.ref.id);
            if(shift_exist){
                const [shift_start_time, shift_end_time] = await get_shift_start_and_end_time(e.data.shift_id);
                await server.query(q.Update(q.Ref(q.Collection("shifts_entry"),e.ref.id),{
                    data:{
                        clock_out: DateTime.fromISO(shift_end_time,{zone:"UTC+7"}).toISO().toString(),
                        status:"finished",
                        forgot_clockout: true
                    }
                }))
            }
        }
    }
    if(absent.length == 0){
        console.log("No Data to update for absent")
    } else{
        for (const e of absent){
            const shift_exist:Boolean = await check_exist("shifts_entry",e.ref.id);
            if(shift_exist){
                const [shift_start_time, shift_end_time] = await get_shift_start_and_end_time(e.data.shift_id);
                await server.query(q.Update(q.Ref(q.Collection("shifts_entry"),e.ref.id),{
                    data:{
                        status:"absent",
                    }
                }))
            }
        }
    }
    
}, {
    scheduled: true,
    timezone: 'Asia/Jakarta',
})


