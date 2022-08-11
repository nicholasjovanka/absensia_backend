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
exports.delete_location = exports.paginate_location = exports.edit_location = exports.get_location = exports.create_location = void 0;
const fauna_utils_1 = require("../fauna_utils");
const response_utils_1 = require("../response_utils");
const utils_1 = require("../utils");
function create_location(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { location_name, location_coordinates } = req.body;
            const required_fields = [
                'location_name',
                'location_coordinates',
            ];
            for (const fields of required_fields) {
                let valid = (0, utils_1.check_req_field)(req.body[fields]);
                if (!valid) {
                    throw new Error(`${fields} cannot be empty`);
                }
            }
            if (Array.isArray(location_coordinates)) {
                if (location_coordinates.length == 2) {
                    for (const item of location_coordinates) {
                        if (typeof item != "number") {
                            throw new Error('Value inside location coordinate array must be a number');
                        }
                    }
                }
                else {
                    throw new Error("Location Coordinate Array Length must be 2");
                }
            }
            else {
                throw new Error('location coordinates must be an array');
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
            const location_exist = yield (0, utils_1.check_location_exist)(location_name, organization_id);
            if (location_exist) {
                throw new Error("Location name already have been used for this organization");
            }
            const location = yield fauna_utils_1.server.query(fauna_utils_1.q.Create(fauna_utils_1.q.Collection('locations'), {
                data: {
                    location_name,
                    location_coordinates,
                    organization_id,
                }
            }));
            return (0, response_utils_1.response_success)(res, { "id": location.ref.id, "data": location.data }, "Successfully Created Location");
        }
        catch (error) {
            if (error instanceof Error) {
                return (0, response_utils_1.response_bad_request)(res, error.message);
            }
            return (0, response_utils_1.response_internal_server_error)(res, error.message);
        }
    });
}
exports.create_location = create_location;
function get_location(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { location_id } = req.params;
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
            const location_data = yield fauna_utils_1.server.query(fauna_utils_1.q.Get(fauna_utils_1.q.Ref(fauna_utils_1.q.Collection("locations"), location_id)));
            return (0, response_utils_1.response_success)(res, { data: location_data.data }, "Successfully Get Location");
        }
        catch (error) {
            if (error instanceof Error) {
                return (0, response_utils_1.response_bad_request)(res, error.message);
            }
            return (0, response_utils_1.response_internal_server_error)(res, error.message);
        }
    });
}
exports.get_location = get_location;
function edit_location(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { location_id, location_name, location_coordinates } = req.body;
            const required_fields = [
                'location_id',
            ];
            for (const fields of required_fields) {
                let valid = (0, utils_1.check_req_field)(req.body[fields]);
                if (!valid) {
                    throw new Error(`${fields} cannot be empty`);
                }
            }
            if (location_coordinates) {
                if (Array.isArray(location_coordinates)) {
                    if (location_coordinates.length == 2) {
                        for (const item of location_coordinates) {
                            if (typeof item != "number") {
                                throw new Error('Value inside location coordinate array must be a number');
                            }
                        }
                    }
                    else {
                        throw new Error("Location Coordinate Array Length must be 2");
                    }
                }
                else {
                    throw new Error('location coordinates must be an array');
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
            const location_exist = yield (0, utils_1.check_exist)("locations", location_id);
            if (!location_exist) {
                return (0, response_utils_1.response_bad_request)(res, "Location does not exist");
            }
            const original_data = yield fauna_utils_1.server.query(fauna_utils_1.q.Get(fauna_utils_1.q.Ref(fauna_utils_1.q.Collection("locations"), location_id)));
            if (location_name && location_name.replace(/\s/g, "").toLowerCase() != original_data.data.location_name.replace(/\s/g, "").toLowerCase()) {
                const location_exist = yield (0, utils_1.check_location_exist)(location_name, organization_id);
                if (location_exist) {
                    throw new Error("Location name already have been used for this organization");
                }
            }
            const location = yield fauna_utils_1.server.query(fauna_utils_1.q.Update(fauna_utils_1.q.Ref(fauna_utils_1.q.Collection("locations"), location_id), {
                data: Object.assign(Object.assign({}, (location_name && { location_name })), (location_coordinates && { location_coordinates }))
            }));
            return (0, response_utils_1.response_success)(res, { "id": location.ref.id, "data": location.data }, "Successfully Updated Location");
        }
        catch (error) {
            if (error instanceof Error) {
                return (0, response_utils_1.response_bad_request)(res, error.message);
            }
            return (0, response_utils_1.response_internal_server_error)(res, error.message);
        }
    });
}
exports.edit_location = edit_location;
function paginate_location(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { status, user_id } = yield (0, utils_1.authorize_token)(req);
            if (status == "Failed") {
                return (0, response_utils_1.response_unauthorized)(res, "Invalid Token");
            }
            const role = yield (0, utils_1.check_role)(user_id);
            const organization_id = yield (0, utils_1.organization_id_by_user_id)(user_id);
            const location = yield fauna_utils_1.server.query(fauna_utils_1.q.Paginate(fauna_utils_1.q.Match(fauna_utils_1.q.Index("locations_name_and_id_by_organization_id"), organization_id), { size: fauna_utils_1.q.Count(fauna_utils_1.q.Match(fauna_utils_1.q.Index("locations_name_and_id_by_organization_id"), organization_id)) }));
            return (0, response_utils_1.response_success)(res, { "data": location.data }, "Successfully Get Location List");
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
function delete_location(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { location_id } = req.params;
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
            yield fauna_utils_1.server.query(fauna_utils_1.q.Delete(fauna_utils_1.q.Ref(fauna_utils_1.q.Collection('locations'), location_id)));
            return (0, response_utils_1.response_success)(res, {}, "Successfully Deleted Location");
        }
        catch (error) {
            if (error instanceof Error) {
                return (0, response_utils_1.response_bad_request)(res, error.message);
            }
            return (0, response_utils_1.response_internal_server_error)(res, error.message);
        }
    });
}
exports.delete_location = delete_location;
