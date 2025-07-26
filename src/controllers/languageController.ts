import { RequestHandler } from 'express';
import { query } from '../db/pool.js';
import { LanguageType } from '../types/db-types.js';
import { BookDisplayType } from '../types/BookDisplayType.js';
import { matchedData, validationResult } from 'express-validator';
import {
	capitalize,
	formatCurrency,
	formatNumToCompactNotation,
} from '../lib/utils.js';
import { CustomNotFoundError } from '../errors/CustomNotFoundError.js';

// 1. Get all languages
export const getLanguages: RequestHandler = async (_req, res, next) => {
	try {
		const { rows }: { rows: LanguageType[] } = await query(
			'SELECT * FROM languages ORDER BY name;'
		);

		const languages = rows.map((row) => ({
			...row,
			name: capitalize(row.name),
		}));

		res.render('languages', {
			headerTitle: 'Book Inventory',
			title: 'Languages',
			languages,
		});
	} catch (error) {
		next(error);
	}
};

// 2. Get books by language id
export const getBooksByLanguage: RequestHandler = async (req, res, next) => {
	const languageId = Number(req.params['languageId']);

	try {
		const langRes = await query('SELECT * FROM languages WHERE id = $1', [
			languageId,
		]);

		if (langRes.rowCount === 0) {
			// return res.status(404).json({ error: 'Language not found' });
			throw new CustomNotFoundError('Language Not Found');
		}

		const language = langRes.rows[0] as LanguageType;

		const { rows }: { rows: BookDisplayType[] } = await query(
			`SELECT 
						books.*,
						json_agg(DISTINCT authors.name) AS authors,
						json_agg(DISTINCT languages.name) AS languages,
						json_agg(DISTINCT languages.name) AS languages
					FROM books
					LEFT JOIN book_authors ON books.id = book_authors.book_id
					LEFT JOIN authors ON book_authors.author_id = authors.id
					LEFT JOIN book_genres ON books.id = book_genres.book_id
					LEFT JOIN genres ON book_genres.genre_id = genres.id
					LEFT JOIN book_languages ON books.id = book_languages.book_id
					LEFT JOIN languages ON book_languages.language_id = languages.id
					GROUP BY books.id
					HAVING $1 = ANY(array_agg(languages.id))
					ORDER BY books.title;`,
			[languageId]
		);

		const books = rows.map((row) => ({
			...row,
			title: capitalize(row.title),
			price: formatCurrency(row.price),
			stock: formatNumToCompactNotation(row.stock),
		}));

		res.render('books', {
			headerTitle: 'Book Inventory',
			title: language.name,
			books,
		});

		// res.status(200).json({ language, books });
	} catch (error) {
		next(error);
	}
};

// 3. Update a language
export const editLanguageById: RequestHandler = async (req, res, next) => {
	const languageId = Number(req.params['languageId']);
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		try {
			const languageRes = await query('SELECT * FROM languages WHERE id = $1', [
				languageId,
			]);

			if (languageRes.rowCount === 0) {
				throw new CustomNotFoundError('Language Not Found');
			}

			const language: LanguageType = languageRes.rows[0];

			return res.status(400).render('edit-form', {
				mode: 'language',
				headerTitle: 'Book Inventory',
				title: language.name,
				errors: errors.mapped(),
				data: { ...req.body, id: languageId },
			});
		} catch (error) {
			next(error);
		}
	}

	const { name }: { name: string } = matchedData(req);

	try {
		const { rowCount } = await query(
			'UPDATE languages SET name = $1 WHERE id = $2',
			[name, languageId]
		);

		if (rowCount === 0) {
			throw new CustomNotFoundError('Language Not Found');
		}

		res.status(200).redirect(`/languages`);
	} catch (error) {
		next(error);
	}
};

// 4. Delete a language
export const deleteLanguageById: RequestHandler = async (req, res, next) => {
	const languageId = Number(req.params['languageId']);

	try {
		const { rowCount } = await query('DELETE FROM languages WHERE id = $1', [
			languageId,
		]);

		if (rowCount === 0) {
			throw new CustomNotFoundError('Language Not Found');
		}

		res.status(200).redirect('/languages');
	} catch (error) {
		next(error);
	}
};

// 5. Get confirm deletion
export const getConfirmDeletion: RequestHandler = async (req, res, next) => {
	const languageId = Number(req.params['languageId']);

	try {
		const langRes = await query('SELECT * FROM languages WHERE id = $1', [
			languageId,
		]);

		if (langRes.rowCount === 0) {
			throw new CustomNotFoundError('Language Not Found');
		}

		const language: LanguageType = langRes.rows[0];

		res.render('confirm-deletion', {
			headerTitle: 'Book Inventory',
			title: null,
			data: language,
		});
	} catch (error) {
		next(error);
	}
};

// Get edit form
export const getEditForm: RequestHandler = async (req, res, next) => {
	const languageId = Number(req.params['languageId']);

	try {
		const languageRes = await query('SELECT * FROM languages WHERE id = $1', [
			languageId,
		]);

		if (languageRes.rowCount === 0) {
			throw new CustomNotFoundError('language Not Found');
		}

		const language: LanguageType = languageRes.rows[0];

		res.render('edit-form', {
			mode: 'language',
			headerTitle: 'Book Inventory',
			title: 'Edit Language',
			errors: null,
			data: language,
		});
	} catch (error) {
		next(error);
	}
};
