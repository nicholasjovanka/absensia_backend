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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.get_shift_start_and_end_time = exports.sql_date_string_checker = exports.iso_string_checker = exports.time_comparer = exports.check_location_exist = exports.check_exist = exports.organization_id_by_user_id = exports.check_role = exports.valid_phone_number = exports.valid_email = exports.check_req_field = exports.authorize_token = void 0;
const fauna_utils_1 = require("./fauna_utils");
const axios_1 = __importDefault(require("axios"));
const luxon_1 = require("luxon");
const authorize_token = (req) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const token_header = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ");
    const token = (token_header === null || token_header === void 0 ? void 0 : token_header.length) == 3 ? token_header[2] : token_header ? token_header[1] : "";
    let response_status = true;
    const ax_resp = yield axios_1.default.get('https://db.fauna.com/tokens/self', {
        // Axios looks for the `auth` option, and, if it is set, formats a
        // basic auth header for you automatically.
        auth: {
            username: token,
            password: ''
        }
    }).catch((err) => {
        var _a;
        if (((_a = err.response) === null || _a === void 0 ? void 0 : _a.status) == 401) {
            response_status = false;
        }
    });
    if (!response_status) {
        return { status: "Failed", user_id: "" };
    }
    return { status: "Success", user_id: (_b = ax_resp === null || ax_resp === void 0 ? void 0 : ax_resp.data) === null || _b === void 0 ? void 0 : _b.resource.instance['@ref'].id };
});
exports.authorize_token = authorize_token;
const check_req_field = (req_field) => {
    if (req_field == null || req_field == '') {
        return false;
    }
    return true;
};
exports.check_req_field = check_req_field;
const valid_email = (email) => {
    let regexp = new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
    return regexp.test(email);
};
exports.valid_email = valid_email;
const valid_phone_number = (phone_number) => {
    let regexp = new RegExp(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im);
    return regexp.test(phone_number);
};
exports.valid_phone_number = valid_phone_number;
const check_role = (user_id) => __awaiter(void 0, void 0, void 0, function* () {
    const role = yield fauna_utils_1.server.query(fauna_utils_1.q.Paginate(fauna_utils_1.q.Match(fauna_utils_1.q.Index("role_by_ref"), user_id)));
    return role.data[0];
});
exports.check_role = check_role;
const organization_id_by_user_id = (user_id) => __awaiter(void 0, void 0, void 0, function* () {
    const organization_id = yield fauna_utils_1.server.query(fauna_utils_1.q.Paginate(fauna_utils_1.q.Match(fauna_utils_1.q.Index("organization_id_by_ref_id"), user_id)));
    return organization_id.data[0];
});
exports.organization_id_by_user_id = organization_id_by_user_id;
const check_exist = (collection_name, identifier, index = "") => __awaiter(void 0, void 0, void 0, function* () {
    let exist = false;
    if (index != "") {
        const index_name = `${collection_name}_${index}`;
        exist = yield fauna_utils_1.server.query(fauna_utils_1.q.Exists(fauna_utils_1.q.Match(fauna_utils_1.q.Index(index_name), identifier)));
    }
    else {
        exist = yield fauna_utils_1.server.query(fauna_utils_1.q.Exists(fauna_utils_1.q.Ref(fauna_utils_1.q.Collection(collection_name), identifier)));
    }
    return exist;
});
exports.check_exist = check_exist;
const check_location_exist = (location_name, organization_id) => __awaiter(void 0, void 0, void 0, function* () {
    const location_exist = yield fauna_utils_1.server.query(fauna_utils_1.q.Paginate(fauna_utils_1.q.Match(fauna_utils_1.q.Index("locations_name_by_organization_id"), [location_name.replace(/\s/g, "").toLowerCase(), organization_id])));
    if (!location_exist.data[0]) {
        return false;
    }
    else {
        return true;
    }
});
exports.check_location_exist = check_location_exist;
const time_comparer = (start_time, end_time) => {
    return end_time.diff(start_time, ["minutes"]).minutes;
};
exports.time_comparer = time_comparer;
const iso_string_checker = (iso_string) => {
    var luxonDate = luxon_1.DateTime.fromISO(iso_string, {
        zone: "utc"
    });
    return luxonDate.isValid;
};
exports.iso_string_checker = iso_string_checker;
const sql_date_string_checker = (iso_string) => {
    var luxonDate = luxon_1.DateTime.fromSQL(iso_string, {
        zone: "utc"
    });
    return luxonDate.isValid;
};
exports.sql_date_string_checker = sql_date_string_checker;
const get_shift_start_and_end_time = (shift_id) => __awaiter(void 0, void 0, void 0, function* () {
    const times = yield fauna_utils_1.server.query(fauna_utils_1.q.Paginate(fauna_utils_1.q.Match(fauna_utils_1.q.Index("shifts_start_time_and_end_time_by_id"), shift_id)));
    return times.data[0];
});
exports.get_shift_start_and_end_time = get_shift_start_and_end_time;
