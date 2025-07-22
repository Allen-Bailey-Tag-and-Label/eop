import { MONGODB_URL } from '$env/static/private';
import mongoose from 'mongoose';

let connections: Map<string, typeof mongoose> = new Map();

export const connect = async () => {
	if (!connections.has(MONGODB_URL)) {
		const connection = await mongoose.connect(MONGODB_URL, { dbName: 'v4' });
		connections.set(MONGODB_URL, connection);
		return connection;
	}

	const connection = connections.get(MONGODB_URL);

	if (!connection) {
		console.error(`MongoDB connection error`);
		throw `MongoDB connection error`;
	}

	return connection;
};
