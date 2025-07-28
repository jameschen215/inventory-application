import { RequestHandler } from 'express';
import { format } from 'date-fns';

import { query } from '../db/pool.js';
import { BookType, GenreType } from '../types/db-types.js';
import { matchedData, validationResult } from 'express-validator';
import { BookDisplayType } from '../types/BookDisplayType.js';
import { insertJoins, processEntity } from '../services/bookHelpers.js';
import {
	capitalize,
	capitalizeAll,
	formatCurrency,
	formatNumToCompactNotation,
} from '../lib/utils.js';
import { CustomNotFoundError } from '../errors/CustomNotFoundError.js';

// 1. Get all books
export const getBooks: RequestHandler = async (req, res, next) => {
	const { q = '' } = req.query || {};

	try {
		const { rows }: { rows: BookDisplayType[] } = await query(
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
			HAVING books.title ILIKE $1
			ORDER BY books.title;`,
			[`%${q}%`]
		);
		const books = rows.map((row) => ({
			...row,
			title: capitalize(row.title),
			price: formatCurrency(row.price),
			stock: formatNumToCompactNotation(row.stock),
		}));

		res.render('books', {
			headerTitle: 'Book Inventory',
			title: 'Books',
			books,
			currentPath: '/',
		});
	} catch (error) {
		next(error);
	}
};

// 2. Get book by id
export const getBookById: RequestHandler = async (req, res, next) => {
	const bookId = Number(req.params['bookId']);

	try {
		const bookRes = await query(
			`SELECT 
				books.*,
				json_agg(DISTINCT authors.name) AS authors,
				COALESCE(json_agg(DISTINCT genres.name) FILTER (WHERE genres.name IS NOT NULL), '[]') AS genres,
				COALESCE(json_agg(DISTINCT languages.name) FILTER (WHERE languages.name IS NOT NULL), '[]') AS languages
			FROM books
			LEFT JOIN book_authors ON books.id = book_authors.book_id
			LEFT JOIN authors ON book_authors.author_id = authors.id
			LEFT JOIN book_genres ON books.id = book_genres.book_id
			LEFT JOIN genres ON book_genres.genre_id = genres.id
			LEFT JOIN book_languages ON books.id = book_languages.book_id
			LEFT JOIN languages ON book_languages.language_id = languages.id
			WHERE books.id = $1
			GROUP BY books.id;`,
			[bookId]
		);
		if (bookRes.rowCount === 0) {
			return res.status(404).json({ error: 'Book not found' });
		}
		const book = bookRes.rows[0] as BookDisplayType;

		const formattedBook = {
			...book,
			title: capitalize(book.title),
			subtitle: book.subtitle ? capitalize(book.subtitle) : null,
			stock: formatNumToCompactNotation(book.stock),
			price: formatCurrency(book.price),
			authors: book.authors.join(', '),
			genres: book.genres.length > 0 ? book.genres.join(', ') : 'Unknown',
			languages:
				book.languages.length > 0 ? book.languages.join(', ') : 'Unknown',
			published_at: book.published_at
				? format(book.published_at, 'yyyy')
				: 'Unknown',
		};

		res.render('book', {
			headerTitle: 'Book Details',
			title: null,
			book: formattedBook,
			returnPath: req.query.from ?? '/',
		});
	} catch (error) {
		next(error);
	}
};

// 3. Post a new book
export const createNewBook: RequestHandler = async (req, res, next) => {
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		// return res.status(400).json(errors);
		const { rows }: { rows: GenreType[] } = await query('SELECT * FROM genres');
		const genres = rows.map((row) => ({
			...row,
			name: row.name.toLowerCase(),
		}));

		return res.status(400).render('book-form', {
			title: 'Books',
			genres,
			errors: errors.mapped(),
			data: req.body,
		});
	}

	const formData = matchedData(req) as BookDisplayType;
	const {
		title,
		subtitle,
		description,
		stock,
		price,
		published_at,
		cover_url,
		authors,
		genres,
		languages,
	} = formData;

	try {
		// 1. Process related entities
		const authorIds = (await processEntity('authors', authors)) as number[];
		const genreIds = (await processEntity('genres', genres)) as number[];
		const languageIds = (await processEntity(
			'languages',
			languages
		)) as number[];

		// 2. Insert new book if not existing
		const insertBookRes = await query(
			`INSERT INTO books (title, subtitle, description, stock, price, published_at, cover_url)
			 VALUES ($1, $2, $3, $4, $5, $6, $7)
			 ON CONFLICT DO NOTHING
			 RETURNING *`,
			[
				capitalizeAll(title),
				capitalize(subtitle),
				description,
				stock,
				price,
				published_at,
				cover_url,
			]
		);
		const book: BookType | undefined = insertBookRes.rows[0];

		if (!book) {
			return res.status(500).json({ error: 'Book insertion failed.' });
		}

		// 3. Insert relationships
		await insertJoins('book_authors', 'author_id', book.id, authorIds);
		await insertJoins('book_genres', 'genre_id', book.id, genreIds);
		await insertJoins('book_languages', 'language_id', book.id, languageIds);

		res.status(201).redirect('/');
	} catch (error) {
		next(error);
	}
};

// 4. Partial updating
export const editBookPartially: RequestHandler = async (req, res, next) => {
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		// return res.status(400).json({ errors: errors.array(), data: req.body });
		const { rows }: { rows: GenreType[] } = await query('SELECT * FROM genres');
		const genres = rows.map((row) => ({
			...row,
			name: row.name.toLowerCase(),
		}));

		return res.status(400).render('book-form', {
			title: 'Books',
			genres,
			errors: errors.mapped(),
			data: req.body,
		});
	}

	const bookId = Number(req.params['bookId']);
	const formData = matchedData(req);

	try {
		// 1. Handle entity fields if they exist
		let authorIds: number[] = [];
		let genreIds: number[] = [];
		let languageIds: number[] = [];

		if (formData.authors) {
			authorIds = (await processEntity(
				'authors',
				formData.authors
			)) as number[];
			delete formData.authors;
		}

		if (formData.genres) {
			genreIds = (await processEntity('genres', formData.genres)) as number[];
			delete formData.genres;
		}

		if (formData.languages) {
			languageIds = (await processEntity(
				'languages',
				formData.languages
			)) as number[];
			delete formData.languages;
		}

		// 2. Dynamically build UPDATE query only with present fields
		const keys = Object.keys(formData);

		if (keys.length > 0) {
			const setClause = keys
				.map((key, index) => `${key} = $${index + 1}`)
				.join(', ');
			const values = Object.values(formData);

			// Awesome!
			const updateRes = await query(
				`UPDATE books SET ${setClause} WHERE id = $${keys.length + 1}`, // 8 if full updating
				[...values, bookId]
			);

			if (updateRes.rowCount === 0) {
				// return res
				// 	.status(404)
				// 	.json({ error: 'Book not found or no changes made' });
				throw new CustomNotFoundError('Book Not Found');
			}
		}

		// 3. Update relationships if needed
		if (authorIds.length) {
			await insertJoins('book_authors', 'author_id', bookId, authorIds);
		}
		if (genreIds.length) {
			await insertJoins('book_genres', 'genre_id', bookId, genreIds);
		}
		if (languageIds.length) {
			await insertJoins('book_languages', 'language_id', bookId, languageIds);
		}

		res.status(200).redirect(`/books/${bookId}`);
	} catch (error) {
		next(error);
	}
};

// 5. Delete a book
export const deleteBookById: RequestHandler = async (req, res, next) => {
	const bookId = Number(req.params['bookId']);

	try {
		const delRes = await query('DELETE FROM books WHERE id = $1', [bookId]);

		if (delRes.rowCount === 0) {
			return res.status(404).json({ error: 'Book not found' });
		}

		const returnTo = typeof req.query.from === 'string' ? req.query.from : '/';

		res.status(200).redirect(returnTo);
	} catch (error) {
		next(error);
	}
};

// 6. Get create form
export const getCreateForm: RequestHandler = async (req, res, next) => {
	try {
		const { rows }: { rows: GenreType[] } = await query(`SELECT * FROM genres`);
		const genres: GenreType[] = rows.map((row) => ({
			...row,
			name: row.name.toLowerCase(),
		}));

		res.render('book-form', {
			headerTitle: 'Books',
			title: 'Create New Book',
			genres,
			errors: null,
			data: null,
		});
	} catch (error) {
		next(error);
	}
};

// 7. Get edit form
export const getEditForm: RequestHandler = async (req, res, next) => {
	const bookId = Number(req.params['bookId']);

	try {
		const { rows }: { rows: GenreType[] } = await query(`SELECT * FROM genres`);
		const genres: GenreType[] = rows.map((row) => ({
			...row,
			name: row.name.toLowerCase(),
		}));

		const bookRes = await query(
			`SELECT 
				books.*,
				json_agg(DISTINCT authors.name) AS authors,
				COALESCE(json_agg(DISTINCT genres.name) FILTER (WHERE genres.name IS NOT NULL), '[]') AS genres,
				COALESCE(json_agg(DISTINCT languages.name) FILTER (WHERE genres.name IS NOT NULL), '[]') AS languages
			FROM books
			LEFT JOIN book_authors ON books.id = book_authors.book_id
			LEFT JOIN authors ON book_authors.author_id = authors.id
			LEFT JOIN book_genres ON books.id = book_genres.book_id
			LEFT JOIN genres ON book_genres.genre_id = genres.id
			LEFT JOIN book_languages ON books.id = book_languages.book_id
			LEFT JOIN languages ON book_languages.language_id = languages.id
			WHERE books.id = $1
			GROUP BY books.id ORDER BY books.title;`,
			[bookId]
		);
		if (bookRes.rowCount === 0) {
			return res.status(404).json({ error: 'Book not found' });
		}
		const book = bookRes.rows[0] as BookDisplayType;

		// console.log('Book: ', book);

		const formattedBook = {
			...book,
			authors: book.authors.join(', '),
			languages: book.languages.join(', '),
			genres: book.genres.map((g) => g.toLowerCase()),
			published_at: book.published_at
				? new Date(book.published_at).toISOString().slice(0, 10)
				: '',
		};

		const previousUrl = req.originalUrl.split('/').slice(0, -1).join('/');

		res.render('book-form', {
			headerTitle: 'Book Inventory',
			title: 'Edit Book',
			genres,
			errors: null,
			data: formattedBook,
			previousUrl,
		});
	} catch (error) {
		next(error);
	}
};

// 8. Confirm delete
export const confirmDeletion: RequestHandler = async (req, res, next) => {
	const bookId = Number(req.params['bookId']);

	try {
		const bookRes = await query(
			'SELECT id, title as name FROM books WHERE id = $1',
			[bookId]
		);

		if (bookRes.rowCount === 0) {
			throw new CustomNotFoundError('Book Not Found');
		}

		const book = bookRes.rows[0];
		const previousUrl = req.originalUrl.split('/').slice(0, -1).join('/');
		const returnUrl =
			typeof req.query.from === 'string'
				? req.query.from.split('/').slice(0, 3).join('/')
				: '/';

		res.render('confirm-deletion', {
			headerTitle: 'Book Inventory',
			title: null,
			data: book,
			previousUrl,
			returnUrl,
		});
	} catch (error) {
		next(error);
	}
};
