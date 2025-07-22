import { MongoClient } from 'mongodb';
import { MONGODB_URL } from '$env/static/private';

type Parameters = {
	url?: string;
	options?: Record<string, string>;
};

let clients: Map<string, MongoClient> = new Map();

export const clientInit = async (parameters?: Parameters) => {
	if (!clients.has(MONGODB_URL)) {
		const client = new MongoClient(MONGODB_URL);
		await client.connect();
		clients.set(MONGODB_URL, client);
	}

	let client = clients.get(MONGODB_URL) || new MongoClient(MONGODB_URL);

	return client;
};
