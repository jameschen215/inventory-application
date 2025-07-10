import { Client } from 'pg';
import { dbConfig } from './pool.js';

async function initializeDatabase() {
	const client = new Client(dbConfig);

	try {
		console.log('Connecting to database...');
		await client.connect();
		console.log('Connected successfully.');

		console.log('Creating tables...');
		await client.query(`
			CREATE TABLE IF NOT EXISTS authors (
				id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
				name VARCHAR(255) NOT NULL,
				bio TEXT,
				dob DATE
			);
			
			CREATE TABLE IF NOT EXISTS books (
				id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
				title VARCHAR (255) NOT NULL,
				subtitle VARCHAR (255),
				description TEXT,
				stock INTEGER NOT NULL,
				price NUMERIC(10, 2) NOT NULL,
				published_at DATE,
				cover_url TEXT
			);

			CREATE TABLE IF NOT EXISTS languages (
				id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
				name VARCHAR(25) NOT NULL
			);

			CREATE TABLE IF NOT EXISTS genres (
				id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
				name VARCHAR(255) NOT NULL
			);

			CREATE TABLE IF NOT EXISTS book_authors (
				id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
				book_id INTEGER REFERENCES books (id),
				author_id INTEGER REFERENCES authors (id)
			);

			CREATE TABLE IF NOT EXISTS book_languages (
				id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
				book_id INTEGER REFERENCES books (id),
				language_id INTEGER REFERENCES languages (id),
				UNIQUE (book_id, language_id)
			);

			CREATE TABLE IF NOT EXISTS book_genres (
				id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
				book_id INTEGER REFERENCES books (id),
				genre_id INTEGER REFERENCES genres (id),
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
	}
}

initializeDatabase();
