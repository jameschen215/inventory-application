import NodeCache from 'node-cache';

import {
  AuthorType,
  BookType,
  GenreType,
  LanguageType,
} from '../types/db-types.js';

export const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes DEFAULT TTL

// Invalidate all caches affected by a book
export function invalidateBookCache(
  bookId: number,
  authorIds: number[] = [],
  genreIds: number[] = [],
  languageIds: number[] = [],
) {
  cache.del(`book_${bookId}`);
  cache.del('all_books');
  authorIds.forEach((authorId) => cache.del(`author_${authorId}_books`));
  genreIds.forEach((genreId) => cache.del(`genre_${genreId}_books`));
  languageIds.forEach((langId) => cache.del(`language_${langId}_books`));

  // authors, genres, and languages may be created along with book,
  // so invalidate all authors as well
  cache.del('all_authors');
  cache.del('all_genres');
  cache.del('all_languages');
}

export function invalidateAuthorCache(authorId: number) {
  cache.del('all_authors');
  cache.del(`author_${authorId}_books`);
}

export function invalidateGenreCache(genre: GenreType) {
  cache.del('all_genres');
  cache.del(`genres_${genre.id}`);
  cache.del(`genres_${genre.id}_books`);
}

export function invalidateLanguageCache(language: LanguageType) {
  cache.del('all_languages');
  cache.del(`languages${language.id}`);
  cache.del(`languages${language.id}_books`);
}
