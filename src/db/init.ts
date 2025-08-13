import { Client } from 'pg';
import { dbConfig } from './pool.js';

async function initializeDatabase() {
  const client = new Client(dbConfig);

  try {
    // Connect to database
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully.');

    // Drop existing tables and types if existing
    console.log('Dropping existing tables...');
    await client.query(`
			DROP TYPE IF EXISTS gender CASCADE;
			DROP TABLE IF EXISTS
				book_genres, 
				book_languages,
				book_authors,
				books,
				authors,
				genres,
				languages
			CASCADE;`);

    // Create new tables
    console.log('Creating tables...');
    await client.query(`
			DO $$
			BEGIN
  			IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender') THEN
    			CREATE TYPE gender AS ENUM ('Male', 'Female');
  			END IF;
			END$$;

			CREATE TABLE IF NOT EXISTS authors (
				id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
				name VARCHAR(100) NOT NULL,
				gender gender,
				nationality VARCHAR(50),
				bio TEXT,
				dob DATE
			);
			
			CREATE TABLE IF NOT EXISTS books (
				id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
				title VARCHAR (255) NOT NULL UNIQUE,
				subtitle VARCHAR (255),
				description TEXT,
				stock INTEGER NOT NULL,
				price NUMERIC(10, 2) NOT NULL,
				published_at DATE,
				cover_url TEXT
			);

			CREATE TABLE IF NOT EXISTS genres (
				id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
				name VARCHAR(25) NOT NULL
			);

			CREATE TABLE IF NOT EXISTS languages (
				id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
				name VARCHAR(25) NOT NULL
			);

			CREATE TABLE IF NOT EXISTS book_authors (
				id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
				book_id INTEGER REFERENCES books (id) ON DELETE CASCADE,
				author_id INTEGER REFERENCES authors (id) ON DELETE CASCADE,
				UNIQUE(book_id, author_id)
			);

			CREATE TABLE IF NOT EXISTS book_languages (
				id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
				book_id INTEGER REFERENCES books (id) ON DELETE CASCADE,
				language_id INTEGER REFERENCES languages (id) ON DELETE CASCADE,
				UNIQUE (book_id, language_id)
			);

			CREATE TABLE IF NOT EXISTS book_genres (
				id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
				book_id INTEGER REFERENCES books (id) ON DELETE CASCADE,
				genre_id INTEGER REFERENCES genres (id) ON DELETE CASCADE,
				UNIQUE (book_id, genre_id)
			);
		`);

    console.log('Tables created successfully');
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string; detail?: string };

    console.error('Database initialization error details', {
      message: err.message,
      code: err.code,
      detail: err.detail,
    });

    throw err;
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

initializeDatabase();
