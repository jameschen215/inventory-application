import { RequestHandler } from 'express';
import { format } from 'date-fns';

import { query } from '../db/pool.js';
import { BookType, GenreType } from '../types/db-types.js';
import { matchedData, validationResult } from 'express-validator';
import { BookDisplayType } from '../types/BookDisplayType.js';
import { insertJoins, processEntity } from '../services/bookHelpers.js';
import {
	capitalize,
	formatCurrency,
	formatNumToCompactNotation,
} from '../lib/utils.js';

// 1. Get all books
export const getBooks: RequestHandler = async (_req, res, next) => {
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
			GROUP BY books.id;`
		);
		const books = rows.map((row) => ({
			...row,
			title: capitalize(row.title),
			price: formatCurrency(row.price),
			stock: formatNumToCompactNotation(row.stock),
		}));

		res.render('books', { title: 'Books', books });
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
				json_agg(DISTINCT genres.name) AS genres,
				json_agg(DISTINCT languages.name) AS languages
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
			genres: book.genres.join(', '),
			languages: book.languages.join(', '),
			published_at: book.published_at
				? format(book.published_at, 'yyyy')
				: 'N/A',
		};

		// res.status(200).json({ book });
		res.render('book', { title: 'Book Details', book: formattedBook });
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
			[title, subtitle, description, stock, price, published_at, cover_url]
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
export const editABookPartially: RequestHandler = async (req, res, next) => {
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array(), data: req.body });
	}

	const bookId = Number(req.params['bookId']);
	const formData = matchedData(req);

	try {
		// 1. Handle entity fields if they exist
		let authorIds: number[] = [];
		let genreIds: number[] = [];
		let languageIds: number[] = [];

		if (formData.author) {
			authorIds = (await processEntity('authors', formData.author)) as number[];
			delete formData.author;
		}

		if (formData.genre) {
			genreIds = (await processEntity('genres', formData.genre)) as number[];
			delete formData.genre;
		}

		if (formData.language) {
			languageIds = (await processEntity(
				'languages',
				formData.language
			)) as number[];
			delete formData.language;
		}

		// 2. Dynamically build UPDATE query only with present fields
		const keys = Object.keys(formData);
		console.log(keys);

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
				return res
					.status(404)
					.json({ error: 'Book not found or no changes made' });
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

		res.status(200).json({ message: `Book ${bookId} updated successfully` });
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

		res.status(200).json({ message: 'Book deleted successfully' });
	} catch (error) {
		next(error);
	}
};

// 6. Get create form
export const getCreateForm: RequestHandler = async (_req, res) => {
	const { rows }: { rows: GenreType[] } = await query(`SELECT * FROM genres`);
	const genres: GenreType[] = rows.map((row) => ({
		...row,
		name: row.name.toLowerCase(),
	}));

	res.render('book-form', {
		title: 'Books',
		genres,
		errors: null,
		data: null,
	});
};

// Update a book
export const editABook: RequestHandler = async (req, res, next) => {
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array(), data: req.body });
	}

	const bookId = Number(req.params['bookId']);
	const formData = matchedData(req, {
		includeOptionals: true,
	}) as BookDisplayType;
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

		// 2. Update the book info
		const updateRes = await query(
			`UPDATE books 
		 	SET title = $1,
		 		subtitle = $2,
				description = $3,
				stock = $4,
				price = $5,
				published_at = $6,
				cover_url = $7
			WHERE id = $8`,
			[
				title,
				subtitle,
				description,
				stock,
				price,
				published_at,
				cover_url,
				bookId,
			]
		);

		if (updateRes.rowCount === 0) {
			return res
				.status(404)
				.json({ error: 'Book not found or no changes made' });
		}

		// 3. Insert relationships
		await insertJoins('book_authors', 'author_id', bookId, authorIds);
		await insertJoins('book_genres', 'genre_id', bookId, genreIds);
		await insertJoins('book_languages', 'language_id', bookId, languageIds);

		res.status(200).json({ message: `Book ${bookId} updated successfully` });
	} catch (error) {
		next(error);
	}
};
