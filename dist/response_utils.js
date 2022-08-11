"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.response_created = exports.response_success = exports.response_not_found = exports.response_forbidden = exports.response_unauthorized = exports.response_bad_request = exports.response_internal_server_error = void 0;
const response_handler = (res, status, content = null, message = '', errors = []) => {
    return res.status(status).json({ content, message, errors });
};
const response_internal_server_error = (res, message = 'Internal Server Error', errors = []) => {
    return response_handler(res, 500, undefined, message, errors);
};
exports.response_internal_server_error = response_internal_server_error;
const response_bad_request = (res, message = 'Bad Request', errors = []) => {
    return response_handler(res, 400, undefined, message, errors);
};
exports.response_bad_request = response_bad_request;
const response_unauthorized = (res, message = 'Unauthorized', errors = []) => {
    return response_handler(res, 401, undefined, message, errors);
};
exports.response_unauthorized = response_unauthorized;
const response_forbidden = (res, message = 'Forbidden', errors = []) => {
    return response_handler(res, 403, undefined, message, errors);
};
exports.response_forbidden = response_forbidden;
const response_not_found = (res, message = 'Not Found', errors = []) => {
    return response_handler(res, 404, undefined, message, errors);
};
exports.response_not_found = response_not_found;
const response_success = (res, content = null, message = 'Success') => {
    return response_handler(res, 200, content, message, undefined);
};
exports.response_success = response_success;
const response_created = (res, content = null, message = 'Created') => {
    return response_handler(res, 201, content, message, undefined);
};
exports.response_created = response_created;
