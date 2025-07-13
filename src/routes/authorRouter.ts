import { Router } from 'express';
import {
	getAuthors,
	getBooksByAuthor,
} from '../controllers/authorController.js';

export const router = Router();

router.get('/', getAuthors);
router.get('/:authorId', getBooksByAuthor);

// TODO: create a author

// TODO: edit a author

// TODO: delete a author
