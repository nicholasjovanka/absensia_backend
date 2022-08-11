import { server, q } from "./fauna_utils";
import type {Request} from 'express';
import axios, { AxiosResponse } from 'axios';
import type { AxiosError } from 'axios';
import type {  Data } from './interfaces/interface';
import type { AuthorizeToken } from "./interfaces/interface";
import { DateTime } from "luxon";
export const authorize_token = async (req:Request): Promise<AuthorizeToken> => {
    const token_header = req.headers.authorization?.split(" ");
    const token = token_header?.length == 3? token_header[2]:token_header?token_header[1]:"";
    let response_status:Boolean = true;
    const ax_resp:AxiosResponse|void = await axios.get('https://db.fauna.com/tokens/self', {
    // Axios looks for the `auth` option, and, if it is set, formats a
    // basic auth header for you automatically.
    auth: {
        username: <string> token,
        password: ''
    }
    }).catch((err:AxiosError)=>{
        if(err.response?.status == 401){
       response_status = false
        }
    })
    if(!response_status){
            return {status: "Failed", user_id:""}  
    }
    return {status: "Success", user_id:ax_resp?.data?.resource.instance['@ref'].id}

}

export const check_req_field = (req_field:any):Boolean => {
    if (req_field == null || req_field == ''){
        return false;
    }
    return true;
}

export const valid_email = (email:string):boolean => {
    let regexp = new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
    return regexp.test(email);
}

export const valid_phone_number = (phone_number:string):boolean =>{
    let regexp = new RegExp(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im)
    return regexp.test(phone_number)
}

export const check_role = async (user_id:string):Promise<string> => {
    const role:Data<Array<string>>= await server.query(q.Paginate(q.Match(q.Index("role_by_ref"),user_id)))
    return role.data[0];
}

export const organization_id_by_user_id = async(user_id:string):Promise<string> => {
    const organization_id:Data<Array<string>> = await server.query(q.Paginate(q.Match(q.Index("organization_id_by_ref_id"),user_id)))
    return organization_id.data[0];
}

export const check_exist = async (collection_name:string, identifier:any,index:String=""): Promise<Boolean> =>{
    let exist:Boolean = false;
    if(index != ""){
        const index_name:String = `${collection_name}_${index}`
        exist = await server.query(q.Exists(q.Match(q.Index(index_name), identifier)))
    }else{
     exist = await server.query(q.Exists(q.Ref(q.Collection(collection_name),identifier)))
    }
    return exist;
}


export const check_location_exist = async (location_name:String,organization_id:String): Promise<Boolean> => {
    const location_exist: Data<Array<string>> = await server.query(q.Paginate(q.Match(q.Index("locations_name_by_organization_id"),[location_name.replace(/\s/g,"").toLowerCase(),organization_id])));
    if(!location_exist.data[0]){
        return false
    } else{
        return true
    }
}


export const time_comparer = (start_time:DateTime,end_time:DateTime):number =>
{
    return end_time.diff(start_time,["minutes"]).minutes 
}

export const iso_string_checker = (iso_string:string):Boolean => {
    var luxonDate = DateTime.fromISO(iso_string,{
        zone:"utc"
    });

    return luxonDate.isValid;
}

export const sql_date_string_checker = (iso_string:string):Boolean => {
    var luxonDate = DateTime.fromSQL(iso_string,{
        zone:"utc"
    });

    return luxonDate.isValid;
}

export const get_shift_start_and_end_time = async (shift_id:string):Promise<Array<string>> => {
    const times: Data<Array<Array<string>>> = await server.query(q.Paginate(q.Match(q.Index("shifts_start_time_and_end_time_by_id"),shift_id)));
    return times.data[0]
}