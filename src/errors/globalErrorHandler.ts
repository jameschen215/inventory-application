import { Request, Response, NextFunction } from 'express';
import { capitalize } from '../lib/utils.js';

// global error
interface CustomError extends Error {
	statusCode?: number;
	status?: number;
}

export function globalErrorHandler(
	err: CustomError,
	req: Request,
	res: Response,
	next: NextFunction
) {
	console.error(err);

	const statusCode = err.statusCode ?? err.status ?? 500;
	const message = err.message ? err.message : 'Internal Server Error';
	const title = statusCode === 500 ? 'Server Error' : 'Error';

	res.status(statusCode).render('error', {
		headerTitle: 'Error',
		title: capitalize(title),
		message: capitalize(message),
		statusCode,
	});
}
