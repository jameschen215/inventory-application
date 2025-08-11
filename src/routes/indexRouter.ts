import { Router } from 'express';

import { requireAdmin } from '../middlewares/requireAdmin.js';
import { normalizeBookInput } from '../middlewares/normalizeBookInput.js';
import { bookCreateSchema, bookEditSchema } from '../validators/bookSchema.js';
import {
	createNewBook,
	editBookPartially,
	getBookById,
	getBooks,
	deleteBookById,
	getCreateForm,
	getEditForm,
	confirmDeletion,
} from '../controllers/indexController.js';

export const router = Router();

// 1. Get all books
router.get('/', getBooks);

// 2. Get create form
router.get('/books/create', getCreateForm);

// 3. Get a book by id
router.get('/books/:bookId', getBookById);

// 4. Post a book
router.post(
	'/books/create',
	normalizeBookInput,
	bookCreateSchema,
	createNewBook
);

// 5. Get book edit form
router.get('/books/:bookId/edit', requireAdmin, getEditForm);

// 6. Update a book
router.put(
	'/books/:bookId/edit',
	requireAdmin,
	normalizeBookInput,
	bookEditSchema,
	editBookPartially
);

// 7. Get deleting confirmation page
router.get('/books/:bookId/confirm-deletion', requireAdmin, confirmDeletion);

// 8. Delete a book
router.delete('/books/:bookId', requireAdmin, deleteBookById);
