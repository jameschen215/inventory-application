import { Client } from 'pg';
import { dbConfig } from './pool.js';

export async function seed() {
	console.log('Seeding...');

	const client = new Client(dbConfig);
	await client.connect();

	try {
		await client.query('BEGIN');

		// 1. Insert authors
		const authors = [
			[
				'Yuval Noah Harari',
				'Israeli historian and professor at Hebrew University. Known for exploring big-picture questions about history and humanity.',
				'1976-02-24',
			],
			[
				'E. B. White',
				'American writer known for children’s books and essays. Also co-authored The Elements of Style.',
				'1899-07-11',
			],
			[
				'Daron Acemoglu',
				'Turkish-American economist and MIT professor, known for research in political economy and development.',
				'1967-09-03',
			],
			[
				'James A. Robinson',
				'British political scientist and economist, co-author of multiple works on institutions and development.',
				null,
			],
			[
				'Peter Hessler',
				'American journalist and author known for writing about China.',
				'1969-06-14',
			],
		];

		for (const [name, bio, dob] of authors) {
			await client.query(
				`INSERT INTO authors (name, bio, dob) VALUES ($1, $2, $3)
        ON CONFLICT DO NOTHING`,
				[name, bio, dob]
			);
		}

		// 2. Insert books
		const books = [
			[
				'Sapiens',
				'A Brief History of Humankind',
				null,
				10,
				19.99,
				'2014-09-04',
				null,
			],
			["Charlotte's Web", null, null, 5, 9.99, '1952-10-15', null],
			[
				'Why Nations Fail',
				'The Origins of Power, Prosperity, and Poverty',
				null,
				8,
				25.0,
				'2012-03-13',
				null,
			],
			[
				'Oracle Bones',
				'A Journey Between China’s Past and Present',
				null,
				7,
				18.0,
				'2006-08-15',
				null,
			],
		];

		for (const [
			title,
			subtitle,
			description,
			stock,
			price,
			published_at,
			cover_url,
		] of books) {
			await client.query(
				`INSERT INTO books (title, subtitle, description, stock, price, published_at, cover_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING`,
				[title, subtitle, description, stock, price, published_at, cover_url]
			);
		}

		// 3. Insert genres
		const genres = [
			'History',
			'Fantasy',
			'Politics',
			'Memoir',
			'Children',
			'Economics',
		];

		for (const genre of genres) {
			await client.query(
				`INSERT INTO genres (name) VALUES ($1) ON CONFLICT DO NOTHING`,
				[genre]
			);
		}

		// 4. Insert languages
		const languages = ['English', 'Chinese'];

		for (const lang of languages) {
			await client.query(
				`INSERT INTO languages (name) VALUES ($1) ON CONFLICT DO NOTHING`,
				[lang]
			);
		}

		// 5. Insert into book_authors join table
		const authorResult = await client.query(
			`SELECT id, name FROM authors WHERE name = ANY($1)`,
			[authors.map((author) => author[0])]
		);
		const authorMap = new Map(
			authorResult.rows.map((row) => [row.name, row.id])
		);

		const bookResult = await client.query(
			`SELECT id, title FROM books WHERE title = ANY($1)`,
			[books.map((book) => book[0])]
		);
		const bookMap = new Map(bookResult.rows.map((row) => [row.title, row.id]));

		const bookAuthors = [
			['Sapiens', 'Yuval Noah Harari'],
			["Charlotte's Web", 'E. B. White'],
			['Why Nations Fail', 'Daron Acemoglu'],
			['Why Nations Fail', 'James A. Robinson'],
			['Oracle Bones', 'Peter Hessler'],
		];

		for (const [bookTitle, authorName] of bookAuthors) {
			await client.query(
				`INSERT INTO book_authors (book_id, author_id)
         VALUES ($1, $2) ON CONFLICT DO NOTHING`,
				[bookMap.get(bookTitle), authorMap.get(authorName)]
			);
		}

		// 6. Insert into book_languages join table
		const languageResult = await client.query('SELECT id, name FROM languages');
		const langMap = new Map(
			languageResult.rows.map((row) => [row.name, row.id])
		);

		const bookLanguages = [
			['Sapiens', ['English']],
			["Charlotte's Web", ['English']],
			['Why Nations Fail', ['English']],
			['Oracle Bones', ['English', 'Chinese']],
		];

		for (const [bookTitle, langs] of bookLanguages) {
			for (const lang of langs) {
				await client.query(
					`INSERT INTO book_languages (book_id, language_id) 
           VALUES ($1, $2) ON CONFLICT DO NOTHING`,
					[bookMap.get(bookTitle), langMap.get(lang)]
				);
			}
		}

		// 7. Insert into book_genres join table
		const genreResult = await client.query('SELECT id, name FROM genres');
		const genreMap = new Map(genreResult.rows.map((row) => [row.name, row.id]));

		const bookGenres = [
			['Sapiens', ['History']],
			["Charlotte's Web", ['Children', 'Fantasy']],
			['Why Nations Fail', ['Politics', 'Economics']],
			['Oracle Bones', ['History', 'Memoir']],
		];

		for (const [bookTitle, genres] of bookGenres) {
			for (const genreName of genres) {
				await client.query(
					`INSERT INTO book_genres (book_id, genre_id) VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
					[bookMap.get(bookTitle), genreMap.get(genreName)]
				);
			}
		}

		await client.query('COMMIT');
		console.log('Seeding completed successfully.');
	} catch (error) {
		await client.query('ROLLBACK');
		console.log('Seeding failed: ', error);
	} finally {
		await client.end();
		console.log('Database connection closed.');
	}
}

await seed();
