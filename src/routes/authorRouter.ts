import { Router } from 'express';
import {
	getAuthors,
	getBooksByAuthorId,
	editAuthorById,
	deleteAuthorById,
	getAuthorById,
	getEditForm,
	confirmDeletion,
} from '../controllers/authorController.js';
import { authorSchema } from '../validators/authorSchema.js';
import { requireAdmin } from '../middlewares/requireAdmin.js';

export const router = Router();

// 1. Get all authors
router.get('/', getAuthors);

// 2. Get author by id
router.get('/:authorId', getAuthorById);

// 3. Get author's books
router.get('/:authorId/books', getBooksByAuthorId);

// 4. Get author edit form
router.get('/:authorId/edit', requireAdmin, getEditForm);

// 6. Confirm deletion
router.get('/:authorId/confirm-deletion', requireAdmin, confirmDeletion);

// 4. Update a author
router.put('/:authorId/edit', requireAdmin, authorSchema, editAuthorById);

// 5. Delete a author
router.delete('/:authorId', requireAdmin, deleteAuthorById);
