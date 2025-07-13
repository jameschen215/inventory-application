import { Router } from 'express';
import { createNewBook, getBooks } from '../controllers/indexController.js';
import { bookSchema } from '../validators/bookSchema.js';
import { normalizeBookInput } from '../middlewares/normalizeBookInput.js';

export const router = Router();

router.get('/', getBooks);

// TODO: post a book
router.post('/books', normalizeBookInput, bookSchema, createNewBook);

// TODO: update a book

// TODO: delete a book
