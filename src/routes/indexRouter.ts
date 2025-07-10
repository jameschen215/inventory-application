import { Router } from 'express';
import { getBooks } from '../controllers/indexController.js';

export const router = Router();

router.get('/', getBooks);
