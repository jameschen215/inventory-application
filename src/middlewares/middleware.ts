import { RequestHandler } from 'express';

export const middleware: RequestHandler = (req, res) => {
	res.send('Hello middleware!');
	console.log('Response sent from middleware.');
};
