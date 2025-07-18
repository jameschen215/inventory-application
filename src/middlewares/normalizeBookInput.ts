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

	console.log('Genres: ', req.body.genres);

	if (req.body.new_genres) {
		req.body.genre = [
			...(req.body.genres ?? []),
			...req.body.new_genres
				.split(',')
				.map((newGenre: string) => newGenre.trim()),
		];
	}

	next();
};
