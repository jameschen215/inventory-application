import { checkSchema } from 'express-validator';

export const languageSchema = checkSchema({
	name: {
		in: ['body'],
		isString: true,
		trim: true,
		notEmpty: {
			errorMessage: 'Language is required',
		},
		isLength: {
			options: { min: 1, max: 25 },
			errorMessage: 'Language must be between 1 and 25 characters',
		},
	},
});
