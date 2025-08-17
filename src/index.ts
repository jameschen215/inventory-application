import 'dotenv/config';
import express from 'express';
import url from 'url';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import expressLayouts from 'express-ejs-layouts';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';

import { CustomNotFoundError } from './errors/CustomNotFoundError.js';
import { globalErrorHandler } from './errors/globalErrorHandler.js';
import { router as indexRouter } from './routes/indexRouter.js';
import { router as genreRouter } from './routes/genreRouter.js';
import { router as authorRouter } from './routes/authorRouter.js';
import { router as languageRouter } from './routes/languageRouter.js';
import { router as adminRouter } from './routes/adminRouter.js';
import { router as searchRouter } from './routes/searchRouter.js';

import { runSetup } from './db/setup.js';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 9000;

const app = express();

// config ejs
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout'); // will use views/layout.ejs

// Middlewares
app.use(cors());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: [
        "'self'",
        'data',
        'https://covers.openlibrary.org',
        'https://archive.org',
        'https://*.archive.org', // for redirects
      ],
    },
  }),
);
app.use(morgan('dev'));
app.use(methodOverride('_method')); // allows ?_method=DELETE
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
  res.locals.currentPath = req.originalUrl; // includes pathname + query
  next();
});

// Get the login state
app.use((req, res, next) => {
  // res.locals.isLoggedIn = !!(req.cookies.admin); // convert to boolean
  res.locals.isLoggedIn = Boolean(req.cookies.admin);
  next();
});

// Routes
app.use('/', indexRouter);
app.use('/authors', authorRouter);
app.use('/genres', genreRouter);
app.use('/languages', languageRouter);
app.use('/admin', adminRouter);
app.use('/search', searchRouter);

// Error handlers
app.use((req, res) => {
  throw new CustomNotFoundError('Page Not Found');
});

app.use(globalErrorHandler);

// Start server with database setup
async function startServer() {
  try {
    // Ensure database is set up before starting the server
    await runSetup();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Fail to start server: ', error);
    process.exit(1);
  }
}

startServer();
