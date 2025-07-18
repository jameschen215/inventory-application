import { checkSchema } from 'express-validator';

export const bookCreateSchema = checkSchema({
	title: {
		in: ['body'],
		isString: true,
		trim: true,
		notEmpty: {
			errorMessage: 'Title is required',
		},
		isLength: {
			options: { min: 1, max: 255 },
			errorMessage: 'Title must be between 1 and 255 characters',
		},
	},
	subtitle: {
		in: ['body'],
		optional: true,
		isString: true,
		trim: true,
		isLength: {
			options: { max: 255 },
			errorMessage: 'Subtitle must not exceed 255 characters',
		},
	},
	description: {
		in: ['body'],
		optional: true,
		isString: true,
		trim: true,
	},
	stock: {
		in: ['body'],
		notEmpty: {
			errorMessage: 'Stock is required',
		},
		isInt: {
			options: { min: 1 },
			errorMessage: 'Stock must be a positive integer',
		},
		toInt: true,
	},
	price: {
		in: ['body'],
		notEmpty: {
			errorMessage: 'Price is required',
		},
		isFloat: {
			errorMessage: 'Price must be a number',
		},
		matches: {
			options: [/^\d+(\.\d{2})?$/],
			errorMessage: 'Price must have up to two decimal places',
		},
		toFloat: true,
	},
	authors: {
		in: ['body'],
		isArray: {
			errorMessage:
				'Please enter one or more author names, separated with commas',
		},
		custom: {
			options: (author: string[]) =>
				author.length > 0 &&
				author.every((a) => /^[a-zA-Z\s\.]{2,100}$/.test(a)),
			errorMessage:
				'Each author must be a valid word (2-25 letters), and at least one author is required',
		},
	},
	genres: {
		in: ['body'],
		isArray: {
			errorMessage: 'Please input one or more genres',
		},
		custom: {
			options: (genre: string[]) =>
				genre.length > 0 && genre.every((g) => /^[a-zA-Z\s]{2,25}$/.test(g)),
			errorMessage:
				'Each genre must be a valid word (2-25 letters), and at least one genre is required',
		},
	},
	languages: {
		in: ['body'],
		isArray: {
			errorMessage: 'Please enter one or more languages, separated with commas',
		},
		custom: {
			options: (language: string[]) =>
				language.length > 0 &&
				language.every((l) => /^[a-zA-Z\s]{2,25}$/.test(l)),
			errorMessage: `
        Each language must be a valid word (2-25 letters), 
        and at least one language is required`,
		},
	},
	published_at: {
		in: ['body'],
		optional: true,
		isISO8601: {
			errorMessage: 'Published date must be a valid date',
		},
		toDate: true,
	},
	cover_url: {
		in: ['body'],
		optional: true,
		isString: true,
		trim: true,
	},
});

export const bookEditSchema = checkSchema({
	title: {
		in: ['body'],
		optional: true,
		isString: true,
		trim: true,
		isLength: {
			options: { min: 1, max: 255 },
			errorMessage: 'Title must be between 1 and 255 characters',
		},
	},
	subtitle: {
		in: ['body'],
		optional: true,
		isString: true,
		trim: true,
		isLength: {
			options: { max: 255 },
			errorMessage: 'Subtitle must not exceed 255 characters',
		},
	},
	description: {
		in: ['body'],
		optional: true,
		isString: true,
		trim: true,
	},
	stock: {
		in: ['body'],
		optional: true,
		isInt: {
			options: { min: 1 },
			errorMessage: 'Stock must be a positive integer',
		},
		toInt: true,
	},
	price: {
		in: ['body'],
		optional: true,
		isFloat: {
			errorMessage: 'Price must be a number',
		},
		matches: {
			options: [/^\d+(\.\d{2})?$/],
			errorMessage: 'Price must have exactly two decimal places',
		},
		toFloat: true,
	},
	authors: {
		in: ['body'],
		optional: true,
		isArray: {
			errorMessage:
				'Please enter one or more author names, separated with commas',
		},
		custom: {
			options: (author: string[]) =>
				author.every((a) => /^[a-zA-Z\s]{2,100}$/.test(a)),
			errorMessage: 'Each author must be a valid word (2-25 letters)',
		},
	},
	genres: {
		in: ['body'],
		optional: true,
		isArray: {
			errorMessage: 'Please input one or more genres',
		},
		custom: {
			options: (genre: string[]) =>
				genre.every((g) => /^[a-zA-Z\s]{2,25}$/.test(g)),
			errorMessage: 'Each genre must be a valid word (2-25 letters)',
		},
	},
	languages: {
		in: ['body'],
		optional: true,
		isArray: {
			errorMessage: 'Please enter one or more languages, separated with commas',
		},
		custom: {
			options: (language: string[]) =>
				language.every((l) => /^[a-zA-Z\s]{2,25}$/.test(l)),
			errorMessage: 'Each language must be a valid word (2-25 letters)',
		},
	},
	published_at: {
		in: ['body'],
		optional: true,
		isISO8601: {
			errorMessage: 'Published date must be a valid date',
		},
		toDate: true,
	},
	cover_url: {
		in: ['body'],
		optional: true,
		isString: true,
		trim: true,
	},
});
