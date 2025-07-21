import { Router } from 'express';
import {
	getAuthors,
	getBooksByAuthorId,
	editAuthorById,
	deleteAuthorById,
	getAuthorById,
	getEditForm,
} from '../controllers/authorController.js';
import { authorSchema } from '../validators/authorSchema.js';

export const router = Router();

// 1. Get all authors
router.get('/', getAuthors);

// 2. Get author by id
router.get('/:authorId', getAuthorById);

// 3. Get author's books
router.get('/:authorId/books', getBooksByAuthorId);

// 4. Get author edit form
router.get('/:authorId/edit', getEditForm);

// 4. Update a author
router.put('/:authorId/edit', authorSchema, editAuthorById);

// 5. Delete a author
router.delete('/:authorId', deleteAuthorById);
