import { RequestHandler } from 'express';
import { query } from '../db/pool.js';

export const getBooks: RequestHandler = async (req, res) => {
	const { rows } = await query('SELECT * FROM books;');

	res.json({ books: rows });
};
