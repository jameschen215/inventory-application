import { Pool, ClientConfig } from 'pg';

export const dbConfig: ClientConfig =
	process.env.NODE_ENV === 'production'
		? {
				connectionString: process.env.DATABASE_URL,
				ssl: { rejectUnauthorized: false },
		  }
		: {
				database: process.env.DB_NAME ?? 'top_users',
				host: process.env.DB_HOST ?? 'localhost',
				user: process.env.DB_USER ?? 'chenjian',
				password: process.env.DB_PASSWORD ?? '',
				port: Number(process.env.DB_PORT ?? 5432),
		  };

const pool = new Pool(dbConfig);

export const query = (text: string, params?: unknown[]) =>
	pool.query(text, params);
