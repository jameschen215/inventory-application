import { Router } from 'express';
import { searchInventory } from '../controllers/searchController.js';

export const router = Router();

router.get('/', searchInventory);
