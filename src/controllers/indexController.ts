import { format } from 'date-fns';
import { RequestHandler } from 'express';
import { matchedData, validationResult } from 'express-validator';

import {
  capitalize,
  capitalizeAll,
  formatCurrency,
  formatNumToCompactNotation,
} from '../lib/utils.js';
import { query } from '../db/pool.js';
import { BookType, GenreType } from '../types/db-types.js';
import { BookDisplayType } from '../types/BookDisplayType.js';
import { CustomNotFoundError } from '../errors/CustomNotFoundError.js';
import { CustomInternalError } from '../errors/CustomInternalError.js';
import { insertJoins, processEntity } from '../services/bookHelpers.js';

// 1. Get all books
export const getBooks: RequestHandler = async (req, res, next) => {
  const { q = '' } = req.query || {};

  try {
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
			HAVING books.title ILIKE $1
			ORDER BY books.title;`,
      [`%${q}%`],
    );
    const books: BookDisplayType[] = booksRes.rows.map((row) => ({
      ...row,
      price: formatCurrency(row.price),
      stock: formatNumToCompactNotation(row.stock),
    }));

    res.render('books', {
      title: 'All Books',
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
      [bookId],
    );

    if (bookRes.rowCount === 0) {
      throw new CustomNotFoundError('Book Not Found');
    }
    const book = bookRes.rows[0] as BookDisplayType;

    const formattedBook = {
      ...book,
      stock: formatNumToCompactNotation(book.stock),
      price: formatCurrency(book.price),
      authors: book.authors.join(', '),
      published_at: book.published_at
        ? format(book.published_at, 'MMMM d, yyyy')
        : 'Unknown',
    };

    res.render('book', {
      title: null,
      book: formattedBook,
      returnTo: req.query.from,
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get create form
export const getCreateForm: RequestHandler = async (req, res, next) => {
  try {
    const genresRes = await query(`SELECT * FROM genres`);
    const genres: GenreType[] = genresRes.rows;

    res.render('book-form', {
      isEditMode: false,
      title: 'Create New Book',
      genres,
      errors: null,
      data: null,
      cancelPath: req.query.from || '/',
    });
  } catch (error) {
    next(error);
  }
};

// 4. Post a new book
export const createNewBook: RequestHandler = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const genresRes = await query('SELECT * FROM genres');
    const genres = genresRes.rows;

    return res.status(400).render('book-form', {
      isEditMode: false,
      title: 'Create New Book',
      genres,
      errors: errors.mapped(),
      data: req.body,
    });
  }

  const formData = matchedData(req) as BookDisplayType;
  const formattedFormData = {
    ...formData,
    title: capitalizeAll(formData.title),
    subtitle: formData.subtitle ? capitalize(formData.subtitle) : null,
    description: formData.description ? capitalize(formData.description) : null,
    authors: formData.authors.map((author) => capitalizeAll(author)),
    genres: formData.genres.map((genre) => capitalize(genre)),
    languages: formData.languages.map((lang) => capitalize(lang)),
  };

  try {
    // 1. Process related entities
    const authorIds = (await processEntity(
      'authors',
      formattedFormData.authors,
    )) as number[];

    const genreIds = (await processEntity(
      'genres',
      formattedFormData.genres,
    )) as number[];

    const languageIds = (await processEntity(
      'languages',
      formattedFormData.languages,
    )) as number[];

    // 2. Insert new book if not existing
    const insertBookRes = await query(
      `INSERT INTO books (title, subtitle, description, stock, price, published_at, cover_url)
			 VALUES ($1, $2, $3, $4, $5, $6, $7)
			 ON CONFLICT DO NOTHING
			 RETURNING *`,
      [
        formattedFormData.title,
        formattedFormData.subtitle,
        formattedFormData.description,
        formattedFormData.stock,
        formattedFormData.price,
        formattedFormData.published_at,
        formattedFormData.cover_url,
      ],
    );
    const book: BookType | undefined = insertBookRes.rows[0];

    if (!book) {
      throw new CustomInternalError('Book insertion failed.');
    }

    // 3. Insert relationships
    await insertJoins('book_authors', 'author_id', book.id, authorIds);
    await insertJoins('book_genres', 'genre_id', book.id, genreIds);
    await insertJoins('book_languages', 'language_id', book.id, languageIds);

    res.status(201).redirect('/?submitted=true');
  } catch (error) {
    next(error);
  }
};

// 5. Get edit form
export const getEditForm: RequestHandler = async (req, res, next) => {
  const bookId = Number(req.params['bookId']);

  try {
    const genresRes = await query(`SELECT * FROM genres`);
    const genres: GenreType[] = genresRes.rows;

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
      [bookId],
    );

    if (bookRes.rowCount === 0) {
      throw new CustomNotFoundError('Book Not Found');
    }

    const book = bookRes.rows[0] as BookDisplayType;

    const formattedBook = {
      ...book,
      authors: book.authors.join(', '),
      languages: book.languages.join(', '),
      published_at: book.published_at
        ? new Date(book.published_at).toISOString().slice(0, 10)
        : '',
    };

    res.render('book-form', {
      isEditMode: true,
      title: 'Edit Book',
      genres,
      errors: null,
      data: formattedBook,
      cancelPath: req.query.from || '/',
    });
  } catch (error) {
    next(error);
  }
};

// 6. Update a book partially
export const editBookPartially: RequestHandler = async (req, res, next) => {
  const bookId = Number(req.params['bookId']);
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const genresRes = await query('SELECT * FROM genres');
    const genres = genresRes.rows;

    return res.status(400).render('book-form', {
      isEditMode: true,
      title: 'Books',
      genres,
      errors: errors.mapped(),
      data: req.body,
      cancelPath: req.query.from ?? '/',
    });
  }

  const formData = matchedData(req);

  try {
    // 1. Handle entity fields if they exist
    let authorIds: number[] = [];
    let genreIds: number[] = [];
    let languageIds: number[] = [];

    if (formData.authors) {
      authorIds = (await processEntity(
        'authors',
        formData.authors,
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
        formData.languages,
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
        [...values, bookId],
      );

      if (updateRes.rowCount === 0) {
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

// 7. Get deleting confirmation page
export const confirmDeletion: RequestHandler = async (req, res, next) => {
  const bookId = Number(req.params['bookId']);

  try {
    const bookRes = await query(
      'SELECT id, title as name FROM books WHERE id = $1',
      [bookId],
    );

    if (bookRes.rowCount === 0) {
      throw new CustomNotFoundError('Book Not Found');
    }

    const book: { id: number; title: string } = bookRes.rows[0];

    // Store returnTo in cookie if it exists
    const returnTo =
      (req.query.returnTo as string) || req.cookies.returnTo || '/';

    if (req.query.returnTo) {
      res.cookie('returnTo', req.query.returnTo, {
        maxAge: 10 * 60 * 1000, // 10 minutes
        httpOnly: true,
      });
    }

    res.render('confirm-deletion', {
      title: null,
      data: book,
      cancelPath: req.query.from || returnTo,
      returnPath: returnTo,
    });
  } catch (error) {
    next(error);
  }
};

// 8. Delete a book
export const deleteBookById: RequestHandler = async (req, res, next) => {
  const bookId = Number(req.params['bookId']);

  try {
    const delRes = await query('DELETE FROM books WHERE id = $1', [bookId]);

    if (delRes.rowCount === 0) {
      throw new CustomNotFoundError('Book Not Found');
    }

    const returnTo =
      typeof req.query.returnTo === 'string'
        ? req.query.returnTo
        : typeof req.body.returnTo === 'string'
          ? req.body.returnTo
          : req.cookies.returnTo || '/';

    res.clearCookie('returnTo');

    res.status(200).redirect(returnTo);
  } catch (error) {
    next(error);
  }
};
