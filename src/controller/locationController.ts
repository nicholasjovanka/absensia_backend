import {server,q, client} from '../fauna_utils'
import type { Request, Response } from 'express';
import { response_bad_request, response_success, response_internal_server_error, response_unauthorized } from '../response_utils';
import { authorize_token, check_req_field,check_role, organization_id_by_user_id, check_location_exist, check_exist } from '../utils';
import type { AuthorizeToken,Locations,Data } from "../interfaces/interface";
import { type } from 'os';


export async function create_location(req: Request, res: Response): Promise<Response> {
    try {
        const { location_name, location_coordinates } = req.body;
        const required_fields = [
			'location_name',
			'location_coordinates',
		];
		for (const fields of required_fields) {
			let valid = check_req_field(req.body[fields])
            if(!valid){
                throw new Error(`${fields} cannot be empty`)
            }
		}
        if(Array.isArray(location_coordinates)){
            if(location_coordinates.length == 2){
                for (const item of location_coordinates){
                    if(typeof item != "number"){
                        throw new Error('Value inside location coordinate array must be a number')
                    }
                }
            } else{
                throw new Error("Location Coordinate Array Length must be 2")
            }
        }else{
            throw new Error('location coordinates must be an array')
        }
        const {status,user_id} = await authorize_token(req);
        if(status == "Failed"){
            return response_unauthorized(res,"Invalid Token");
        }
        const role:string = await check_role(user_id);
        if(role != "admin"){
            return response_unauthorized(res,"Invalid Access Level");
        }
        const organization_id:String = await organization_id_by_user_id(user_id)
        const location_exist = await check_location_exist(location_name,organization_id)
        if(location_exist){
            throw new Error("Location name already have been used for this organization")
        }
        const location: Data<Locations> = await server.query(
            q.Create(q.Collection('locations'),
            {
                data:{
                    location_name,
                    location_coordinates,
                    organization_id,
                }
            }
            )
        )
        return response_success(res,{"id":location.ref.id,"data": location.data},"Successfully Created Location")

    } catch (error:any) {
        if(error instanceof Error){
            return response_bad_request(res,error.message)
        } 
        return response_internal_server_error(res, error.message)
    }
}

export async function get_location(req: Request, res: Response): Promise<Response> {
    try {
        const { location_id} = req.params;  
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
        const location_data:Data<Locations> = await server.query(
            q.Get(q.Ref(q.Collection("locations"),location_id))
        )
        return response_success(res,{data:location_data.data},"Successfully Get Location")

    } catch (error:any) {
        if(error instanceof Error){
            return response_bad_request(res,error.message)
        } 
        return response_internal_server_error(res, error.message)
    }
}


export async function edit_location(req: Request, res: Response): Promise<Response> {
    try {
        const { location_id,location_name, location_coordinates } = req.body;
        const required_fields = [
			'location_id',
		];
		for (const fields of required_fields) {
			let valid = check_req_field(req.body[fields])
            if(!valid){
                throw new Error(`${fields} cannot be empty`)
            }
		}
        if(location_coordinates){
            if(Array.isArray(location_coordinates)){
                if(location_coordinates.length == 2){
                    for (const item of location_coordinates){
                        if(typeof item != "number"){
                            throw new Error('Value inside location coordinate array must be a number')
                        }
                    }
                }
            else{
                throw new Error("Location Coordinate Array Length must be 2")
            }
        }else{
            throw new Error('location coordinates must be an array')
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
        const organization_id:String = await organization_id_by_user_id(user_id)
        
        const location_exist:Boolean = await check_exist("locations",location_id);
        if(!location_exist){
            return response_bad_request(res,"Location does not exist");
        }

        const original_data: Data<Locations> = await server.query(q.Get(q.Ref(q.Collection("locations"),location_id))); 
        if(location_name && location_name.replace(/\s/g,"").toLowerCase() != original_data.data.location_name.replace(/\s/g,"").toLowerCase()){
            const location_exist = await check_location_exist(location_name,organization_id)
            if(location_exist){
                throw new Error("Location name already have been used for this organization")
            }
        }
        const location: Data<Locations> = await server.query(
            q.Update(q.Ref(q.Collection("locations"),location_id),
            {
                data:{
                    ...(location_name && {location_name}),
                    ...(location_coordinates && {location_coordinates}),
                }
            }
            )
        )
        return response_success(res,{"id":location.ref.id,"data": location.data},"Successfully Updated Location")

    } catch (error:any) {
        if(error instanceof Error){
            return response_bad_request(res,error.message)
        } 
        return response_internal_server_error(res, error.message)
    }
}


export async function paginate_location(req: Request, res: Response): Promise<Response> {
    try {
        const {status,user_id} = await authorize_token(req);

        if(status == "Failed"){
            return response_unauthorized(res,"Invalid Token");
        }
        const role:string = await check_role(user_id);
        const organization_id:String = await organization_id_by_user_id(user_id)
        const location: Data<Array<Locations>> = await server.query(
            q.Paginate(q.Match(q.Index("locations_name_and_id_by_organization_id"),organization_id), {size:q.Count(q.Match(q.Index("locations_name_and_id_by_organization_id"),organization_id))}))
        return response_success(res,{"data":location.data},"Successfully Get Location List")

    } catch (error:any) {
        if(error instanceof Error){
            return response_bad_request(res,error.message)
        } 
        return response_internal_server_error(res, error.message)
    }
}



export async function delete_location(req: Request, res: Response): Promise<Response> {
    try {
        const { location_id} = req.params;  
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
        await server.query(
            q.Delete(q.Ref(q.Collection('locations'),location_id))
        )
        return response_success(res,{},"Successfully Deleted Location")

    } catch (error:any) {
        if(error instanceof Error){
            return response_bad_request(res,error.message)
        } 
        return response_internal_server_error(res, error.message)
    }
}