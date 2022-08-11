import {server,q, client} from '../fauna_utils'
import type { Request, Response } from 'express';
import { DateTime } from "luxon";
import { response_bad_request, response_success, response_internal_server_error, response_unauthorized } from '../response_utils';
import type { Credentials, Data, Account, AuthorizeToken, CronArray, ShiftEntry } from '../interfaces/interface';
import { authorize_token, check_req_field,check_role, check_exist, organization_id_by_user_id, get_shift_start_and_end_time, sql_date_string_checker, valid_email, valid_phone_number} from '../utils';
import { delete_file_from_space } from '../s3_utils';



export async function login(req: Request, res: Response): Promise<Response> {
    try {
        const { email, password} = req.body;

        const login_data: Credentials = await server.query(
            q.Login(q.Match(q.Index("users_ref_by_email"),email),{password, ttl: q.TimeAdd(q.Now(), 3, 'days')})
        )

        const [token, user_ref] = [login_data.secret,login_data.instance]
        const user: Data<Account> = await client(token).query(q.Get(user_ref));
        const faunadb_token = `fauna ${token}`;
        return response_success(res,{"id":user.ref.id,faunadb_token,"data": user.data},"Successful Login")

    } catch (error:any) {
        if(error instanceof Error){
            return response_bad_request(res,error.message)
        } 
        return response_internal_server_error(res, error.message)
    }
}


export async function create_user(req: Request, res: Response): Promise<Response> {
    try {
        const { name,email,birthdate,address,phonenumber} = req.body;
        const required_fields = [
			'name',
			'email',
		];
        console.log(name);
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
        if(!valid_email(email)){
            throw new Error("Email is invalid")
        }
        if(phonenumber){
            if(!valid_phone_number(phonenumber)){
                throw new Error("Phone is invalid")
            }
        }
        if(birthdate){
            const birthdate_valid = sql_date_string_checker(birthdate);
            if(!birthdate_valid){
                throw new Error("Birthdate must be in YYYY-MM-dd string format")
            } 
        }

        const email_exist = await check_exist("users",email,"ref_by_email")
        if(email_exist){
            return response_bad_request(res,"Email already have been used");
        }

        let image_file = req.file? `https://assignmentsystem.s3.ap-southeast-1.amazonaws.com/userimages/${req.file.originalname}`:`https://assignmentsystem.s3.ap-southeast-1.amazonaws.com/userimages/default.png`
        const organization_id:String = await organization_id_by_user_id(user_id)
        const user: Data<Account> = await server.query(
            q.Create(q.Collection('users'),
            {
                credentials: {password:"default password"},
                data:{
                    name,
                    email,
                    organization_id,
                    role:"user",
                    s3_image: image_file,
                    birthdate: birthdate?birthdate:"none",
                    address: address?address:"none",
                    phonenumber: phonenumber?phonenumber:"none",
                }
            }
            )
        )
        return response_success(res,{"id":user.ref.id,"data": user.data},"Successfully Created User")

    } catch (error:any) {
        if(req.file){
            delete_file_from_space("userimages",req.file.originalname)
            }
        if(error instanceof Error){
            return response_bad_request(res,error.message)
        } 
        return response_internal_server_error(res, error.message)
    }
}

export async function get_user_data(req: Request, res: Response): Promise<Response> {
    try {
        const {user_ref} = req.body;
        const {status,user_id}:AuthorizeToken = await authorize_token(req)
        if(status == "Failed"){
            return response_unauthorized(res)
        }
        const role:string = await check_role(user_id);

        if(user_ref){
            if(role!= "admin" && user_id != user_ref){
                return response_unauthorized(res,"Invalid Access Level");
            }
        }

        let user_id_to_search = user_ref?user_ref:user_id
        const user_exist:Boolean = await check_exist("users",user_id_to_search);
        if(!user_exist){
            return response_bad_request(res,"User does not exist");
        }
        const user_data: Data<Account> = await server.query(q.Get(q.Ref(q.Collection("users"),user_id_to_search))); 
        return response_success(res,{"id":user_data.ref.id,"data": user_data.data},"Success");
        
    } catch (error:any) {
        if(error instanceof Error){
            return response_bad_request(res,error.message)
        } 
        return response_internal_server_error(res, error.message)
    }
}

export async function validate_token(req: Request, res: Response): Promise<Response> {
    try {
        const {status,user_id}:AuthorizeToken = await authorize_token(req)
        if(status == "Failed"){
            return response_unauthorized(res)
        }
        const role:string = await check_role(user_id);
        return response_success(res,{"data":{status,user_id,role}},"Success");
        
        
    return response_success(res,{"data":"data"},"Successful Login")

    } catch (error:any) {
        if(error instanceof Error){
            return response_bad_request(res,error.message)
        } 
        return response_internal_server_error(res, error.message)
    }
}

export async function edit_user_admin(req: Request, res: Response): Promise<Response> {
    try {
        const { user_ref,name,email,birthdate,address,phonenumber,password} = req.body;
        const required_fields = [
			'user_ref',
		];

		for (const fields of required_fields) {
			let valid = check_req_field(req.body[fields])
            if(!valid){
                throw new Error(`${fields} cannot be empty`)
            }
		}
        const {status,user_id}:AuthorizeToken = await authorize_token(req)
        if(status == "Failed"){
            return response_unauthorized(res)
        }
        const role:string = await check_role(user_id);
        if(role != "admin"){
            return response_unauthorized(res,"Invalid Access Level");
        }
        const user_exist:Boolean = await check_exist("users",user_ref);
        if(!user_exist){
            return response_bad_request(res,"User does not exist");
        }
        const original_data: Data<Account> = await server.query(q.Get(q.Ref(q.Collection("users"),user_ref))); 
        if(email){
            if(!valid_email(email)){
                throw new Error("Email is invalid")
            }
        }
        if(phonenumber){
            if(!valid_phone_number(phonenumber)){
                throw new Error("Phone is invalid")
            }
        }
        if(birthdate){
            const birthdate_valid = sql_date_string_checker(birthdate);
            if(!birthdate_valid){
                throw new Error("Birthdate must be in YYYY-MM-dd string format")
            } 
        }
        if(email && email!=original_data.data.email){
            const email_exist = await check_exist("users",email,"ref_by_email");
            if(email_exist){
                return response_bad_request(res,"Email already have been used");
            }
        }
        let data;
        if(req.file){
            data = {
                ...(name && {name}),
                ...(email && {email}),
                s3_image: `https://assignmentsystem.s3.ap-southeast-1.amazonaws.com/userimages/${req.file.originalname}`,
                ...(birthdate && {birthdate}),
                ...(address && {address}),
                ...(phonenumber && {phonenumber})
            }
            let original_file_folder = original_data.data.s3_image.split("/")[3];
            let original_file_name = original_data.data.s3_image.split("/")[4]
            console.log(original_file_name)
            if(original_file_name != "default.png"){
                await delete_file_from_space(original_file_folder,original_file_name)
            }
        }
        else{
            data = {
                ...(name && {name}),
                ...(email && {email}),
                ...(birthdate && {birthdate}),
                ...(address && {address}),
                ...(phonenumber && {phonenumber})
            }
        }
        const update_data: Data<Account> = await server.query(
            q.Update(q.Ref(q.Collection("users"),user_ref),
            {
                ...(password && {credentials:{password}} ),
                data
            })
        )
        return response_success(res,{"id":update_data.ref.id,"data": update_data.data},"Success");
        

    } catch (error:any) {
        if(req.file){
            delete_file_from_space("userimages",req.file.originalname)
            }
        if(error instanceof Error){
            return response_bad_request(res,error.message)
        } 
        return response_internal_server_error(res, error.message)
    }
}


export async function edit_user(req: Request, res: Response): Promise<Response> {
    try {
        const {name,email,birthdate,address,phonenumber,password} = req.body;
        const {status,user_id}:AuthorizeToken = await authorize_token(req)
        if(status == "Failed"){
            return response_unauthorized(res)
        }
        const user_exist:Boolean = await check_exist("users",user_id);
        if(!user_exist){
            return response_bad_request(res,"User does not exist");
        }
        if(email){
            if(!valid_email(email)){
                throw new Error("Email is invalid")
            }
        }
        if(phonenumber){
            if(!valid_phone_number(phonenumber)){
                throw new Error("Phone is invalid")
            }
        }
        if(birthdate){
            const birthdate_valid = sql_date_string_checker(birthdate);
            if(!birthdate_valid){
                throw new Error("Birthdate must be in YYYY-MM-dd string format")
            } 
        }
        const original_data: Data<Account> = await server.query(q.Get(q.Ref(q.Collection("users"),user_id))); 
        if(email && email!=original_data.data.email){
            const email_exist = await check_exist("users",email,"ref_by_email");
            if(email_exist){
                return response_bad_request(res,"Email already have been used");
            }
        }
        let data;

        data = {
                ...(name && {name}),
                ...(email && {email}),
                ...(birthdate && {birthdate}),
                ...(address && {address}),
                ...(phonenumber && {phonenumber})
         }
        const update_data: Data<Account> = await server.query(
            q.Update(q.Ref(q.Collection("users"),user_id),
            {
                ...(password && {credentials:{password}} ),
                data
            })
        )
        return response_success(res,{"id":update_data.ref.id,"data": update_data.data},"Success");
        

    } catch (error:any) {
        if(error instanceof Error){
            return response_bad_request(res,error.message)
        } 
        return response_internal_server_error(res, error.message)
    }
}


export async function log_out(req: Request, res: Response): Promise<Response> {
    try {
        const {status,user_id}:AuthorizeToken = await authorize_token(req)
        if(status == "Failed"){
            return response_unauthorized(res)
        }
        const token_header = req.headers.authorization?.split(" ");
        const token = token_header?.length == 3? token_header[2]:token_header?token_header[1]:"";
        const user = client(token?token:"")
        await user.query(q.Logout(true));
        return response_success(res,{},"Successfully Logged Out")

    } catch (error:any) {
        if(error instanceof Error){
            return response_bad_request(res,error.message)
        } 
        return response_internal_server_error(res, error.message)
    }
}

export async function delete_user(req: Request, res: Response): Promise<Response> {
    try {
        const { user_ref} = req.params;
        const {status,user_id}:AuthorizeToken = await authorize_token(req)
        if(status == "Failed"){
            return response_unauthorized(res)
        }
        const role:string = await check_role(user_id);
        if(role != "admin"){
            return response_unauthorized(res,"Invalid Access Level");
        }
        const user_exist:Boolean = await check_exist("users",user_ref);
        if(!user_exist){
            return response_bad_request(res,"User does not exist");
        }

        const shifts_id: Data<string[]> = await server.query(q.Paginate
            (q.Match(q.Index("shift_entry_by_user_id"),user_ref),{size:q.Count(q.Match(q.Index("shift_entry_by_user_id"),user_ref))}))
            
        if(shifts_id.data.length > 0){
            for (const shift_id of shifts_id.data){
            const shift_entry_data: Data<ShiftEntry> = await server.query(
                q.Get(q.Ref(q.Collection("shifts_entry"),shift_id))
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
            await server.query(q.Delete(q.Ref(q.Collection("shifts_entry"),shift_id)))
           }
        }

        const original_data: Data<Account> = await server.query(q.Get(q.Ref(q.Collection("users"),user_ref))); 
        let original_file_folder = original_data.data.s3_image.split("/")[3];
        let original_file_name = original_data.data.s3_image.split("/")[4]
        console.log(original_file_name)
        if(original_file_name != "default.png"){
            await delete_file_from_space(original_file_folder,original_file_name)
        }
        await server.query(q.Delete(q.Ref(q.Collection("users"),user_ref)))
        return response_success(res,{},"Successfully Deleted User")

    } catch (error:any) {
        if(error instanceof Error){
            return response_bad_request(res,error.message)
        } 
        return response_internal_server_error(res, error.message)
    }
}


