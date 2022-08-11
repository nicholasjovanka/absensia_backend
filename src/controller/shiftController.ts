import {server,q, client} from '../fauna_utils'
import type { Request, Response } from 'express';
import { DateTime } from "luxon";
import { response_bad_request, response_success, response_internal_server_error, response_unauthorized } from '../response_utils';
import type { Credentials, Data, Shifts, AuthorizeToken } from '../interfaces/interface';
import { authorize_token, check_req_field,check_role, check_exist, iso_string_checker,organization_id_by_user_id, time_comparer } from '../utils';
import e from 'express';

export async function create_shifts(req: Request, res: Response): Promise<Response> {
    try {
        const { shift_name,start_time, end_time, location_id} = req.body;
        const required_fields = [
			'shift_name',
			'start_time',
            'end_time',
            'location_id'
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

        const location_exist:Boolean = await check_exist("locations",location_id);
        if(!location_exist){
            return response_bad_request(res,"Location does not exist");
        }
        const start_date_valid = iso_string_checker(start_time);
        if(!start_date_valid){
            throw new Error("Start time must be in iso string format")
        } 
        const end_date_valid = iso_string_checker(end_time);
        if(!end_date_valid){
            throw new Error("End time must be in iso string format")
        } 
        
        // const current_date = DateTime.now().setZone("UTC+7")
        const start_time_conv = DateTime.fromISO(start_time,{zone:"UTC+7"})
        const end_time_conv = DateTime.fromISO(end_time,{zone:"UTC+7"})
        const date_limit = DateTime.fromObject({
            year:start_time_conv.year,
            month: start_time_conv.month,
            day: start_time_conv.day,
            hour:0,
            minute:0,
            second:0,
            millisecond:0,

        },{zone:"UTC+7"}).plus({days: 1})

        // if(start_time_conv.diff(current_date,["minutes"]).minutes < 180){
        //     throw new Error("Shift must be made at max 3 hours before the shift actual start time")
        // }

        if(time_comparer(start_time_conv,end_time_conv) <30){
            throw new Error("Time between the end shift and start shift must be 30 mins apart")
        }
        if(time_comparer(end_time_conv,date_limit) < 20){
            throw new Error("Shift must be within the same day with the max time at 23:40")
        }
        const organization_id:String = await organization_id_by_user_id(user_id);
        const shift: Data<Shifts> = await server.query(
            q.Create(q.Collection('shifts'),
            {
                data:{
                    shift_name,
                    start_time,
                    end_time,
                    approved: false,    
                    location_id,
                    organization_id
                }
            }
            )
        )
        return response_success(res,{"id":shift.ref.id,"data": shift.data},"Successfully Created Shift")

    } catch (error:any) {
        if(error instanceof Error){
            return response_bad_request(res,error.message)
        } 
        return response_internal_server_error(res, error.message)
    }
}

export async function get_shift(req: Request, res: Response): Promise<Response> {
    try {
        const { shift_id} = req.params; 
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

        const shift:Data<Shifts> = await server.query(q.Get(q.Ref(q.Collection("shifts"),shift_id)))
        
        return response_success(res,{data:shift.data},`Success`)

    } catch (error:any) {
        if(error instanceof Error){
            return response_bad_request(res,error.message)
        } 
        return response_internal_server_error(res, error.message)
    }
}

export async function edit_shift(req: Request, res: Response): Promise<Response> {
    try {
        const { shift_id, shift_name,start_time, end_time, location_id} = req.body;
        const required_fields = [
			'shift_id',
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

        const shift_exist:Boolean = await check_exist("shifts",shift_id);
        if(!shift_exist){
            return response_bad_request(res,"Shift does not exist");
        }

        const original_data:Data<Shifts> = await server.query(q.Get(q.Ref(q.Collection("shifts"),shift_id))); 
        if(original_data.data.approved == true){
            return response_bad_request(res,"An approved shift cannot be editted")
        }
        // const current_date = DateTime.now().setZone("UTC+7")
        // const original_data_start_time = DateTime.fromISO(original_data.data.start_time,{zone:"UTC+7"})
        // if(original_data_start_time.diff(current_date,["minutes"]).minutes<= 60)
        // {
        //     throw new Error("Cannot edit a shift whose start time has passed or going to start in 60 minutes")
        // }


        if(location_id){
            const location_exist:Boolean = await check_exist("locations",location_id);
            if(!location_exist){
                return response_bad_request(res,"Location does not exist");
            }
        }
        if(start_time){
            const start_date_valid = iso_string_checker(start_time);
            if(!start_date_valid){
                throw new Error("Start time must be in iso string format")
            }
        }
        if(end_time){
            const end_date_valid = iso_string_checker(end_time);
            if(!end_date_valid){
                throw new Error("End time must be in iso string format")
            } 
        }

        if(start_time || end_time){
            let start_time_conv:DateTime;
            let end_time_conv:DateTime;

            if(start_time && !end_time){
                start_time_conv = DateTime.fromISO(start_time,{zone:"UTC+7"})
                end_time_conv = DateTime.fromISO(original_data.data.end_time,{zone:"UTC+7"})
            }
            else if (!start_time && end_time){
                start_time_conv = DateTime.fromISO(original_data.data.start_time,{zone:"UTC+7"})
                end_time_conv = DateTime.fromISO(end_time,{zone:"UTC+7"})
            }
            else{
                start_time_conv = DateTime.fromISO(start_time,{zone:"UTC+7"})
                end_time_conv = DateTime.fromISO(end_time,{zone:"UTC+7"})
            }

            // if(start_time_conv.diff(current_date,["hours"]).hours < 3){
            //     throw new Error("Shift Start Time must atleast be 3 hours before the shift actual start time")
            // }

            if(time_comparer(start_time_conv,end_time_conv) <30){
                throw new Error("Time between the end shift and start shift must be 30 mins apart")
            }

            const date_limit = DateTime.fromObject({
                year:start_time_conv.year,
                month: start_time_conv.month,
                day: start_time_conv.day,
                hour:0,
                minute:0,
                second:0,
                millisecond:0,
    
            },{zone:"UTC+7"}).plus({days: 1})
    
    
            if(time_comparer(end_time_conv,date_limit) < 20){
                throw new Error("Shift must be within the same day with the max time at 23:40")
            }
        }
  

        const shift: Data<Shifts> = await server.query(
            q.Update(q.Ref(q.Collection('shifts'),shift_id),
            {
                data:{
                    ...(shift_name && {shift_name}),
                    ...(start_time && {start_time}),
                    ...(end_time && {end_time}),
                    ...(location_id && {location_id}),
                }
            }
            )
        )
        return response_success(res,{"id":shift.ref.id,"data": shift.data},"Successfully Updated Shift")

    } catch (error:any) {
        if(error instanceof Error){
            return response_bad_request(res,error.message)
        } 
        return response_internal_server_error(res, error.message)
    }
}

export async function approve_shift(req: Request, res: Response): Promise<Response> {
    try {
        const { shift_id} = req.body;
        const required_fields = [
			'shift_id',
		];
        for (const fields of required_fields) {
			let valid = check_req_field(req.body[fields])
            if(!valid){
                throw new Error(`${fields} cannot be empty`)
            }
		}
        let failed_array: string[]= []

        const {status,user_id} = await authorize_token(req);
        if(status == "Failed"){
            return response_unauthorized(res,"Invalid Token");
        }
        const role:string = await check_role(user_id);
        if(role != "admin"){
            return response_unauthorized(res,"Invalid Access Level");
        }

        let errors = [];
        if(Array.isArray(shift_id)){
            for (const item of shift_id){
                if(typeof item != "string"){
                    throw new Error('Value inside shift_id array must be a string')
                }
            }
            for (const item of shift_id){
                const shift_exist:Boolean = await check_exist("shifts",item);
                if(!shift_exist){
                    failed_array.push(item)
                } else{
                    const original_data:Data<Shifts> = await server.query(q.Get(q.Ref(q.Collection("shifts"),item))); 
                    const shift: Data<Shifts> = await server.query(
                        q.Update(q.Ref(q.Collection('shifts'),item),
                        {
                            data:{
                                approved: true
                            }
                        }
                        )
                    )
                }
            } 
        }else{
            throw new Error('shift id field must be an array')
        }
        return response_success(res,{"data":failed_array},`Successfully Approved Shifts`)

    } catch (error:any) {
        if(error instanceof Error){
            return response_bad_request(res,error.message)
        } 
        return response_internal_server_error(res, error.message)
    }
}

export async function delete_shift(req: Request, res: Response): Promise<Response> {
    try {
        const { shift_id} = req.params;
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

        const original_data:Data<Shifts> = await server.query(q.Get(q.Ref(q.Collection("shifts"),shift_id))); 
        if(original_data.data.approved == true){
            return response_bad_request(res,"Cannot delete Approved Shift")
        }
        await server.query(
            q.Delete(q.Ref(q.Collection('shifts'),shift_id))
        )
        return response_success(res,{},`Successfully Deleted Shift for  ${shift_id}`)

    } catch (error:any) {
        if(error instanceof Error){
            return response_bad_request(res,error.message)
        } 
        return response_internal_server_error(res, error.message)
    }
}
