import { DeleteObjectOutput } from 'aws-sdk/clients/s3';
import type { Request, Response, NextFunction} from 'express';
import {response_bad_request} from './response_utils';
import { server } from './fauna_utils';
import {S3} from './s3_settings';
import { upload } from './s3_settings';
export async function delete_file_from_space(folder:string,filename:string):Promise<DeleteObjectOutput>{
    let params = {
        Bucket:"assignmentsystem",
        Key:`${folder}/${filename}`
    }
    return S3.deleteObject(params).promise();
}  

export function upload_single_file(folder:string, filename:string){
    return function(req:Request,res:Response,next:NextFunction){
        const upload_var = upload(folder).single(filename);
        upload_var(req,res,function(err){
            if(err instanceof Error){
                return response_bad_request(res,err.message)
            }
            else{
                next();
            }
        })
    }
}
