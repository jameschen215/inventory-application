import { Router } from 'express';

import { genreSchema } from '../validators/genreSchema.js';
import { requireAdmin } from '../middlewares/requireAdmin.js';
import {
	editGenreById,
	getBooksByGenreId,
	getGenres,
	deleteGenreById,
	getConfirmDeletion,
	getEditForm,
} from '../controllers/genreController.js';

export const router = Router();

// 1. Get all genres
router.get('/', getGenres);

// 2. Get genre by id
router.get('/:genreId/books', getBooksByGenreId);

// 3. Get genre form
router.get('/:genreId/edit', requireAdmin, getEditForm);

// 3. Put a genre
router.put('/:genreId/edit', requireAdmin, genreSchema, editGenreById);

// 4. Get confirm deletion
router.get('/:genreId/confirm-deletion', requireAdmin, getConfirmDeletion);

// 5. Delete a genre
router.delete('/:genreId', requireAdmin, deleteGenreById);
