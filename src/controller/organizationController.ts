import {server,q, client} from '../fauna_utils'
import type { Request, Response } from 'express';
import { response_bad_request, response_success, response_internal_server_error, response_unauthorized } from '../response_utils';
import { authorize_token, check_req_field,check_role, organization_id_by_user_id, check_location_exist, check_exist } from '../utils';
import type { Locations,Data } from "../interfaces/interface";
export async function edit_organization(req: Request, res: Response): Promise<Response> {
    try {
        const { organization_name } = req.body;
        const required_fields = [
			'organization_name',
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
        const organization_id:String = await organization_id_by_user_id(user_id)
        const organization: Data<Locations> = await server.query(
            q.Update(q.Ref(q.Collection("organization"),organization_id),
            {
                data:{
                    organization_name
                }
            }
            )
        )
        return response_success(res,{"data": organization.data},"Successfully Updated Organization Name");

    } catch (error:any) {
        if(error instanceof Error){
            return response_bad_request(res,error.message)
        } 
        return response_internal_server_error(res, error.message)
    }
}