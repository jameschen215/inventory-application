import { RequestHandler } from 'express';
import { query } from '../db/pool.js';
import {
	AuthorType,
	BookType,
	GenreType,
	LanguageType,
} from '../types/db-types.js';
import { matchedData, validationResult } from 'express-validator';
import { BookDisplayType } from '../types/BookDisplayType.js';

export const getBooks: RequestHandler = async (req, res) => {
	const { rows }: { rows: BookType[] } = await query('SELECT * FROM books;');

	res.json({ books: rows });
};

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
		// 1. Insert new author(s) if users type in one or more
		const authorRes = await query(
			/**
			 * $1 — the first parameter passed into your SQL query
			 * (usually from your JavaScript array)
			 * ::text[] — this is a PostgreSQL type cast
			 * :: means “cast to this type”
			 * text[] means “an array of text strings”
			 */
			'SELECT * FROM authors WHERE LOWER(name) = ANY($1::text[])',
			[author.map((a) => a.toLocaleLowerCase())]
		);

		const existingAuthors = authorRes.rows as AuthorType[];
		const existingAuthorNames = new Set(
			existingAuthors.map((author) => author.name.toLocaleLowerCase())
		);

		const newAuthorNames = author.filter(
			(a) => !existingAuthorNames.has(a.toLocaleLowerCase())
		);

		if (newAuthorNames.length > 0) {
			console.log('Insert new author(s) before inserting the new book.');
			for (const name of newAuthorNames) {
				await query(
					`INSERT INTO authors (name, bio, dob) VALUES ($1, $2, $3)`,
					[name]
				);
			}
		}

		// 2. Insert new genre(s) if users type in one or more
		const genreRes = await query(
			`SELECT * FROM genres WHERE LOWER(name) = ANY($1::text[])`,
			[genre.map((g) => g.toLocaleLowerCase())]
		);
		const existingGenres = genreRes.rows as GenreType[];
		const existingGenreNames = new Set(
			existingGenres.map((genre) => genre.name.toLocaleLowerCase())
		);
		const newGenreNames = genre.filter(
			(g) => !existingGenreNames.has(g.toLocaleLowerCase())
		);

		if (newGenreNames.length > 0) {
			console.log('Insert new genre(s) before inserting the new book.');
			for (const name of newGenreNames) {
				await query('INSERT INTO genres (name) VALUES ($1)', [name]);
			}
		}

		// 3. Insert new language(s) if users type in one or more
		const languageRes = await query(
			'SELECT * FROM languages WHERE LOWER(name) = ANY($1::text[])',
			[language.map((l) => l.toLocaleLowerCase())]
		);
		const existingLanguages = languageRes.rows as LanguageType[];
		const existingLanguageNames = new Set(
			existingLanguages.map((l) => l.name.toLocaleLowerCase())
		);
		const newLanguageNames = language.filter(
			(l) => !existingLanguageNames.has(l.toLocaleLowerCase())
		);

		if (newLanguageNames.length > 0) {
			console.log('Insert new language(s) before inserting the new book.');
			for (const name of newLanguageNames) {
				await query('INSERT INTO languages (name) VALUES ($1)', [name]);
			}
		}

		// 4. Insert new book if not existing
		await query(
			`INSERT INTO books (title, subtitle, description, stock, price, published_at, cover_url)
			 VALUES ($1, $2, $3, $4, $5, $6, $7)
			 ON CONFLICT DO NOTHING`,
			[title, subtitle, description, stock, price, published_at, cover_url]
		);

		// 5. Get new book id and related author id(s), genre id(s), and language id(s)
		// 5.1 Get book id
		const newBookRes = await query(
			'SELECT * FROM books WHERE LOWER(title) = ($1)',
			[title.toLocaleLowerCase()]
		);
		const newBooks = newBookRes.rows as BookType[];
		const newBookId = newBooks[0].id;

		// 5.2 Get author id(s)
		const authorsRes = await query(
			`SELECT * FROM authors WHERE LOWER(name) = ANY($1::text[])`,
			[author.map((a) => a.toLocaleLowerCase())]
		);
		const authors = authorRes.rows as AuthorType[];
		const authorIds = authors.map((a) => a.id);

		// 5.3 Get genre id(s)
		const genresRes = await query(
			'SELECT * FROM genres WHERE LOWER(name) = ANY($1::text[])',
			[genre.map((g) => g.toLocaleLowerCase())]
		);
		const genres = genresRes.rows as GenreType[];
		const genreIds = genres.map((g) => g.id);

		// 5.4 Get language id(s)
		const languagesRes = await query(
			'SELECT * FROM languages WHERE LOWER(name) = ANY($1::text[])',
			[language.map((l) => l.toLocaleLowerCase())]
		);
		const languages = languagesRes.rows as LanguageType[];
		const languageIds = languages.map((l) => l.id);

		// 6. Insert relationship into book_authors
		for (const authorId of authorIds) {
			await query(
				`INSERT INTO book_authors (book_id, author_id)
				VALUES ($1, $2) ON CONFLICT DO NOTHING`,
				[newBookId, authorId]
			);
		}

		// 7. Insert relationship into book_genres
		for (const genreId of genreIds) {
			await query(
				`INSERT INTO book_genres (book_id, genre_id)
				 VALUES ($1, $2) ON CONFLICT DO NOTHING`,
				[newBookId, genreId]
			);
		}

		// 8. Insert relationship into book_languages
		for (const languageId of languageIds) {
			await query(
				`INSERT INTO book_languages (book_id, language_id)
				 VALUES ($1, $2)`,
				[newBookId, languageId]
			);
		}
	} catch (error) {
		next(error);
	}
	res.json({ message: 'New book created successfully!' });
};
