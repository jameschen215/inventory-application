import { RequestHandler } from 'express';
import { query } from '../db/pool.js';
import { BookType } from '../types/db-types.js';
import { matchedData, validationResult } from 'express-validator';
import { BookDisplayType } from '../types/BookDisplayType.js';

// Get all books
export const getBooks: RequestHandler = async (req, res) => {
	const { rows }: { rows: BookType[] } = await query('SELECT * FROM books;');

	res.json({ books: rows });
};

// Post a new book
export const createNewBook: RequestHandler = async (req, res, next) => {
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		return res.status(400).json(errors);
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
		author,
		genre,
		language,
	} = formData;

	try {
		// 1. Helpers
		const processEntity = async (
			table: 'authors' | 'genres' | 'languages',
			values: string[],
			columns = ['name']
		) => {
			const lowerVals = values.map((v) => v.toLowerCase());
			const { rows } = await query(
				`SELECT * FROM ${table} WHERE LOWER(name) = ANY($1::text[])`,
				[lowerVals]
			);
			const existing = rows.map((r: any) => r.name.toLowerCase());
			const toInsert = values.filter(
				(v) => !existing.includes(v.toLowerCase())
			);

			for (const name of toInsert) {
				await query(`INSERT INTO ${table} (name) VALUES ($1)`, [name]);
			}

			const { rows: rowsAfterInserting } = await query(
				`SELECT * FROM ${table} WHERE LOWER(name) = ANY($1::text[])`,
				[lowerVals]
			);

			return rowsAfterInserting.map((r: any) => r.id);
		};

		const insertJoin = async (
			table: 'book_authors' | 'book_genres' | 'book_languages',
			column: 'author_id' | 'genre_id' | 'language_id',
			ids: number[]
		) => {
			for (const id of ids) {
				await query(
					`INSERT INTO ${table} (book_id, ${column}) VALUES ($1, $2) 
					 ON CONFLICT DO NOTHING`,
					[book.id, id]
				);
			}
		};

		// 2. Process related entities
		const authorIds = await processEntity('authors', author);
		const genreIds = await processEntity('genres', genre);
		const languageIds = await processEntity('languages', language);

		// 3. Insert new book if not existing
		await query(
			`INSERT INTO books (title, subtitle, description, stock, price, published_at, cover_url)
			 VALUES ($1, $2, $3, $4, $5, $6, $7)
			 ON CONFLICT DO NOTHING`,
			[title, subtitle, description, stock, price, published_at, cover_url]
		);

		const { rows } = await query(
			'SELECT * FROM books WHERE LOWER(title) = ($1)',
			[title.toLowerCase()]
		);
		const book: BookType = rows[0];

		if (!book) {
			return res.status(500).json({ error: 'Book insertion failed.' });
		}

		// 4. Insert relationships
		await insertJoin('book_authors', 'author_id', authorIds);
		await insertJoin('book_genres', 'genre_id', genreIds);
		await insertJoin('book_languages', 'language_id', languageIds);

		res
			.status(201)
			.json({ message: 'Book created successfully!', bookId: book.id });
	} catch (error) {
		next(error);
	}
};

// Update a book

// Delete a book
