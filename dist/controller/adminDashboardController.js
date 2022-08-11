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
exports.paginate_users = exports.paginate_location = exports.get_shift_users = exports.get_shift_list_by_date = exports.admin_dashboard_statistics = exports.paginate_shifts_entries = exports.paginate_shifts = void 0;
const fauna_utils_1 = require("../fauna_utils");
const luxon_1 = require("luxon");
const response_utils_1 = require("../response_utils");
const utils_1 = require("../utils");
function paginate_shifts(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { start_date, end_date, approved, location, shift_name, page, size } = req.body;
            const required_fields = [
                'start_date',
                'end_date',
                'page',
                'size'
            ];
            for (const fields of required_fields) {
                let valid = (0, utils_1.check_req_field)(req.body[fields]);
                if (!valid) {
                    throw new Error(`${fields} cannot be empty`);
                }
            }
            const start_date_valid = (0, utils_1.sql_date_string_checker)(start_date);
            if (!start_date_valid) {
                throw new Error("Start date must be in YYYY-MM-dd string format");
            }
            const end_date_valid = (0, utils_1.sql_date_string_checker)(end_date);
            if (!end_date_valid) {
                throw new Error("End date must be in YYYY-MM-dd string format");
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
            if (location && location != "null") {
                const location_exist = yield (0, utils_1.check_exist)("locations", location);
                if (!location_exist) {
                    return (0, response_utils_1.response_bad_request)(res, "Location does not exist");
                }
            }
            if (typeof page != "number" || typeof size != "number") {
                throw new Error("page and size must be a number");
            }
            const start_date_conv = luxon_1.DateTime.fromSQL(start_date);
            const end_date_conv = luxon_1.DateTime.fromSQL(end_date);
            const paginate_start_date = luxon_1.DateTime.fromObject({
                year: start_date_conv.year,
                month: start_date_conv.month,
                day: start_date_conv.day,
                hour: 0,
                minute: 0,
                second: 0,
                millisecond: 0,
            }, { zone: "UTC+7" });
            const paginate_end_date = luxon_1.DateTime.fromObject({
                year: end_date_conv.year,
                month: end_date_conv.month,
                day: end_date_conv.day,
                hour: 0,
                minute: 0,
                second: 0,
                millisecond: 0,
            }, { zone: "UTC+7" });
            let test = approved == null ? "null" : approved;
            if ((0, utils_1.time_comparer)(paginate_start_date, paginate_end_date) < 0) {
                throw new Error("End date must be greater or equal to start date");
            }
            const shift_data = yield fauna_utils_1.server.query(fauna_utils_1.q.Call(fauna_utils_1.q.Function("paginate_shift_id_by_organization"), [organization_id, paginate_start_date.toISO().toString(), paginate_end_date.toISO().toString(), approved == null ? "null" : approved, location ? location : "null", shift_name ? shift_name : "null", page, size]));
            if (shift_data.data[0] == "invalid") {
                throw new Error("invalid pagination page");
            }
            return (0, response_utils_1.response_success)(res, { "data": shift_data.data, "current_page": shift_data.current_page, "total_page": shift_data.total_page, "total_size": shift_data.total_size }, "Succesfully Paginate Data");
        }
        catch (error) {
            if (error instanceof Error) {
                return (0, response_utils_1.response_bad_request)(res, error.message);
            }
            return (0, response_utils_1.response_internal_server_error)(res, error.message);
        }
    });
}
exports.paginate_shifts = paginate_shifts;
function paginate_shifts_entries(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { start_date, end_date, status_filter, shift, overtime_enabled, is_late, forgot_clockout, user, page, size } = req.body;
            const required_fields = [
                'start_date',
                'end_date',
                'page',
                'size'
            ];
            for (const fields of required_fields) {
                let valid = (0, utils_1.check_req_field)(req.body[fields]);
                if (!valid) {
                    throw new Error(`${fields} cannot be empty`);
                }
            }
            const start_date_valid = (0, utils_1.sql_date_string_checker)(start_date);
            if (!start_date_valid) {
                throw new Error("Start date must be in YYYY-MM-dd string format");
            }
            const end_date_valid = (0, utils_1.sql_date_string_checker)(end_date);
            if (!end_date_valid) {
                throw new Error("End date must be in YYYY-MM-dd string format");
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
            if (shift && shift != "null") {
                const shift_exist = yield (0, utils_1.check_exist)("shifts", shift);
                if (!shift_exist) {
                    return (0, response_utils_1.response_bad_request)(res, "Shift does not exist");
                }
            }
            if (typeof page != "number" || typeof size != "number") {
                throw new Error("page and size must be a number");
            }
            const start_date_conv = luxon_1.DateTime.fromSQL(start_date);
            const end_date_conv = luxon_1.DateTime.fromSQL(end_date);
            const paginate_start_date = luxon_1.DateTime.fromObject({
                year: start_date_conv.year,
                month: start_date_conv.month,
                day: start_date_conv.day,
                hour: 0,
                minute: 0,
                second: 0,
                millisecond: 0,
            }, { zone: "UTC+7" });
            const paginate_end_date = luxon_1.DateTime.fromObject({
                year: end_date_conv.year,
                month: end_date_conv.month,
                day: end_date_conv.day,
                hour: 0,
                minute: 0,
                second: 0,
                millisecond: 0,
            }, { zone: "UTC+7" });
            if ((0, utils_1.time_comparer)(paginate_start_date, paginate_end_date) < 0) {
                throw new Error("End date must be greater or equal to start date");
            }
            const shift_entry = yield fauna_utils_1.server.query(fauna_utils_1.q.Call(fauna_utils_1.q.Function("paginate_shift_entries_admin"), [organization_id, paginate_start_date.toISO().toString(), paginate_end_date.toISO().toString(), status_filter ? status_filter : "null", shift ? shift : "null", overtime_enabled == null ? "null" : overtime_enabled,
                is_late == null ? "null" : is_late, forgot_clockout == null ? "null" : forgot_clockout, user ? user : "null", page, size]));
            if (shift_entry.data[0] == "invalid") {
                throw new Error("invalid pagination page");
            }
            return (0, response_utils_1.response_success)(res, { "data": shift_entry.data, "current_page": shift_entry.current_page, "total_page": shift_entry.total_page, "total_size": shift_entry.total_size }, "Succesfully Paginate Data");
        }
        catch (error) {
            if (error instanceof Error) {
                return (0, response_utils_1.response_bad_request)(res, error.message);
            }
            return (0, response_utils_1.response_internal_server_error)(res, error.message);
        }
    });
}
exports.paginate_shifts_entries = paginate_shifts_entries;
function admin_dashboard_statistics(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { date } = req.body;
            const current_date = luxon_1.DateTime.now().setZone("UTC+7");
            const required_fields = [
                'date',
            ];
            const current_date_reformated = luxon_1.DateTime.fromObject({
                year: current_date.year,
                month: current_date.month,
                day: current_date.day,
                hour: 23,
                minute: 59,
                second: 59,
                millisecond: 0,
            }, { zone: "UTC+7" });
            for (const fields of required_fields) {
                let valid = (0, utils_1.check_req_field)(req.body[fields]);
                if (!valid) {
                    throw new Error(`${fields} cannot be empty`);
                }
            }
            const date_valid = (0, utils_1.sql_date_string_checker)(date);
            if (!date_valid) {
                throw new Error("Date must be in YYYY-MM-dd string format");
            }
            const { status, user_id } = yield (0, utils_1.authorize_token)(req);
            if (status == "Failed") {
                return (0, response_utils_1.response_unauthorized)(res, "Invalid Token");
            }
            const role = yield (0, utils_1.check_role)(user_id);
            if (role != "admin") {
                return (0, response_utils_1.response_unauthorized)(res, "Invalid Access Level");
            }
            const date_conv = luxon_1.DateTime.fromSQL(date);
            const time_difference = current_date_reformated.diff(date_conv, ["days"]).days;
            let search_mode = "";
            if (time_difference < 0) {
                throw new Error(`Cannot find data for dates ahead of the current date`);
            }
            if (time_difference == 0) {
                search_mode = "same_day";
            }
            if (time_difference > 0) {
                search_mode = "past_day";
            }
            const organization_id = yield (0, utils_1.organization_id_by_user_id)(user_id);
            const paginate_start_date = luxon_1.DateTime.fromObject({
                year: date_conv.year,
                month: date_conv.month,
                day: date_conv.day,
                hour: 0,
                minute: 0,
                second: 0,
                millisecond: 0,
            }, { zone: "UTC+7" });
            const dashboard_statistics = yield fauna_utils_1.server.query(fauna_utils_1.q.Call(fauna_utils_1.q.Function("admin_dashboard"), [organization_id, paginate_start_date.toISO().toString(), search_mode]));
            return (0, response_utils_1.response_success)(res, { "data": dashboard_statistics.data, "search_mode": search_mode, "empty": dashboard_statistics.data.empty ? true : false }, "Succesfully Paginate Data");
        }
        catch (error) {
            if (error instanceof Error) {
                return (0, response_utils_1.response_bad_request)(res, error.message);
            }
            return (0, response_utils_1.response_internal_server_error)(res, error.message);
        }
    });
}
exports.admin_dashboard_statistics = admin_dashboard_statistics;
function get_shift_list_by_date(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { start_date, end_date } = req.body;
            const required_fields = [
                'start_date',
                'end_date',
            ];
            for (const fields of required_fields) {
                let valid = (0, utils_1.check_req_field)(req.body[fields]);
                if (!valid) {
                    throw new Error(`${fields} cannot be empty`);
                }
            }
            const start_date_valid = (0, utils_1.sql_date_string_checker)(start_date);
            if (!start_date_valid) {
                throw new Error("Start date must be in YYYY-MM-dd string format");
            }
            const end_date_valid = (0, utils_1.sql_date_string_checker)(end_date);
            if (!end_date_valid) {
                throw new Error("End date must be in YYYY-MM-dd string format");
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
            const start_date_conv = luxon_1.DateTime.fromSQL(start_date);
            const end_date_conv = luxon_1.DateTime.fromSQL(end_date);
            const paginate_start_date = luxon_1.DateTime.fromObject({
                year: start_date_conv.year,
                month: start_date_conv.month,
                day: start_date_conv.day,
                hour: 0,
                minute: 0,
                second: 0,
                millisecond: 0,
            }, { zone: "UTC+7" });
            const paginate_end_date = luxon_1.DateTime.fromObject({
                year: end_date_conv.year,
                month: end_date_conv.month,
                day: end_date_conv.day,
                hour: 0,
                minute: 0,
                second: 0,
                millisecond: 0,
            }, { zone: "UTC+7" });
            if ((0, utils_1.time_comparer)(paginate_start_date, paginate_end_date) < 0) {
                throw new Error("End date must be greater or equal to start date");
            }
            const shift_list = yield fauna_utils_1.server.query(fauna_utils_1.q.Call(fauna_utils_1.q.Function("paginate_shift_ids"), [organization_id, paginate_start_date.toISO().toString(), paginate_end_date.toISO().toString()]));
            return (0, response_utils_1.response_success)(res, { "data": shift_list.data, "total_data": shift_list.total_data }, "Succesfully Fetched List");
        }
        catch (error) {
            if (error instanceof Error) {
                return (0, response_utils_1.response_bad_request)(res, error.message);
            }
            return (0, response_utils_1.response_internal_server_error)(res, error.message);
        }
    });
}
exports.get_shift_list_by_date = get_shift_list_by_date;
function get_shift_users(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { shift_id } = req.body;
            const required_fields = [
                'shift_id',
            ];
            for (const fields of required_fields) {
                let valid = (0, utils_1.check_req_field)(req.body[fields]);
                if (!valid) {
                    throw new Error(`${fields} cannot be empty`);
                }
            }
            const shift_exist = yield (0, utils_1.check_exist)("shifts", shift_id);
            if (!shift_exist) {
                return (0, response_utils_1.response_bad_request)(res, "Shift does not exist");
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
            const shift_user_list = yield fauna_utils_1.server.query(fauna_utils_1.q.Call(fauna_utils_1.q.Function("shift_entry_user_list"), [organization_id, shift_id]));
            return (0, response_utils_1.response_success)(res, { "data": shift_user_list.data }, "Succesfully Fetched List");
        }
        catch (error) {
            if (error instanceof Error) {
                return (0, response_utils_1.response_bad_request)(res, error.message);
            }
            return (0, response_utils_1.response_internal_server_error)(res, error.message);
        }
    });
}
exports.get_shift_users = get_shift_users;
function paginate_location(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { name, page, size } = req.body;
            const required_fields = [
                'page',
                'size'
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
            if (typeof page != "number" || typeof size != "number") {
                throw new Error("page and size must be a number");
            }
            const location = yield fauna_utils_1.server.query(fauna_utils_1.q.Call(fauna_utils_1.q.Function("paginate_location"), [organization_id, name ? name : "null", page, size]));
            if (location.data[0] == "invalid") {
                throw new Error("invalid pagination page");
            }
            return (0, response_utils_1.response_success)(res, { "data": location.data, "current_page": location.current_page, "total_page": location.total_page, "total_size": location.total_size }, "Succesfully Paginate Data");
        }
        catch (error) {
            if (error instanceof Error) {
                return (0, response_utils_1.response_bad_request)(res, error.message);
            }
            return (0, response_utils_1.response_internal_server_error)(res, error.message);
        }
    });
}
exports.paginate_location = paginate_location;
function paginate_users(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { name, page, size } = req.body;
            const required_fields = [
                'page',
                'size'
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
            if (typeof page != "number" || typeof size != "number") {
                throw new Error("page and size must be a number");
            }
            const name_data = yield fauna_utils_1.server.query(fauna_utils_1.q.Call(fauna_utils_1.q.Function("paginate_users"), [organization_id, name ? name : "null", page, size]));
            if (name_data.data[0] == "invalid") {
                throw new Error("invalid pagination page");
            }
            return (0, response_utils_1.response_success)(res, { "data": name_data.data, "current_page": name_data.current_page, "total_page": name_data.total_page, "total_size": name_data.total_size }, "Succesfully Paginate Data");
        }
        catch (error) {
            if (error instanceof Error) {
                return (0, response_utils_1.response_bad_request)(res, error.message);
            }
            return (0, response_utils_1.response_internal_server_error)(res, error.message);
        }
    });
}
exports.paginate_users = paginate_users;
