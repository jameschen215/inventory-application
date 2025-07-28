import 'dotenv/config';
import { RequestHandler } from 'express';

export const getAdminPasswordForm: RequestHandler = (req, res) => {
	// If already logged in, redirect to the original URL they wanted
	if (req.cookies.admin) {
		const redirectUrl =
			typeof req.query.redirect === 'string' ? req.query.redirect : '/';
		return res.redirect(redirectUrl);
	}

	res.render('admin-password-form', {
		title: 'Admin',
		redirect: req.query.redirect || '/',
	});
};

export const saveAdminPassword: RequestHandler = (req, res) => {
	const adminPassword = process.env.ADMIN_PASSWORD;
	const { password, redirect } = req.body;

	if (password !== adminPassword) {
		return res.render('admin-password-form', {
			title: 'Admin',
			error: 'Incorrect admin password',
			redirect: redirect,
			data: { password },
		});
	}

	const redirectUrl = redirect || '/';
	res
		.cookie('admin', true, { maxAge: 60 * 60 * 1000, httpOnly: true })
		.redirect(redirectUrl);
};
