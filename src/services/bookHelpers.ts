import { query } from '../db/pool.js';

/**
 * Ensures all items in the array exist in the specified table.
 * If not, inserts them. Returns a list of their IDs.
 */
export async function processEntity(
  table: 'authors' | 'genres' | 'languages',
  values: string[],
  options: { transactionClient?: any } = {},
) {
  const client = options.transactionClient ?? { query };
  const normalizedValues = values.map((v) => v.toLowerCase());

  const { rows } = await client.query(
    `SELECT id, LOWER(name) AS name FROM ${table} WHERE LOWER(name) = ANY($1::text[])`,
    [normalizedValues],
  );
  const existingMap = new Map(rows.map((r: any) => [r.name, r.id]));
  const toInsert = values.filter((v) => !existingMap.has(v.toLowerCase()));

  for (const name of toInsert) {
    const insertRes = await client.query(
      `INSERT INTO ${table} (name) VALUES ($1) RETURNING id`,
      [name],
    );
    existingMap.set(name.toLowerCase(), insertRes.rows[0].id);
  }
  return values.map((name) => existingMap.get(name.toLowerCase()));
}

/**
 * Updates join table entries by deleting old ones and inserting new ones.
 */
export async function insertJoins(
  table: 'book_authors' | 'book_genres' | 'book_languages',
  column: 'author_id' | 'genre_id' | 'language_id',
  bookId: number,
  ids: number[],
  options: { transactionClient?: any } = {},
) {
  const client = options.transactionClient ?? { query };

  // Delete all the relationships of the book first
  await client.query(`DELETE FROM ${table} WHERE book_id = $1`, [bookId]);

  // Insert new relationships
  for (const id of ids) {
    await client.query(
      `INSERT INTO ${table} (book_id, ${column}) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [bookId, id],
    );
  }
}
