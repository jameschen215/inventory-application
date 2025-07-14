import { Router } from 'express';
import {
	editGenreById,
	getBooksByGenreId,
	getGenres,
	deleteGenreById,
} from '../controllers/genreController.js';
import { genreSchema } from '../validators/genreSchema.js';

export const router = Router();

// 1. Get all genres
router.get('/', getGenres);

// 2. Get genre by id
router.get('/:genreId', getBooksByGenreId);

// 3. Put a genre
router.put('/:genreId', genreSchema, editGenreById);

// 4. Delete a genre
router.delete('/:genreId', deleteGenreById);
