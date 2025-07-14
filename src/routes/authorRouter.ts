import { Router } from 'express';
import {
	getAuthors,
	getBooksByAuthorId,
	editAuthorById,
	deleteAuthorById,
} from '../controllers/authorController.js';
import { authorSchema } from '../validators/authorSchema.js';

export const router = Router();

// 1. Get all authors
router.get('/', getAuthors);

// 2. Get author by id
router.get('/:authorId', getBooksByAuthorId);

// 3. Update a author
router.put('/:authorId', authorSchema, editAuthorById);

// 4. Delete a author
router.delete('/:authorId', deleteAuthorById);
