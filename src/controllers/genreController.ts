import { RequestHandler } from 'express';
import { query } from '../db/pool.js';
import { GenreType } from '../types/db-types.js';
import { BookDisplayType } from '../types/BookDisplayType.js';
import { matchedData, validationResult } from 'express-validator';
import {
	capitalize,
	formatCurrency,
	formatNumToCompactNotation,
} from '../lib/utils.js';
import { CustomNotFoundError } from '../errors/CustomNotFoundError.js';

// 1. Get all genres
export const getGenres: RequestHandler = async (_req, res, next) => {
	try {
		const { rows }: { rows: GenreType[] } = await query(
			'SELECT * FROM genres ORDER BY name'
		);
		const genres = rows.map((row) => ({
			...row,
			name: capitalize(row.name),
		}));

		res.render('genres', { headerTitle: 'Genres', title: null, genres });
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
			// return res.status(404).json({ error: 'Genre not found' });
			throw new CustomNotFoundError('Genre Not Found');
		}

		const genre = genreRes.rows[0] as GenreType;

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
				HAVING $1 = ANY(array_agg(genres.id))
				ORDER BY books.title;`,
			[genreId]
		);

		const books = rows.map((row) => ({
			...row,
			title: capitalize(row.title),
			price: formatCurrency(row.price),
			stock: formatNumToCompactNotation(row.stock),
		}));

		res.render('books', {
			mode: 'show',
			headerTitle: 'Genres',
			title: genre.name,
			books,
			currentPath: `/genres/${genreId}`,
		});
	} catch (error) {
		next(error);
	}
};

// 3. Update a genre
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
				HAVING $1 = ANY(array_agg(genres.id))
				ORDER BY books.title;`,
				[genreId]
			);

			const books = rows.map((row) => ({
				...row,
				title: capitalize(row.title),
				price: formatCurrency(row.price),
				stock: formatNumToCompactNotation(row.stock),
			}));

			return res.status(400).render('books', {
				mode: 'edit',
				headerTitle: 'Genres',
				title: genre.name,
				errors: errors.mapped(),
				data: req.body,
				books,
				currentPath: `/genres/${genreId}`,
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

		// res.status(200).json({ message: `Genre ${genreId} updated successfully` });
		res.status(200).redirect(`/genres/${genreId}`);
	} catch (error) {
		next(error);
	}
};

// Delete a genre
export const deleteGenreById: RequestHandler = async (req, res, next) => {
	const genreId = Number(req.params['genreId']);

	try {
		const delRes = await query('DELETE FROM genres WHERE id = $1', [genreId]);

		if (delRes.rowCount === 0) {
			throw new CustomNotFoundError('Genre Not Found');
		}

		res.status(200).redirect('/genres');
	} catch (error) {
		next(error);
	}
};

// Confirm deletion
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

		res.render('confirm-deletion', { headerTitle: 'genres', data: genre });
	} catch (error) {
		next(error);
	}
};
