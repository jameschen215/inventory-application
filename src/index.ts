import 'dotenv/config';
import express from 'express';
import url from 'url';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { middleware } from './middlewares/middleware.js';
import { CustomNotFoundError } from './errors/CustomNotFoundError.js';
import { globalErrorHandler } from './errors/globalErrorHandler.js';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 9000;

const app = express();

// Middlewares
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', middleware);

// Error handlers
app.use((req, res) => {
	throw new CustomNotFoundError('Page not found');
});

app.use(globalErrorHandler);

// Start server
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
