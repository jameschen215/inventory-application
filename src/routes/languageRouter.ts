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

export const router = Router();

// 1. Get all languages
router.get('/', getLanguages);

// 2. Get books by language
router.get('/:languageId/books', getBooksByLanguage);

// 3. Get language form
router.get('/:languageId/edit', getEditForm);

// 3. Update a language
router.put('/:languageId/edit', languageSchema, editLanguageById);

// 4. Get confirm deletion
router.get('/:languageId/confirm-deletion', getConfirmDeletion);

// 5. Delete a language
router.delete('/:languageId', deleteLanguageById);
