"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload_single_file = exports.delete_file_from_space = void 0;
const response_utils_1 = require("./response_utils");
const s3_settings_1 = require("./s3_settings");
const s3_settings_2 = require("./s3_settings");
function delete_file_from_space(folder, filename) {
    return __awaiter(this, void 0, void 0, function* () {
        let params = {
            Bucket: "assignmentsystem",
            Key: `${folder}/${filename}`
        };
        return s3_settings_1.S3.deleteObject(params).promise();
    });
}
exports.delete_file_from_space = delete_file_from_space;
function upload_single_file(folder, filename) {
    return function (req, res, next) {
        const upload_var = (0, s3_settings_2.upload)(folder).single(filename);
        upload_var(req, res, function (err) {
            if (err instanceof Error) {
                return (0, response_utils_1.response_bad_request)(res, err.message);
            }
            else {
                next();
            }
        });
    };
}
exports.upload_single_file = upload_single_file;
