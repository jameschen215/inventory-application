import { RequestHandler } from 'express';
import { matchedData, validationResult } from 'express-validator';

import { query } from '../db/pool.js';
import { GenreType } from '../types/db-types.js';
import { BookDisplayType } from '../types/BookDisplayType.js';
import { CustomNotFoundError } from '../errors/CustomNotFoundError.js';
import { formatCurrency, formatNumToCompactNotation } from '../lib/utils.js';
import { CustomBadRequestError } from '../errors/CustomBadRequestError.js';

// 1. Get all genres
export const getGenres: RequestHandler = async (_req, res, next) => {
	try {
		const genresRes = await query(`
      SELECT DISTINCT g.* 
      FROM genres g 
      JOIN book_genres bg ON g.id = bg.genre_id
      ORDER BY g.name;
      `);

		const genres: GenreType[] = genresRes.rows;

		res.render('genres', {
			title: 'Genres',
			genres,
		});
	} catch (error) {
		next(error);
	}
};

// 2. Get all books of a specific genre
export const getBooksByGenreId: RequestHandler = async (req, res, next) => {
	const genreId = Number(req.params['genreId']);

	try {
		const genreRes = await query('SELECT * FROM genres WHERE id = $1', [
			genreId,
		]);

		if (genreRes.rowCount === 0) {
			throw new CustomNotFoundError('Genre Not Found');
		}

		const genre = genreRes.rows[0] as GenreType;

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
			HAVING $1 = ANY(array_agg(genres.id))
			ORDER BY books.title;`,
			[genreId]
		);

		const books: BookDisplayType[] = booksRes.rows.map((row) => ({
			...row,
			price: formatCurrency(row.price),
			stock: formatNumToCompactNotation(row.stock),
		}));

		res.render('books', {
			title: genre.name,
			books,
		});
	} catch (error) {
		next(error);
	}
};

// 3. Get edit form for genres
export const getEditForm: RequestHandler = async (req, res, next) => {
	const genreId = Number(req.params['genreId']);

	try {
		const genreRes = await query('SELECT * FROM genres WHERE id = $1', [
			genreId,
		]);

		if (genreRes.rowCount === 0) {
			throw new CustomNotFoundError('Genre Not Found');
		}

		const genre: GenreType = genreRes.rows[0];

		res.render('genre-language-form', {
			formFor: 'genre',
			title: 'Edit Genre',
			errors: null,
			data: genre,
		});
	} catch (error) {
		next(error);
	}
};

// 4. Update a genre
export const editGenreById: RequestHandler = async (req, res, next) => {
	const genreId = Number(req.params['genreId']);
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		try {
			const genreRes = await query('SELECT * FROM genres WHERE id = $1', [
				genreId,
			]);

			if (genreRes.rowCount === 0) {
				throw new CustomNotFoundError('Genre Not Found');
			}

			const genre: GenreType = genreRes.rows[0];

			return res.status(400).render('edit-form', {
				formFor: 'genre',
				title: genre.name,
				errors: errors.mapped(),
				data: { ...req.body, id: genreId },
			});
		} catch (error) {
			next(error);
		}
	}

	const { name }: { name: string } = matchedData(req);

	try {
		const { rowCount } = await query(
			`UPDATE genres SET name = $1 WHERE id = $2`,
			[name, genreId]
		);

		if (rowCount === 0) {
			throw new CustomNotFoundError('Genre Not Found');
		}

		res.status(200).redirect(`/genres`);
	} catch (error) {
		next(error);
	}
};

// 5. Get deleting confirmation page
export const getConfirmDeletion: RequestHandler = async (req, res, next) => {
	const genreId = Number(req.params['genreId']);

	try {
		const genreRes = await query('SELECT * FROM genres WHERE id = $1', [
			genreId,
		]);

		if (genreRes.rowCount === 0) {
			throw new CustomNotFoundError('Genre Not Found');
		}

		const genre: GenreType = genreRes.rows[0];

		res.render('confirm-deletion', {
			title: null,
			data: genre,
			cancelPath: req.query.from || '/',
			returnPath: req.query.returnTo || '/',
		});
	} catch (error) {
		next(error);
	}
};

// 6. Delete a genre
export const deleteGenreById: RequestHandler = async (req, res, next) => {
	const genreId = Number(req.params['genreId']);

	try {
		// 1. Check if genre is linked to any books
		const bookRes = await query(
			`SELECT 1 FROM book_genres WHERE genre_id = $1 LIMIT 1`,
			[genreId]
		);
		if (bookRes.rowCount && bookRes.rowCount > 0) {
			throw new CustomBadRequestError(
				"Can't delete genre: still associated with one or more books"
			);
		}

		// 2. Proceed with deletion
		const genreRes = await query('DELETE FROM genres WHERE id = $1', [genreId]);

		if (genreRes.rowCount === 0) {
			throw new CustomNotFoundError('Genre Not Found');
		}

		res.status(200).redirect('/genres');
	} catch (error) {
		next(error);
	}
};
