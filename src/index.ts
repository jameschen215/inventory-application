import 'dotenv/config';
import express from 'express';
import url from 'url';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { CustomNotFoundError } from './errors/CustomNotFoundError.js';
import { globalErrorHandler } from './errors/globalErrorHandler.js';
import { router as indexRouter } from './routes/indexRouter.js';
import { router as genreRouter } from './routes/genreRouter.js';
import { router as authorRouter } from './routes/authorRouter.js';
import { router as languageRouter } from './routes/languageRouter.js';

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
app.use('/', indexRouter);
app.use('/genres', genreRouter);
app.use('/authors', authorRouter);
app.use('/languages', languageRouter);

// Error handlers
app.use((req, res) => {
	throw new CustomNotFoundError('Page not found');
});

app.use(globalErrorHandler);

// Start server
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
