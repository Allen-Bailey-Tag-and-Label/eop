import mongoose from 'mongoose';
import { MONGODB_DB, MONGODB_URL } from '$env/static/private';

type Options = {
	appName?: string;
	dbName?: string;
	maxPoolSize?: number;
	minPoolSize?: number;
	maxIdleTimeMS?: number;
	serverSelectionTimeoutMS?: number;
};

let connPromise: Promise<typeof mongoose> | null = null;

const options = ({
	appName,
	dbName,
	maxPoolSize,
	minPoolSize,
	maxIdleTimeMS,
	serverSelectionTimeoutMS
}: Options = {}) => {
	const dev = import.meta.env.DEV;
	return {
		appName: appName ?? 'sveltekit-app',
		dbName: dbName ?? MONGODB_DB,
		maxPoolSize: maxPoolSize ?? (dev ? 5 : 10),
		minPoolSize: minPoolSize ?? 0,
		maxIdleTimeMS: maxIdleTimeMS ?? 30_000,
		serverSelectionTimeoutMS: serverSelectionTimeoutMS ?? 5_000
	} as const;
};

export const connect = async () => {
	// Fast path: already connected or connecting
	const state = mongoose.connection.readyState; // 1=connected, 2=connecting
	if (state === 1) return mongoose;
	if (connPromise) return connPromise;

	// Fail fast if not connected yet instead of buffering commands
	mongoose.set('bufferCommands', false);

	connPromise = mongoose.connect(MONGODB_URL, options());
	// If first connect() fails, clear the cache so the next call can retry
	connPromise.catch(() => {
		connPromise = null;
	});

	return connPromise;
};
