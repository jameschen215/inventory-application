import { Request, Response, NextFunction } from 'express';
import { capitalizeFirstLetter } from '../utils/capitalizeFirstLetter.js';

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

	res.status(statusCode).json({
		title: capitalizeFirstLetter(title),
		message: capitalizeFirstLetter(message),
		statusCode,
	});
}
