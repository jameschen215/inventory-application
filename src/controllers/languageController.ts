import { RequestHandler } from 'express';
import { matchedData, validationResult } from 'express-validator';

import { query } from '../db/pool.js';
import { LanguageType } from '../types/db-types.js';
import { BookDisplayType } from '../types/BookDisplayType.js';
import { CustomNotFoundError } from '../errors/CustomNotFoundError.js';
import {
  capitalize,
  formatCurrency,
  formatNumToCompactNotation,
} from '../lib/utils.js';
import { CustomBadRequestError } from '../errors/CustomBadRequestError.js';

// 1. Get all languages
export const getLanguages: RequestHandler = async (_req, res, next) => {
  try {
    const languagesRes = await query(`
			SELECT DISTINCT l.* 
			FROM languages l
			JOIN book_languages bl ON l.id = bl.language_id
			ORDER BY l.name;
			`);
    const languages: LanguageType[] = languagesRes.rows;

    res.render('languages', {
      title: 'Languages',
      languages,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get books in a specific language
export const getBooksByLanguage: RequestHandler = async (req, res, next) => {
  const languageId = Number(req.params['languageId']);

  try {
    const langRes = await query('SELECT * FROM languages WHERE id = $1', [
      languageId,
    ]);

    if (langRes.rowCount === 0) {
      throw new CustomNotFoundError('Language Not Found');
    }

    const language = langRes.rows[0] as LanguageType;

    const booksRes = await query(
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
      [languageId],
    );

    const books: BookDisplayType[] = booksRes.rows.map((row) => ({
      ...row,
      price: formatCurrency(row.price),
      stock: formatNumToCompactNotation(row.stock),
    }));

    res.render('books', {
      title: language.name,
      books,
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get edit form
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

    res.render('genre-language-form', {
      formFor: 'language',
      title: 'Edit Language',
      errors: null,
      data: language,
    });
  } catch (error) {
    next(error);
  }
};

// 4. Update a language
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
        formFor: 'language',
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
      [capitalize(name), languageId],
    );

    if (rowCount === 0) {
      throw new CustomNotFoundError('Language Not Found');
    }

    res.status(200).redirect(`/languages`);
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
      title: null,
      data: language,
      cancelPath: req.query.from || '/',
      returnPath: req.query.returnTo || '/',
    });
  } catch (error) {
    next(error);
  }
};

// 6. Delete a language
export const deleteLanguageById: RequestHandler = async (req, res, next) => {
  const languageId = Number(req.params['languageId']);

  try {
    // 1. Check if language is linked to any books
    const bookRes = await query(
      'SELECT 1 FROM book_languages WHERE language_id = $1 LIMIT 1',
      [languageId],
    );
    if (bookRes.rowCount && bookRes.rowCount > 0) {
      throw new CustomBadRequestError(
        "Can't delete language: still associated with one or more books",
      );
    }

    // 2. Proceed with deletion
    const languageRes = await query('DELETE FROM languages WHERE id = $1', [
      languageId,
    ]);
    if (languageRes.rowCount === 0) {
      throw new CustomNotFoundError('Language Not Found');
    }

    res.status(200).redirect('/languages');
  } catch (error) {
    next(error);
  }
};
