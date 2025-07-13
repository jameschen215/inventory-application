import { Router } from 'express';
import {
	getBooksByGenreId,
	getGenres,
} from '../controllers/genreController.js';

export const router = Router();

router.get('/', getGenres);
router.get('/:genre', getBooksByGenreId);

// TODO: create a genre

// TODO: edit a genre

// TODO: delete a genre
