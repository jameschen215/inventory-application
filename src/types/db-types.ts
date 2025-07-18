export type BookType = {
	id: number;
	title: string;
	subtitle: string | null;
	description: string | null;
	stock: number;
	price: number;
	published_at: string | null;
	cover_url: string | null;
};

export type AuthorType = {
	id: number;
	name: string;
	gender: string | null;
	nationality: string | null;
	bio: string | null;
	dob: Date | null;
};

export type LanguageType = {
	id: number;
	name: string;
};

export type GenreType = {
	id: number;
	name: string;
};
