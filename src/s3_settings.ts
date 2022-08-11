import type { Request } from 'express';
import type { Multer, FileFilterCallback } from 'multer';
import 'dotenv/config';
import AWS from 'aws-sdk';
import multer_s3 = require('multer-s3');
import multer_obj = require('multer');

AWS.config.update({
    secretAccessKey: process.env.AMAZON_S3_SECRET_KEY,
    accessKeyId: process.env.AMAZON_S3_ACCESS_KEY,
    region: 'ap-southeast-1'
})

export const S3 = new AWS.S3();

export function upload(folder:string): Multer {
	return multer_obj({
		fileFilter,
		storage: multer_s3({
			s3: S3,
            acl: 'public-read',
			bucket: `assignmentsystem/${folder}`,
			metadata: (req: Request, file: Express.Multer.File, cb) => {
				cb(null, { fieldName: file.fieldname });
			},
			key: (req: Request, file: Express.Multer.File, cb) => {
				cb(null, file.originalname);
			},
		}), limits: { fileSize: 1024 * 1024 * 5 },
	});
}

function fileFilter(_: Request, file: Express.Multer.File, cb: FileFilterCallback): void {
	if(file.size >= 1024 * 1024 * 20){
		cb(new Error("File size must be smaller than 20mb"))
	}
	if (
		file.mimetype === 'image/jpeg' ||
		file.mimetype === 'image/png' 
		// file.mimetype === 'application/pdf'
	) {
		cb(null, true);
	} else {
		cb(new Error('Invalid file type, only JPEG, PNG is allowed!'));
	}
}

