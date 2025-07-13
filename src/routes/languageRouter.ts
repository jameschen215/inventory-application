import { Router } from 'express';
import {
	getBooksByLanguage,
	getLanguages,
} from '../controllers/languageController.js';

export const router = Router();

router.get('/', getLanguages);
router.get('/:languageId', getBooksByLanguage);

// TODO: create a language

// TODO: edit a language

// TODO: delete a language
