import 'dotenv/config';
import { RequestHandler } from 'express';

export const getAdminPasswordForm: RequestHandler = (req, res) => {
	// If already logged in, redirect to the original URL they wanted
	if (req.cookies.admin) {
		const redirectPath =
			typeof req.query.redirect === 'string' ? req.query.redirect : '/';
		return res.redirect(redirectPath);
	}

	res.render('admin-page', {
		title: 'Admin',
		redirect: req.query.redirect || '/',
	});
};

export const saveAdminPassword: RequestHandler = (req, res) => {
	const adminPassword = process.env.ADMIN_PASSWORD;
	const { password, redirect } = req.body;

	if (password !== adminPassword) {
		return res.render('admin-page', {
			title: 'Admin',
			error: 'Incorrect admin password',
			redirect: redirect,
			data: { password },
		});
	}

	const redirectUrl = redirect || '/';
	res
		.cookie('admin', true, { maxAge: 60 * 60 * 1000, httpOnly: true }) // 10 minutes
		.redirect(redirectUrl);
};
