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
	gender: {
		in: ['body'],
		optional: true,
		isIn: {
			options: [['male', 'female']],
			errorMessage: 'Gender must be either "male" or "female"',
		},
	},
	nationality: {
		optional: true,
		isLength: {
			options: { max: 50 },
			errorMessage: 'Nationality must be at most 50 characters',
		},
		isAlpha: {
			errorMessage: 'Nationality must be real words.',
		},
	},
	dob: {
		in: ['body'],
		optional: { options: { nullable: true, checkFalsy: true } },
		isISO8601: {
			errorMessage: 'Published date must be a valid date',
		},
		customSanitizer: {
			options: (value) => (value === '' ? null : value),
		},
		toDate: true,
	},
	bio: {
		optional: true,
		isString: {
			errorMessage: 'Bio must be a string',
		},
	},
});
