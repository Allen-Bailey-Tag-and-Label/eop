import mongoose from 'mongoose';
import { MONGODB_DB, MONGODB_URL } from '$env/static/private';

// Module-scoped cache (no globalThis)
let connPromise: Promise<typeof mongoose> | null = null;

function opts() {
	const dev = import.meta.env.DEV;
	return {
		dbName: MONGODB_DB,
		// Keep pools small so Atlas “connections” stays sane.
		// Note: the driver may open sockets to multiple replica set members,
		// so effective sockets ≈ maxPoolSize × replicaMembers.
		maxPoolSize: dev ? 5 : 10,
		minPoolSize: 0,
		maxIdleTimeMS: 30_000, // trim idle sockets quickly
		serverSelectionTimeoutMS: 5_000,
		appName: 'sveltekit-app'
	} as const;
}

export async function connect() {
	// Fast path: already connected or connecting
	const state = mongoose.connection.readyState; // 1=connected, 2=connecting
	if (state === 1) return mongoose;
	if (connPromise) return connPromise;

	// Fail fast if not connected yet instead of buffering commands
	mongoose.set('bufferCommands', false);

	connPromise = mongoose.connect(MONGODB_URL, opts());
	// If first connect() fails, clear the cache so the next call can retry
	connPromise.catch(() => {
		connPromise = null;
	});

	return connPromise;
}
