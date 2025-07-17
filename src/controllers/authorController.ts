import { RequestHandler } from 'express';
import { query } from '../db/pool.js';
import { AuthorType } from '../types/db-types.js';
import { BookDisplayType } from '../types/BookDisplayType.js';
import { matchedData, validationResult } from 'express-validator';
import { capitalize, capitalizeAll } from '../lib/utils.js';

// 1. Get all authors
export const getAuthors: RequestHandler = async (_req, res, next) => {
	try {
		const { rows }: { rows: AuthorType[] } = await query(
			`SELECT * FROM authors`
		);

		const authors = rows.map((row) => ({
			...row,
			name: capitalizeAll(row.name),
			gender: capitalize(row.gender),
		}));

		res.render('authors', { title: 'Authors', authors });
	} catch (error) {
		next(error);
	}
};

// 2. Get books by author
export const getBooksByAuthorId: RequestHandler = async (req, res, next) => {
	const authorId = Number(req.params['authorId']);

	try {
		const authorRes = await query('SELECT * FROM authors WHERE id = ($1)', [
			authorId,
		]);

		if (authorRes.rowCount === 0) {
			return res.status(404).json({ error: 'Author not found' });
		}

		const author = authorRes.rows[0] as AuthorType;

		const { rows: books }: { rows: BookDisplayType[] } = await query(
			`SELECT 
							books.*,
							json_agg(DISTINCT authors.name) AS authors,
							json_agg(DISTINCT genres.name) AS genres,
							json_agg(DISTINCT languages.name) AS languages
						FROM books
						LEFT JOIN book_authors ON books.id = book_authors.book_id
						LEFT JOIN authors ON book_authors.author_id = authors.id
						LEFT JOIN book_genres ON books.id = book_genres.book_id
						LEFT JOIN genres ON book_genres.genre_id = genres.id
						LEFT JOIN book_languages ON books.id = book_languages.book_id
						LEFT JOIN languages ON book_languages.language_id = languages.id
						GROUP BY books.id
						HAVING $1 = ANY(array_agg(authors.id));`,
			[authorId]
		);

		res.status(200).json({ author, books });
	} catch (error) {
		next(error);
	}
};

// 3. Update an author
export const editAuthorById: RequestHandler = async (req, res, next) => {
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array(), data: req.body });
	}

	const authorId = Number(req.params['authorId']);
	const { name }: { name: string } = matchedData(req);

	try {
		const { rowCount } = await query(
			'UPDATE authors SET name = $1 WHERE id = $2',
			[name, authorId]
		);

		if (rowCount === 0) {
			return res
				.status(404)
				.json({ error: 'Author not found or no changes made' });
		}

		res
			.status(200)
			.json({ message: `Author ${authorId} updated successfully` });
	} catch (error) {
		next(error);
	}
};

// 4. Delete an author
export const deleteAuthorById: RequestHandler = async (req, res, next) => {
	const authorId = Number(req.params['authorId']);

	try {
		// 1. Check if the author is linked to any books
		const { rowCount } = await query(
			'SELECT 1 FROM book_authors WHERE author_id = $1 LIMIT 1',
			[authorId]
		);

		if (rowCount && rowCount > 0) {
			return res.status(400).json({
				error: "Can't delete author: still associated with one or more books",
			});
		}

		// 2. Proceed with deletion
		const delRes = await query('DELETE FROM authors WHERE id = $1', [authorId]);

		if (delRes.rowCount === 0) {
			return res.status(404).json({ error: 'Author not found' });
		}

		res
			.status(200)
			.json({ message: `Author ${authorId} deleted successfully` });
	} catch (error) {
		next(error);
	}
};
