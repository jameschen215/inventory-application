import { Router } from 'express';
import { query } from '../db/pool.js';

export const router = Router();

router.get('/', async (req, res, next) => {
  const searchTermRaw = req.query.q;
  const searchTerm =
    typeof searchTermRaw === 'string'
      ? searchTermRaw
      : Array.isArray(searchTermRaw)
        ? searchTermRaw.join(' ')
        : '';

  // If search term is empty, return to where there are
  if (!searchTerm.trim()) {
    const from = typeof req.query.from === 'string' ? req.query.from : '/';
    return res.redirect(from);
  }

  try {
    const { rows } = await query(
      `
      SELECT 'book' AS type, id, title AS name FROM books WHERE title ILIKE $1

      UNION ALL
      SELECT 'author' AS type, id, name FROM authors WHERE name ILIKE $1

      UNION ALL
      SELECT 'genre' AS type, id, name FROM genres WHERE name ILIKE $1

      UNION ALL
      SELECT 'language' AS type, id, name FROM languages WHERE name ILIKE $1

      ORDER BY type, name;
      `,
      [`%${searchTerm}%`],
    );

    const grouped = rows.reduce((acc, cur) => {
      acc[cur.type] ??= []; // if it is null, then make it []
      acc[cur.type].push(cur);

      return acc;
    }, {});

    res.json(grouped);
  } catch (error) {
    next(error);
  }
});
