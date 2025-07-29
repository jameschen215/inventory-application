import { Router } from 'express';
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
import { bookCreateSchema, bookEditSchema } from '../validators/bookSchema.js';
import { normalizeBookInput } from '../middlewares/normalizeBookInput.js';
import { requireAdmin } from '../middlewares/requireAdmin.js';

export const router = Router();

// 1. Get all books
router.get('/', getBooks);

// 2. Get create form
router.get('/create', getCreateForm);

// 3. Post a book
router.post(
	'/books/create',
	normalizeBookInput,
	bookCreateSchema,
	createNewBook
);

router.get('/books/:bookId/confirm-deletion', requireAdmin, confirmDeletion);

// 4. Get a book by id
router.get('/books/:bookId', getBookById);

// 5. Get a book edit form
router.get('/books/:bookId/edit', requireAdmin, getEditForm);

// 6. Update a book
router.put(
	'/books/:bookId/edit',
	requireAdmin,
	normalizeBookInput,
	bookEditSchema,
	editBookPartially
);

// 7. Delete a book
router.delete('/books/:bookId', requireAdmin, deleteBookById);
