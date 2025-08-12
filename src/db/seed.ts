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
        'Male',
        'Israel',
        'Israeli historian and professor at Hebrew University. Known for exploring big-picture questions about history and humanity.',
        '1976-02-24',
      ],
      [
        'E. B. White',
        'Male',
        'US',
        'American writer known for children’s books and essays. Also co-authored The Elements of Style.',
        '1899-07-11',
      ],
      [
        'Daron Acemoglu',
        'Male',
        'US',
        'Turkish-American economist and MIT professor, known for research in political economy and development.',
        '1967-09-03',
      ],
      [
        'James A. Robinson',
        'Male',
        'UK',
        'British political scientist and economist, co-author of multiple works on institutions and development.',
        null,
      ],
      [
        'Peter Hessler',
        'Male',
        'US',
        'American journalist and author known for writing about China.',
        '1969-06-14',
      ],
    ];

    for (const [name, gender, nationality, bio, dob] of authors) {
      await client.query(
        `INSERT INTO authors (name, gender, nationality, bio, dob) VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING`,
        [name, gender, nationality?.toUpperCase(), bio, dob],
      );
    }

    // 2. Insert books
    const books = [
      [
        'Sapiens',
        'A Brief History of Humankind',
        'Sapiens: A Brief History of Humankind is a 2011 book by Yuval Noah Harari, based on a series of lectures he taught at The Hebrew University of Jerusalem. It was first published in Hebrew in Israel in 2011, and in English in 2014. The book focuses on Homo sapiens, and surveys the history of humankind, starting from the Stone Age and going up to the 21st century. The account is situated within a framework that intersects the natural sciences with the social sciences.',
        10,
        19.99,
        '2014-09-04',
        '/images/01.jpg',
      ],
      [
        "Charlotte's Web",
        null,
        'Charlotte\'s Web is a book of children\'s literature by American author E. B. White and illustrated by Garth Williams. It was published on October 15, 1952, by Harper & Brothers. It tells the story of a livestock pig named Wilbur and his friendship with a barn spider named Charlotte. When Wilbur is in danger of being slaughtered, Charlotte writes messages in her web praising him, such as "Some Pig", "Terrific", "Radiant", and "Humble", to persuade the farmer to spare his life.',
        5,
        9.99,
        '1952-10-15',
        '/images/02.jpg',
      ],
      [
        'Why Nations Fail',
        'The Origins of Power, Prosperity, and Poverty',
        'Why Nations Fail: The Origins of Power, Prosperity, and Poverty, first published in 2012, is a book by economists Daron Acemoglu and James A. Robinson, who jointly received the 2024 Nobel Economics Prize (alongside Simon Johnson) for their contribution in comparative studies of prosperity between nations. The book applies insights from institutional economics, development economics, and economic history to understand why nations develop differently, with some succeeding in the accumulation of power and prosperity and others failing, according to a wide range of historical case studies.',
        8,
        25.0,
        '2012-03-13',
        '/images/03.jpg',
      ],
      [
        'Oracle Bones',
        'A Journey Between China’s Past and Present',
        "Oracle Bones: A Journey Between China's Past and Present is a 2006 work of travel journalism by Peter Hessler, the Beijing correspondent for The New Yorker magazine. The book attempts to provide an overview of contemporary China by recounting Hessler’s experiences in the country and those of some of the people he has met there. Woven into this narrative are 13 chapters about the “oracle bones” used by Shang dynasty diviners in the second millennium B.C. These chapters allow Hessler to explore Chinese history and some of the contentious contemporary debates about that history. ",
        7,
        18.0,
        '2006-08-15',
        '/images/04.jpg',
      ],
    ];

    for (const [title, subtitle, description, stock, price, published_at, cover_url] of books) {
      await client.query(
        `INSERT INTO books (title, subtitle, description, stock, price, published_at, cover_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING`,
        [title, subtitle, description, stock, price, published_at, cover_url],
      );
    }

    // 3. Insert genres
    const genres = ['History', 'Fantasy', 'Politics', 'Memoir', 'Children', 'Economics'];

    for (const genre of genres) {
      await client.query(`INSERT INTO genres (name) VALUES ($1) ON CONFLICT DO NOTHING`, [genre]);
    }

    // 4. Insert languages
    const languages = ['English', 'Chinese'];

    for (const lang of languages) {
      await client.query(`INSERT INTO languages (name) VALUES ($1) ON CONFLICT DO NOTHING`, [lang]);
    }

    // 5. Insert into book_authors join table
    const authorResult = await client.query(`SELECT id, name FROM authors WHERE name = ANY($1)`, [
      authors.map((author) => author[0]),
    ]);
    const authorMap = new Map(authorResult.rows.map((row) => [row.name, row.id]));

    const bookResult = await client.query(`SELECT id, title FROM books WHERE title = ANY($1)`, [
      books.map((book) => book[0]),
    ]);
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
        [bookMap.get(bookTitle), authorMap.get(authorName)],
      );
    }

    // 6. Insert into book_languages join table
    const languageResult = await client.query('SELECT id, name FROM languages');
    const langMap = new Map(languageResult.rows.map((row) => [row.name, row.id]));

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
          [bookMap.get(bookTitle), langMap.get(lang)],
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
          [bookMap.get(bookTitle), genreMap.get(genreName)],
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
