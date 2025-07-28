import { Router } from 'express';
import {
	getBooksByLanguage,
	getLanguages,
	editLanguageById,
	deleteLanguageById,
	getConfirmDeletion,
	getEditForm,
} from '../controllers/languageController.js';
import { languageSchema } from '../validators/languageSchema.js';
import { requireAdmin } from '../middlewares/requireAdmin.js';

export const router = Router();

// 1. Get all languages
router.get('/', getLanguages);

// 2. Get books by language
router.get('/:languageId/books', getBooksByLanguage);

// 3. Get language form
router.get('/:languageId/edit', requireAdmin, getEditForm);

// 3. Update a language
router.put('/:languageId/edit', requireAdmin, languageSchema, editLanguageById);

// 4. Get confirm deletion
router.get('/:languageId/confirm-deletion', requireAdmin, getConfirmDeletion);

// 5. Delete a language
router.delete('/:languageId', requireAdmin, deleteLanguageById);
