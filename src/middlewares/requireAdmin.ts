import { RequestHandler } from 'express';

export const requireAdmin: RequestHandler = (req, res, next) => {
	if (!req.cookies.admin) {
		const originalUrl = req.originalUrl;

		return res
			.status(403)
			.redirect(`/admin?redirect=${encodeURIComponent(originalUrl)}`);
	}

	next();
};
