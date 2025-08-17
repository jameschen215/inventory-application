import { Router } from 'express';

import { authorSchema } from '../validators/authorSchema.js';
import { requireAdmin } from '../middlewares/requireAdmin.js';
import {
  getAuthors,
  getBooksByAuthorId,
  editAuthorById,
  deleteAuthorById,
  getAuthorById,
  getEditForm,
  confirmDeletion,
} from '../controllers/authorController.js';

export const router = Router();

// 1. Get all authors
router.get('/', getAuthors);

// 2. Get author by id
router.get('/:authorId', getAuthorById);

// 3. Get author's books
router.get('/:authorId/books', getBooksByAuthorId);

// 4. Get author edit form
router.get('/:authorId/edit', requireAdmin, getEditForm);

// 5. Confirm deletion
router.get('/:authorId/confirm-deletion', requireAdmin, confirmDeletion);

// 6. Update a author
router.put('/:authorId/edit', requireAdmin, authorSchema, editAuthorById);

// 7. Delete a author
router.delete('/:authorId', requireAdmin, deleteAuthorById);
