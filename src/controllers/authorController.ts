import { RequestHandler } from 'express';
import { query } from '../db/pool.js';
import { AuthorType, BooKType } from '../types/db-types.js';

export const getAuthors: RequestHandler = async (req, res) => {
	const { rows } = await query(`SELECT * FROM authors`);
	const authors = rows as AuthorType[];

	console.log(authors);
	res.json({ authors });
};

export const getBooksByAuthor: RequestHandler = async (req, res) => {
	const { authorId } = req.params;

	const authorRes = await query('SELECT * FROM authors WHERE id = ($1)', [
		authorId,
	]);
	const author = authorRes.rows[0] as AuthorType;

	const booksRes = await query(
		`SELECT books.* FROM books
     JOIN book_authors ON books.id = book_authors.book_id
     JOIN authors ON book_authors.author_id = authors.id
     WHERE authors.id = ($1)`,
		[authorId]
	);
	const books = booksRes.rows as BooKType[];

	console.log({ authorId });
	console.log(books);
	res.json({ author, books });
};
