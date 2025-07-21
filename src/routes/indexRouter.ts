import { Router } from 'express';
import {
	createNewBook,
	editBookPartially,
	getBookById,
	getBooks,
	deleteBookById,
	getCreateForm,
	getEditForm,
	confirmDelete,
} from '../controllers/indexController.js';
import { bookCreateSchema, bookEditSchema } from '../validators/bookSchema.js';
import { normalizeBookInput } from '../middlewares/normalizeBookInput.js';

export const router = Router();

// 1. Get all books
router.get('/', getBooks);

// 2. Get create form
router.get('/books/create', getCreateForm);

// 3. Post a book
router.post(
	'/books/create',
	normalizeBookInput,
	bookCreateSchema,
	createNewBook
);

router.get('/books/:bookId/confirm-deletion', confirmDelete);

// 4. Get a book by id
router.get('/books/:bookId', getBookById);

// 5. Get a book edit form
router.get('/books/:bookId/edit', getEditForm);

// 6. Update a book
router.put(
	'/books/:bookId/edit',
	normalizeBookInput,
	bookEditSchema,
	editBookPartially
);

// 7. Delete a book
router.delete('/books/:bookId', deleteBookById);
