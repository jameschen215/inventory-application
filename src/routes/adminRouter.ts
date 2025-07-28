import { Router } from 'express';
import {
	getAdminPasswordForm,
	saveAdminPassword,
} from '../controllers/adminController.js';

export const router = Router();

router.get('/', getAdminPasswordForm);

router.post('/', saveAdminPassword);
