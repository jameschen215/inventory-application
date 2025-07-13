export type BookDisplayType = {
	title: string;
	subtitle: string | null;
	description: string | null;
	stock: number;
	price: number;
	published_at: string | null;
	cover_url: string | null;
	author: string[];
	genre: string[];
	language: string[];
};
