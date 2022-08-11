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
exports.delete_user = exports.log_out = exports.edit_user = exports.edit_user_admin = exports.validate_token = exports.get_user_data = exports.create_user = exports.login = void 0;
const fauna_utils_1 = require("../fauna_utils");
const response_utils_1 = require("../response_utils");
const utils_1 = require("../utils");
const s3_utils_1 = require("../s3_utils");
function login(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { email, password } = req.body;
            const login_data = yield fauna_utils_1.server.query(fauna_utils_1.q.Login(fauna_utils_1.q.Match(fauna_utils_1.q.Index("users_ref_by_email"), email), { password, ttl: fauna_utils_1.q.TimeAdd(fauna_utils_1.q.Now(), 3, 'days') }));
            const [token, user_ref] = [login_data.secret, login_data.instance];
            const user = yield (0, fauna_utils_1.client)(token).query(fauna_utils_1.q.Get(user_ref));
            const faunadb_token = `fauna ${token}`;
            return (0, response_utils_1.response_success)(res, { "id": user.ref.id, faunadb_token, "data": user.data }, "Successful Login");
        }
        catch (error) {
            if (error instanceof Error) {
                return (0, response_utils_1.response_bad_request)(res, error.message);
            }
            return (0, response_utils_1.response_internal_server_error)(res, error.message);
        }
    });
}
exports.login = login;
function create_user(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { name, email, birthdate, address, phonenumber } = req.body;
            const required_fields = [
                'name',
                'email',
            ];
            console.log(name);
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
            if (!(0, utils_1.valid_email)(email)) {
                throw new Error("Email is invalid");
            }
            if (phonenumber) {
                if (!(0, utils_1.valid_phone_number)(phonenumber)) {
                    throw new Error("Phone is invalid");
                }
            }
            if (birthdate) {
                const birthdate_valid = (0, utils_1.sql_date_string_checker)(birthdate);
                if (!birthdate_valid) {
                    throw new Error("Birthdate must be in YYYY-MM-dd string format");
                }
            }
            const email_exist = yield (0, utils_1.check_exist)("users", email, "ref_by_email");
            if (email_exist) {
                return (0, response_utils_1.response_bad_request)(res, "Email already have been used");
            }
            let image_file = req.file ? `https://assignmentsystem.s3.ap-southeast-1.amazonaws.com/userimages/${req.file.originalname}` : `https://assignmentsystem.s3.ap-southeast-1.amazonaws.com/userimages/default.png`;
            const organization_id = yield (0, utils_1.organization_id_by_user_id)(user_id);
            const user = yield fauna_utils_1.server.query(fauna_utils_1.q.Create(fauna_utils_1.q.Collection('users'), {
                credentials: { password: "default password" },
                data: {
                    name,
                    email,
                    organization_id,
                    role: "user",
                    s3_image: image_file,
                    birthdate: birthdate ? birthdate : "none",
                    address: address ? address : "none",
                    phonenumber: phonenumber ? phonenumber : "none",
                }
            }));
            return (0, response_utils_1.response_success)(res, { "id": user.ref.id, "data": user.data }, "Successfully Created User");
        }
        catch (error) {
            if (req.file) {
                (0, s3_utils_1.delete_file_from_space)("userimages", req.file.originalname);
            }
            if (error instanceof Error) {
                return (0, response_utils_1.response_bad_request)(res, error.message);
            }
            return (0, response_utils_1.response_internal_server_error)(res, error.message);
        }
    });
}
exports.create_user = create_user;
function get_user_data(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { user_ref } = req.body;
            const { status, user_id } = yield (0, utils_1.authorize_token)(req);
            if (status == "Failed") {
                return (0, response_utils_1.response_unauthorized)(res);
            }
            const role = yield (0, utils_1.check_role)(user_id);
            if (user_ref) {
                if (role != "admin" && user_id != user_ref) {
                    return (0, response_utils_1.response_unauthorized)(res, "Invalid Access Level");
                }
            }
            let user_id_to_search = user_ref ? user_ref : user_id;
            const user_exist = yield (0, utils_1.check_exist)("users", user_id_to_search);
            if (!user_exist) {
                return (0, response_utils_1.response_bad_request)(res, "User does not exist");
            }
            const user_data = yield fauna_utils_1.server.query(fauna_utils_1.q.Get(fauna_utils_1.q.Ref(fauna_utils_1.q.Collection("users"), user_id_to_search)));
            return (0, response_utils_1.response_success)(res, { "id": user_data.ref.id, "data": user_data.data }, "Success");
        }
        catch (error) {
            if (error instanceof Error) {
                return (0, response_utils_1.response_bad_request)(res, error.message);
            }
            return (0, response_utils_1.response_internal_server_error)(res, error.message);
        }
    });
}
exports.get_user_data = get_user_data;
function validate_token(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { status, user_id } = yield (0, utils_1.authorize_token)(req);
            if (status == "Failed") {
                return (0, response_utils_1.response_unauthorized)(res);
            }
            const role = yield (0, utils_1.check_role)(user_id);
            return (0, response_utils_1.response_success)(res, { "data": { status, user_id, role } }, "Success");
            return (0, response_utils_1.response_success)(res, { "data": "data" }, "Successful Login");
        }
        catch (error) {
            if (error instanceof Error) {
                return (0, response_utils_1.response_bad_request)(res, error.message);
            }
            return (0, response_utils_1.response_internal_server_error)(res, error.message);
        }
    });
}
exports.validate_token = validate_token;
function edit_user_admin(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { user_ref, name, email, birthdate, address, phonenumber, password } = req.body;
            const required_fields = [
                'user_ref',
            ];
            for (const fields of required_fields) {
                let valid = (0, utils_1.check_req_field)(req.body[fields]);
                if (!valid) {
                    throw new Error(`${fields} cannot be empty`);
                }
            }
            const { status, user_id } = yield (0, utils_1.authorize_token)(req);
            if (status == "Failed") {
                return (0, response_utils_1.response_unauthorized)(res);
            }
            const role = yield (0, utils_1.check_role)(user_id);
            if (role != "admin") {
                return (0, response_utils_1.response_unauthorized)(res, "Invalid Access Level");
            }
            const user_exist = yield (0, utils_1.check_exist)("users", user_ref);
            if (!user_exist) {
                return (0, response_utils_1.response_bad_request)(res, "User does not exist");
            }
            const original_data = yield fauna_utils_1.server.query(fauna_utils_1.q.Get(fauna_utils_1.q.Ref(fauna_utils_1.q.Collection("users"), user_ref)));
            if (email) {
                if (!(0, utils_1.valid_email)(email)) {
                    throw new Error("Email is invalid");
                }
            }
            if (phonenumber) {
                if (!(0, utils_1.valid_phone_number)(phonenumber)) {
                    throw new Error("Phone is invalid");
                }
            }
            if (birthdate) {
                const birthdate_valid = (0, utils_1.sql_date_string_checker)(birthdate);
                if (!birthdate_valid) {
                    throw new Error("Birthdate must be in YYYY-MM-dd string format");
                }
            }
            if (email && email != original_data.data.email) {
                const email_exist = yield (0, utils_1.check_exist)("users", email, "ref_by_email");
                if (email_exist) {
                    return (0, response_utils_1.response_bad_request)(res, "Email already have been used");
                }
            }
            let data;
            if (req.file) {
                data = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (name && { name })), (email && { email })), { s3_image: `https://assignmentsystem.s3.ap-southeast-1.amazonaws.com/userimages/${req.file.originalname}` }), (birthdate && { birthdate })), (address && { address })), (phonenumber && { phonenumber }));
                let original_file_folder = original_data.data.s3_image.split("/")[3];
                let original_file_name = original_data.data.s3_image.split("/")[4];
                console.log(original_file_name);
                if (original_file_name != "default.png") {
                    yield (0, s3_utils_1.delete_file_from_space)(original_file_folder, original_file_name);
                }
            }
            else {
                data = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (name && { name })), (email && { email })), (birthdate && { birthdate })), (address && { address })), (phonenumber && { phonenumber }));
            }
            const update_data = yield fauna_utils_1.server.query(fauna_utils_1.q.Update(fauna_utils_1.q.Ref(fauna_utils_1.q.Collection("users"), user_ref), Object.assign(Object.assign({}, (password && { credentials: { password } })), { data })));
            return (0, response_utils_1.response_success)(res, { "id": update_data.ref.id, "data": update_data.data }, "Success");
        }
        catch (error) {
            if (req.file) {
                (0, s3_utils_1.delete_file_from_space)("userimages", req.file.originalname);
            }
            if (error instanceof Error) {
                return (0, response_utils_1.response_bad_request)(res, error.message);
            }
            return (0, response_utils_1.response_internal_server_error)(res, error.message);
        }
    });
}
exports.edit_user_admin = edit_user_admin;
function edit_user(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { name, email, birthdate, address, phonenumber, password } = req.body;
            const { status, user_id } = yield (0, utils_1.authorize_token)(req);
            if (status == "Failed") {
                return (0, response_utils_1.response_unauthorized)(res);
            }
            const user_exist = yield (0, utils_1.check_exist)("users", user_id);
            if (!user_exist) {
                return (0, response_utils_1.response_bad_request)(res, "User does not exist");
            }
            if (email) {
                if (!(0, utils_1.valid_email)(email)) {
                    throw new Error("Email is invalid");
                }
            }
            if (phonenumber) {
                if (!(0, utils_1.valid_phone_number)(phonenumber)) {
                    throw new Error("Phone is invalid");
                }
            }
            if (birthdate) {
                const birthdate_valid = (0, utils_1.sql_date_string_checker)(birthdate);
                if (!birthdate_valid) {
                    throw new Error("Birthdate must be in YYYY-MM-dd string format");
                }
            }
            const original_data = yield fauna_utils_1.server.query(fauna_utils_1.q.Get(fauna_utils_1.q.Ref(fauna_utils_1.q.Collection("users"), user_id)));
            if (email && email != original_data.data.email) {
                const email_exist = yield (0, utils_1.check_exist)("users", email, "ref_by_email");
                if (email_exist) {
                    return (0, response_utils_1.response_bad_request)(res, "Email already have been used");
                }
            }
            let data;
            data = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (name && { name })), (email && { email })), (birthdate && { birthdate })), (address && { address })), (phonenumber && { phonenumber }));
            const update_data = yield fauna_utils_1.server.query(fauna_utils_1.q.Update(fauna_utils_1.q.Ref(fauna_utils_1.q.Collection("users"), user_id), Object.assign(Object.assign({}, (password && { credentials: { password } })), { data })));
            return (0, response_utils_1.response_success)(res, { "id": update_data.ref.id, "data": update_data.data }, "Success");
        }
        catch (error) {
            if (error instanceof Error) {
                return (0, response_utils_1.response_bad_request)(res, error.message);
            }
            return (0, response_utils_1.response_internal_server_error)(res, error.message);
        }
    });
}
exports.edit_user = edit_user;
function log_out(req, res) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { status, user_id } = yield (0, utils_1.authorize_token)(req);
            if (status == "Failed") {
                return (0, response_utils_1.response_unauthorized)(res);
            }
            const token_header = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ");
            const token = (token_header === null || token_header === void 0 ? void 0 : token_header.length) == 3 ? token_header[2] : token_header ? token_header[1] : "";
            const user = (0, fauna_utils_1.client)(token ? token : "");
            yield user.query(fauna_utils_1.q.Logout(true));
            return (0, response_utils_1.response_success)(res, {}, "Successfully Logged Out");
        }
        catch (error) {
            if (error instanceof Error) {
                return (0, response_utils_1.response_bad_request)(res, error.message);
            }
            return (0, response_utils_1.response_internal_server_error)(res, error.message);
        }
    });
}
exports.log_out = log_out;
function delete_user(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { user_ref } = req.params;
            const { status, user_id } = yield (0, utils_1.authorize_token)(req);
            if (status == "Failed") {
                return (0, response_utils_1.response_unauthorized)(res);
            }
            const role = yield (0, utils_1.check_role)(user_id);
            if (role != "admin") {
                return (0, response_utils_1.response_unauthorized)(res, "Invalid Access Level");
            }
            const user_exist = yield (0, utils_1.check_exist)("users", user_ref);
            if (!user_exist) {
                return (0, response_utils_1.response_bad_request)(res, "User does not exist");
            }
            const shifts_id = yield fauna_utils_1.server.query(fauna_utils_1.q.Paginate(fauna_utils_1.q.Match(fauna_utils_1.q.Index("shift_entry_by_user_id"), user_ref), { size: fauna_utils_1.q.Count(fauna_utils_1.q.Match(fauna_utils_1.q.Index("shift_entry_by_user_id"), user_ref)) }));
            if (shifts_id.data.length > 0) {
                for (const shift_id of shifts_id.data) {
                    const shift_entry_data = yield fauna_utils_1.server.query(fauna_utils_1.q.Get(fauna_utils_1.q.Ref(fauna_utils_1.q.Collection("shifts_entry"), shift_id)));
                    if (shift_entry_data.data.image_url) {
                        let original_file_folder = shift_entry_data.data.image_url.split("/")[3];
                        let original_file_name = shift_entry_data.data.image_url.split("/")[4];
                        if (original_file_name != "default.png") {
                            yield (0, s3_utils_1.delete_file_from_space)(original_file_folder, original_file_name);
                        }
                    }
                    if (shift_entry_data.data.image_clock_out_url) {
                        let original_file_folder = shift_entry_data.data.image_clock_out_url.split("/")[3];
                        let original_file_name = shift_entry_data.data.image_clock_out_url.split("/")[4];
                        if (original_file_name != "default.png") {
                            yield (0, s3_utils_1.delete_file_from_space)(original_file_folder, original_file_name);
                        }
                    }
                    yield fauna_utils_1.server.query(fauna_utils_1.q.Delete(fauna_utils_1.q.Ref(fauna_utils_1.q.Collection("shifts_entry"), shift_id)));
                }
            }
            const original_data = yield fauna_utils_1.server.query(fauna_utils_1.q.Get(fauna_utils_1.q.Ref(fauna_utils_1.q.Collection("users"), user_ref)));
            let original_file_folder = original_data.data.s3_image.split("/")[3];
            let original_file_name = original_data.data.s3_image.split("/")[4];
            console.log(original_file_name);
            if (original_file_name != "default.png") {
                yield (0, s3_utils_1.delete_file_from_space)(original_file_folder, original_file_name);
            }
            yield fauna_utils_1.server.query(fauna_utils_1.q.Delete(fauna_utils_1.q.Ref(fauna_utils_1.q.Collection("users"), user_ref)));
            return (0, response_utils_1.response_success)(res, {}, "Successfully Deleted User");
        }
        catch (error) {
            if (error instanceof Error) {
                return (0, response_utils_1.response_bad_request)(res, error.message);
            }
            return (0, response_utils_1.response_internal_server_error)(res, error.message);
        }
    });
}
exports.delete_user = delete_user;
