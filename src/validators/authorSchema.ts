import { checkSchema } from 'express-validator';

export const authorSchema = checkSchema({
	name: {
		in: ['body'],
		isString: true,
		trim: true,
		notEmpty: {
			errorMessage: 'Author name is required',
		},
		isLength: {
			options: { min: 1, max: 100 },
			errorMessage: 'Author name must be between 1 and 100 characters',
		},
	},
});
