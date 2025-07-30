import { format } from 'date-fns';
import { RequestHandler } from 'express';
import { matchedData, validationResult } from 'express-validator';

import {
	capitalize,
	formatCurrency,
	formatNumToCompactNotation,
} from '../lib/utils.js';
import { query } from '../db/pool.js';
import { AuthorType } from '../types/db-types.js';
import { BookDisplayType } from '../types/BookDisplayType.js';
import { CustomNotFoundError } from '../errors/CustomNotFoundError.js';
import { CustomBadRequestError } from '../errors/CustomBadRequestError.js';

// 1. Get all authors
export const getAuthors: RequestHandler = async (req, res, next) => {
	const { q = '' } = req.query || {};

	try {
		const authorsRes = await query(
			`SELECT * FROM authors WHERE name ILIKE $1`,
			[`%${q}%`]
		);

		const authors: AuthorType[] = authorsRes.rows;

		res.render('authors', {
			title: 'Authors',
			authors,
		});
	} catch (error) {
		next(error);
	}
};

// 2. Get author by id
export const getAuthorById: RequestHandler = async (req, res, next) => {
	const authorId = Number(req.params['authorId']);

	try {
		const authorRes = await query('SELECT * FROM authors WHERE id = $1', [
			authorId,
		]);

		if (authorRes.rowCount === 0) {
			throw new CustomNotFoundError('Author Not Found');
		}

		const author: AuthorType = authorRes.rows[0];
		const formatted = {
			...author,
			gender: author.gender ?? 'N/A',
			nationality: author.nationality ?? 'N/A',
			dob: author.dob ? format(author.dob, 'yyyy-MM-dd') : 'N/A',
			bio: author.bio ?? 'No Biography.',
		};

		res.render('author', {
			title: author.name,
			author: formatted,
		});
	} catch (error) {
		next(error);
	}
};

// 3. Get books by author
export const getBooksByAuthorId: RequestHandler = async (req, res, next) => {
	const authorId = Number(req.params['authorId']);

	try {
		const authorRes = await query('SELECT * FROM authors WHERE id = ($1)', [
			authorId,
		]);

		if (authorRes.rowCount === 0) {
			throw new CustomNotFoundError('Author Not Found');
		}

		const author = authorRes.rows[0] as AuthorType;

		const booksRes = await query(
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
			HAVING $1 = ANY(array_agg(authors.id))
			ORDER BY books.id;`,
			[authorId]
		);

		const books: BookDisplayType[] = booksRes.rows.map((row) => ({
			...row,
			price: formatCurrency(row.price),
			stock: formatNumToCompactNotation(row.stock),
		}));

		res.render('books', {
			title: author.name,
			books,
		});
	} catch (error) {
		next(error);
	}
};

// 4. Get author form
export const getEditForm: RequestHandler = async (req, res, next) => {
	const authorId = Number(req.params['authorId']);

	try {
		const authorRes = await query('SELECT * FROM authors WHERE id = $1', [
			authorId,
		]);

		if (authorRes.rowCount === 0) {
			throw new CustomNotFoundError('Author Not Found');
		}

		const author: AuthorType = authorRes.rows[0];
		const formatted = {
			...author,
			gender: author.gender ?? '',
			nationality: author.nationality ?? '',
			bio: author.bio ?? '',
			dob: author.dob ? new Date(author.dob).toISOString().slice(0, 10) : '',
		};

		res.render('author-form', {
			title: 'Edit Author',
			data: formatted,
			errors: null,
			cancelPath: req.query.from || '/',
		});
	} catch (error) {
		next(error);
	}
};

// 5. Update an author
export const editAuthorById: RequestHandler = async (req, res, next) => {
	const authorId = Number(req.params['authorId']);
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		return res.status(400).render('author-form', {
			title: 'Edit Author',
			errors: errors.mapped(),
			data: {
				...req.body,
				id: authorId,
				dob: req.body['dob']
					? new Date(req.body['dob']).toISOString().slice(0, 10)
					: '',
			},
		});
	}

	const formData: AuthorType = matchedData(req);
	const formattedFormData = {
		...formData,
		name: capitalize(formData.name),
		gender: formData.gender ? capitalize(formData.gender) : null,
		nationality: formData.nationality
			? formData.nationality.toUpperCase()
			: null,
		bio: formData.bio ? capitalize(formData.bio) : null,
		dob: formData.dob ? new Date(formData.dob) : null,
	};
	try {
		const { rowCount } = await query(
			`UPDATE authors 
			SET name = $1,
					gender = $2,
					nationality = $3,
					bio = $4,
					dob = $5
			WHERE id = $6`,
			[
				formattedFormData.name,
				formattedFormData.gender,
				formattedFormData.nationality,
				formattedFormData.bio,
				formattedFormData.dob,
				authorId,
			]
		);

		if (rowCount === 0) {
			throw new CustomNotFoundError('Author Not Found');
		}

		res.status(200).redirect(`/authors/${authorId}`);
	} catch (error) {
		next(error);
	}
};

// 6. Delete an author
export const deleteAuthorById: RequestHandler = async (req, res, next) => {
	const authorId = Number(req.params['authorId']);

	try {
		// 1. Check if the author is linked to any books
		const findRes = await query(
			'SELECT 1 FROM book_authors WHERE author_id = $1 LIMIT 1',
			[authorId]
		);

		if (findRes.rowCount && findRes.rowCount > 0) {
			throw new CustomBadRequestError(
				"Can't delete author: still associated with one or more books"
			);
		}

		// 2. Proceed with deletion
		const delRes = await query('DELETE FROM authors WHERE id = $1', [authorId]);

		if (delRes.rowCount === 0) {
			throw new CustomNotFoundError('Author Not Found');
		}

		res.status(200).redirect('/authors');
	} catch (error) {
		next(error);
	}
};

// 7. Confirm deletion
export const confirmDeletion: RequestHandler = async (req, res, next) => {
	const authorId = Number(req.params['authorId']);

	try {
		const authorRes = await query(
			'SELECT id, name FROM authors WHERE id = $1',
			[authorId]
		);

		if (authorRes.rowCount === 0) {
			throw new CustomNotFoundError('Author Not Found');
		}

		const author: { id: number; name: string } = authorRes.rows[0];

		res.render('confirm-deletion', {
			title: null,
			data: author,
			cancelPath: req.query.from ?? '/',
		});
	} catch (error) {
		next(error);
	}
};
