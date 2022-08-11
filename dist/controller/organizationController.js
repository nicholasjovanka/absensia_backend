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
exports.edit_organization = void 0;
const fauna_utils_1 = require("../fauna_utils");
const response_utils_1 = require("../response_utils");
const utils_1 = require("../utils");
function edit_organization(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { organization_name } = req.body;
            const required_fields = [
                'organization_name',
            ];
            for (const fields of required_fields) {
                let valid = (0, utils_1.check_req_field)(req.body[fields]);
                if (!valid) {
                    throw new Error(`${fields} cannot be empty`);
                }
            }
            const { status, user_id } = yield (0, utils_1.authorize_token)(req);
            if (status == "Failed") {
                return (0, response_utils_1.response_unauthorized)(res, "Invalid Token");
            }
            const role = yield (0, utils_1.check_role)(user_id);
            if (role != "admin") {
                return (0, response_utils_1.response_unauthorized)(res, "Invalid Access Level");
            }
            const organization_id = yield (0, utils_1.organization_id_by_user_id)(user_id);
            const organization = yield fauna_utils_1.server.query(fauna_utils_1.q.Update(fauna_utils_1.q.Ref(fauna_utils_1.q.Collection("organization"), organization_id), {
                data: {
                    organization_name
                }
            }));
            return (0, response_utils_1.response_success)(res, { "data": organization.data }, "Successfully Updated Organization Name");
        }
        catch (error) {
            if (error instanceof Error) {
                return (0, response_utils_1.response_bad_request)(res, error.message);
            }
            return (0, response_utils_1.response_internal_server_error)(res, error.message);
        }
    });
}
exports.edit_organization = edit_organization;
