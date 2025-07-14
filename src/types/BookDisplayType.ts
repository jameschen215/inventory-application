export type BookDisplayType = {
	id: number;
	title: string;
	subtitle: string | null;
	description: string | null;
	stock: number;
	price: number;
	published_at: string | null;
	cover_url: string | null;
	authors: string[];
	genres: string[];
	languages: string[];
};
