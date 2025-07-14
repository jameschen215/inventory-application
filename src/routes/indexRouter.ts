import { Router } from 'express';
import {
	createNewBook,
	editABook,
	editABookPartially,
	getBookById,
	getBooks,
	deleteBookById,
} from '../controllers/indexController.js';
import { bookCreateSchema, bookEditSchema } from '../validators/bookSchema.js';
import { normalizeBookInput } from '../middlewares/normalizeBookInput.js';

export const router = Router();

// 1. Get all books
router.get('/', getBooks);

// 2. Get a book by id
router.get('/books/:bookId', getBookById);

// 3. Post a book
router.post('/books', normalizeBookInput, bookCreateSchema, createNewBook);

// 4. Update a book
router.put(
	'/books/:bookId',
	normalizeBookInput,
	bookEditSchema,
	editABookPartially
);

// 5. Delete a book
router.delete('/books/:bookId', deleteBookById);
