"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = exports.S3 = void 0;
require("dotenv/config");
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const multer_s3 = require("multer-s3");
const multer_obj = require("multer");
aws_sdk_1.default.config.update({
    secretAccessKey: process.env.AMAZON_S3_SECRET_KEY,
    accessKeyId: process.env.AMAZON_S3_ACCESS_KEY,
    region: 'ap-southeast-1'
});
exports.S3 = new aws_sdk_1.default.S3();
function upload(folder) {
    return multer_obj({
        fileFilter,
        storage: multer_s3({
            s3: exports.S3,
            acl: 'public-read',
            bucket: `assignmentsystem/${folder}`,
            metadata: (req, file, cb) => {
                cb(null, { fieldName: file.fieldname });
            },
            key: (req, file, cb) => {
                cb(null, file.originalname);
            },
        }), limits: { fileSize: 1024 * 1024 * 5 },
    });
}
exports.upload = upload;
function fileFilter(_, file, cb) {
    if (file.size >= 1024 * 1024 * 20) {
        cb(new Error("File size must be smaller than 20mb"));
    }
    if (file.mimetype === 'image/jpeg' ||
        file.mimetype === 'image/png'
    // file.mimetype === 'application/pdf'
    ) {
        cb(null, true);
    }
    else {
        cb(new Error('Invalid file type, only JPEG, PNG is allowed!'));
    }
}
