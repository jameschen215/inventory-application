import { RequestHandler } from 'express';

export const normalizeBookInput: RequestHandler = (req, _res, next) => {
	const fieldsToSplit = ['authors', 'genres', 'languages'];

	for (const field of fieldsToSplit) {
		const raw = req.body[field];

		if (typeof raw === 'string') {
			req.body[field] = raw
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean); // Remove empty strings
		}
	}

	if (req.body.new_genre) {
		req.body.genre = [...(req.body.genre ?? []), req.body.new_genre.trim()];
	}

	next();
};
