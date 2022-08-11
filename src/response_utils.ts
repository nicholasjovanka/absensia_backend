import type { Response } from "express";

const response_handler = (
	res: Response,
	status: number,
	content: unknown = null,
	message = '',
	errors: Array<string> = []
): Response => {
	return res.status(status).json({ content, message, errors });
};

export const response_internal_server_error = (
	res: Response,
	message = 'Internal Server Error',
	errors: Array<string> = []
): Response => {
	return response_handler(res, 500, undefined, message, errors);
};

export const response_bad_request = (
	res: Response,
	message = 'Bad Request',
	errors: Array<string> = []
): Response => {
	return response_handler(res, 400, undefined, message, errors);
};

export const response_unauthorized = (
	res: Response,
	message = 'Unauthorized',
	errors: Array<string> = []
): Response => {
	return response_handler(res, 401, undefined, message, errors);
};

export const response_forbidden = (
	res: Response,
	message = 'Forbidden',
	errors: Array<string> = []
): Response => {
	return response_handler(res, 403, undefined, message, errors);
};

export const response_not_found = (
	res: Response,
	message = 'Not Found',
	errors: Array<string> = []
): Response => {
	return response_handler(res, 404, undefined, message, errors);
};

export const response_success = (
	res: Response,
	content: unknown = null,
	message = 'Success'
): Response => {
	return response_handler(res, 200, content, message, undefined);
};

export const response_created = (
	res: Response,
	content: unknown = null,
	message = 'Created'
): Response => {
	return response_handler(res, 201, content, message, undefined);
};
