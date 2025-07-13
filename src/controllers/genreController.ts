import { RequestHandler } from 'express';
import { query } from '../db/pool.js';
import { BooKType, GenreType } from '../types/db-types.js';

export const getGenres: RequestHandler = async (req, res) => {
	const { rows } = await query('SELECT * FROM genres');
	const genres: GenreType[] = rows;

	res.json({ genres });
};

export const getBooksByGenreId: RequestHandler = async (req, res) => {
	const { genre } = req.params;
	const { rows } = await query(
		`SELECT books.* FROM books 
     JOIN book_genres ON books.id = book_genres.book_id 
     JOIN genres ON genres.id = book_genres.genre_id 
     WHERE genres.name ILIKE ($1)`,
		[genre]
	);

	const books: BooKType[] = rows;

	res.json({ books });
};
