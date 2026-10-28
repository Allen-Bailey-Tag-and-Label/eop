import type { Types } from 'mongoose';

let skipLogging = false;

export const logOperation = async (params: {
	_createdById?: Types.ObjectId;
	data: unknown;
	model: string;
	operation: string;
}) => {
	if (skipLogging) return;
	try {
		// Logging runs after model initialization; avoid importing models while defining schemas.
		const { Log } = await import('./models');
		await Log.create(params);
	} catch (err) {
		console.error('[Log Error]', err);
	}
};

export const setSkipLogging = (value: boolean) => {
	skipLogging = value;
};

export const shouldSkipLogging = () => skipLogging;
