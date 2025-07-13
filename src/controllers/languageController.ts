import { RequestHandler } from 'express';
import { query } from '../db/pool.js';
import { BooKType, LanguageType } from '../types/db-types.js';

export const getLanguages: RequestHandler = async (req, res) => {
	const { rows } = await query('SELECT * FROM languages;');
	const languages: LanguageType[] = rows;

	res.json({ languages });
};

export const getBooksByLanguage: RequestHandler = async (req, res) => {
	const { languageId } = req.params;

	const languageRes = await query('SELECT * FROM languages WHERE id = ($1)', [
		languageId,
	]);
	const language: LanguageType = languageRes.rows[0];

	const booksRes = await query(
		`SELECT books.* FROM books
     JOIN book_languages ON books.id = book_languages.book_id
     JOIN languages ON languages.id = book_languages.language_id
     WHERE languages.id = ($1)`,
		[languageId]
	);
	const books: BooKType[] = booksRes.rows;

	res.json({ language, books });
};
