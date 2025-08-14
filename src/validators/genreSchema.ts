import { checkSchema } from 'express-validator';

export const genreSchema = checkSchema({
	name: {
		in: ['body'],
		isString: true,
		trim: true,
		notEmpty: {
			errorMessage: 'Genre name is required',
		},
		isLength: {
			options: { min: 2, max: 25 },
			errorMessage: 'Genre name must be between 2 and 25 characters',
		},
	},
});
