import { Router } from 'express';
import {
	getBooksByLanguage,
	getLanguages,
	editLanguageById,
	deleteLanguageById,
} from '../controllers/languageController.js';
import { languageSchema } from '../validators/languageSchema.js';

export const router = Router();

// 1. Get all languages
router.get('/', getLanguages);

// 2. Get books by language
router.get('/:languageId', getBooksByLanguage);

// 3. Update a language
router.put('/:languageId', languageSchema, editLanguageById);

// 4. Delete a language
router.delete('/:languageId', deleteLanguageById);
