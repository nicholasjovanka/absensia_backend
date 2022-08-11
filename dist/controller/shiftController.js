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
exports.delete_shift = exports.approve_shift = exports.edit_shift = exports.get_shift = exports.create_shifts = void 0;
const fauna_utils_1 = require("../fauna_utils");
const luxon_1 = require("luxon");
const response_utils_1 = require("../response_utils");
const utils_1 = require("../utils");
function create_shifts(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { shift_name, start_time, end_time, location_id } = req.body;
            const required_fields = [
                'shift_name',
                'start_time',
                'end_time',
                'location_id'
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
            const location_exist = yield (0, utils_1.check_exist)("locations", location_id);
            if (!location_exist) {
                return (0, response_utils_1.response_bad_request)(res, "Location does not exist");
            }
            const start_date_valid = (0, utils_1.iso_string_checker)(start_time);
            if (!start_date_valid) {
                throw new Error("Start time must be in iso string format");
            }
            const end_date_valid = (0, utils_1.iso_string_checker)(end_time);
            if (!end_date_valid) {
                throw new Error("End time must be in iso string format");
            }
            // const current_date = DateTime.now().setZone("UTC+7")
            const start_time_conv = luxon_1.DateTime.fromISO(start_time, { zone: "UTC+7" });
            const end_time_conv = luxon_1.DateTime.fromISO(end_time, { zone: "UTC+7" });
            const date_limit = luxon_1.DateTime.fromObject({
                year: start_time_conv.year,
                month: start_time_conv.month,
                day: start_time_conv.day,
                hour: 0,
                minute: 0,
                second: 0,
                millisecond: 0,
            }, { zone: "UTC+7" }).plus({ days: 1 });
            // if(start_time_conv.diff(current_date,["minutes"]).minutes < 180){
            //     throw new Error("Shift must be made at max 3 hours before the shift actual start time")
            // }
            if ((0, utils_1.time_comparer)(start_time_conv, end_time_conv) < 30) {
                throw new Error("Time between the end shift and start shift must be 30 mins apart");
            }
            if ((0, utils_1.time_comparer)(end_time_conv, date_limit) < 20) {
                throw new Error("Shift must be within the same day with the max time at 23:40");
            }
            const organization_id = yield (0, utils_1.organization_id_by_user_id)(user_id);
            const shift = yield fauna_utils_1.server.query(fauna_utils_1.q.Create(fauna_utils_1.q.Collection('shifts'), {
                data: {
                    shift_name,
                    start_time,
                    end_time,
                    approved: false,
                    location_id,
                    organization_id
                }
            }));
            return (0, response_utils_1.response_success)(res, { "id": shift.ref.id, "data": shift.data }, "Successfully Created Shift");
        }
        catch (error) {
            if (error instanceof Error) {
                return (0, response_utils_1.response_bad_request)(res, error.message);
            }
            return (0, response_utils_1.response_internal_server_error)(res, error.message);
        }
    });
}
exports.create_shifts = create_shifts;
function get_shift(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { shift_id } = req.params;
            const { status, user_id } = yield (0, utils_1.authorize_token)(req);
            if (status == "Failed") {
                return (0, response_utils_1.response_unauthorized)(res, "Invalid Token");
            }
            const role = yield (0, utils_1.check_role)(user_id);
            if (role != "admin") {
                return (0, response_utils_1.response_unauthorized)(res, "Invalid Access Level");
            }
            const shift_exist = yield (0, utils_1.check_exist)("shifts", shift_id);
            if (!shift_exist) {
                return (0, response_utils_1.response_bad_request)(res, "Shift does not exist");
            }
            const shift = yield fauna_utils_1.server.query(fauna_utils_1.q.Get(fauna_utils_1.q.Ref(fauna_utils_1.q.Collection("shifts"), shift_id)));
            return (0, response_utils_1.response_success)(res, { data: shift.data }, `Success`);
        }
        catch (error) {
            if (error instanceof Error) {
                return (0, response_utils_1.response_bad_request)(res, error.message);
            }
            return (0, response_utils_1.response_internal_server_error)(res, error.message);
        }
    });
}
exports.get_shift = get_shift;
function edit_shift(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { shift_id, shift_name, start_time, end_time, location_id } = req.body;
            const required_fields = [
                'shift_id',
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
            const shift_exist = yield (0, utils_1.check_exist)("shifts", shift_id);
            if (!shift_exist) {
                return (0, response_utils_1.response_bad_request)(res, "Shift does not exist");
            }
            const original_data = yield fauna_utils_1.server.query(fauna_utils_1.q.Get(fauna_utils_1.q.Ref(fauna_utils_1.q.Collection("shifts"), shift_id)));
            if (original_data.data.approved == true) {
                return (0, response_utils_1.response_bad_request)(res, "An approved shift cannot be editted");
            }
            // const current_date = DateTime.now().setZone("UTC+7")
            // const original_data_start_time = DateTime.fromISO(original_data.data.start_time,{zone:"UTC+7"})
            // if(original_data_start_time.diff(current_date,["minutes"]).minutes<= 60)
            // {
            //     throw new Error("Cannot edit a shift whose start time has passed or going to start in 60 minutes")
            // }
            if (location_id) {
                const location_exist = yield (0, utils_1.check_exist)("locations", location_id);
                if (!location_exist) {
                    return (0, response_utils_1.response_bad_request)(res, "Location does not exist");
                }
            }
            if (start_time) {
                const start_date_valid = (0, utils_1.iso_string_checker)(start_time);
                if (!start_date_valid) {
                    throw new Error("Start time must be in iso string format");
                }
            }
            if (end_time) {
                const end_date_valid = (0, utils_1.iso_string_checker)(end_time);
                if (!end_date_valid) {
                    throw new Error("End time must be in iso string format");
                }
            }
            if (start_time || end_time) {
                let start_time_conv;
                let end_time_conv;
                if (start_time && !end_time) {
                    start_time_conv = luxon_1.DateTime.fromISO(start_time, { zone: "UTC+7" });
                    end_time_conv = luxon_1.DateTime.fromISO(original_data.data.end_time, { zone: "UTC+7" });
                }
                else if (!start_time && end_time) {
                    start_time_conv = luxon_1.DateTime.fromISO(original_data.data.start_time, { zone: "UTC+7" });
                    end_time_conv = luxon_1.DateTime.fromISO(end_time, { zone: "UTC+7" });
                }
                else {
                    start_time_conv = luxon_1.DateTime.fromISO(start_time, { zone: "UTC+7" });
                    end_time_conv = luxon_1.DateTime.fromISO(end_time, { zone: "UTC+7" });
                }
                // if(start_time_conv.diff(current_date,["hours"]).hours < 3){
                //     throw new Error("Shift Start Time must atleast be 3 hours before the shift actual start time")
                // }
                if ((0, utils_1.time_comparer)(start_time_conv, end_time_conv) < 30) {
                    throw new Error("Time between the end shift and start shift must be 30 mins apart");
                }
                const date_limit = luxon_1.DateTime.fromObject({
                    year: start_time_conv.year,
                    month: start_time_conv.month,
                    day: start_time_conv.day,
                    hour: 0,
                    minute: 0,
                    second: 0,
                    millisecond: 0,
                }, { zone: "UTC+7" }).plus({ days: 1 });
                if ((0, utils_1.time_comparer)(end_time_conv, date_limit) < 20) {
                    throw new Error("Shift must be within the same day with the max time at 23:40");
                }
            }
            const shift = yield fauna_utils_1.server.query(fauna_utils_1.q.Update(fauna_utils_1.q.Ref(fauna_utils_1.q.Collection('shifts'), shift_id), {
                data: Object.assign(Object.assign(Object.assign(Object.assign({}, (shift_name && { shift_name })), (start_time && { start_time })), (end_time && { end_time })), (location_id && { location_id }))
            }));
            return (0, response_utils_1.response_success)(res, { "id": shift.ref.id, "data": shift.data }, "Successfully Updated Shift");
        }
        catch (error) {
            if (error instanceof Error) {
                return (0, response_utils_1.response_bad_request)(res, error.message);
            }
            return (0, response_utils_1.response_internal_server_error)(res, error.message);
        }
    });
}
exports.edit_shift = edit_shift;
function approve_shift(req, res) {
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
            let failed_array = [];
            const { status, user_id } = yield (0, utils_1.authorize_token)(req);
            if (status == "Failed") {
                return (0, response_utils_1.response_unauthorized)(res, "Invalid Token");
            }
            const role = yield (0, utils_1.check_role)(user_id);
            if (role != "admin") {
                return (0, response_utils_1.response_unauthorized)(res, "Invalid Access Level");
            }
            let errors = [];
            if (Array.isArray(shift_id)) {
                for (const item of shift_id) {
                    if (typeof item != "string") {
                        throw new Error('Value inside shift_id array must be a string');
                    }
                }
                for (const item of shift_id) {
                    const shift_exist = yield (0, utils_1.check_exist)("shifts", item);
                    if (!shift_exist) {
                        failed_array.push(item);
                    }
                    else {
                        const original_data = yield fauna_utils_1.server.query(fauna_utils_1.q.Get(fauna_utils_1.q.Ref(fauna_utils_1.q.Collection("shifts"), item)));
                        const shift = yield fauna_utils_1.server.query(fauna_utils_1.q.Update(fauna_utils_1.q.Ref(fauna_utils_1.q.Collection('shifts'), item), {
                            data: {
                                approved: true
                            }
                        }));
                    }
                }
            }
            else {
                throw new Error('shift id field must be an array');
            }
            return (0, response_utils_1.response_success)(res, { "data": failed_array }, `Successfully Approved Shifts`);
        }
        catch (error) {
            if (error instanceof Error) {
                return (0, response_utils_1.response_bad_request)(res, error.message);
            }
            return (0, response_utils_1.response_internal_server_error)(res, error.message);
        }
    });
}
exports.approve_shift = approve_shift;
function delete_shift(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { shift_id } = req.params;
            const { status, user_id } = yield (0, utils_1.authorize_token)(req);
            if (status == "Failed") {
                return (0, response_utils_1.response_unauthorized)(res, "Invalid Token");
            }
            const role = yield (0, utils_1.check_role)(user_id);
            if (role != "admin") {
                return (0, response_utils_1.response_unauthorized)(res, "Invalid Access Level");
            }
            const shift_exist = yield (0, utils_1.check_exist)("shifts", shift_id);
            if (!shift_exist) {
                return (0, response_utils_1.response_bad_request)(res, "Shift does not exist");
            }
            const original_data = yield fauna_utils_1.server.query(fauna_utils_1.q.Get(fauna_utils_1.q.Ref(fauna_utils_1.q.Collection("shifts"), shift_id)));
            if (original_data.data.approved == true) {
                return (0, response_utils_1.response_bad_request)(res, "Cannot delete Approved Shift");
            }
            yield fauna_utils_1.server.query(fauna_utils_1.q.Delete(fauna_utils_1.q.Ref(fauna_utils_1.q.Collection('shifts'), shift_id)));
            return (0, response_utils_1.response_success)(res, {}, `Successfully Deleted Shift for  ${shift_id}`);
        }
        catch (error) {
            if (error instanceof Error) {
                return (0, response_utils_1.response_bad_request)(res, error.message);
            }
            return (0, response_utils_1.response_internal_server_error)(res, error.message);
        }
    });
}
exports.delete_shift = delete_shift;
