export class CustomInternalError extends Error {
	public statusCode: number;

	constructor(message: string) {
		super(message);

		this.name = 'InternalError';
		this.statusCode = 500;
	}
}
