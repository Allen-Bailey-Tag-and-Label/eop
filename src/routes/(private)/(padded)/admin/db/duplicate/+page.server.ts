import type { Actions } from '@sveltejs/kit';
import mongoose from 'mongoose';
import { connect } from '$lib/server/mongoose';
import type { Db, Document } from 'mongodb';

const maxBatchSize = 1_000;

export const actions: Actions = {
	default: async ({ request }) => {
		const { sourceDB, targetDB } = <Record<string, string>>(
			Object.fromEntries(await request.formData())
		);

		await connect();

		const sourceConnection = mongoose.connection.useDb(sourceDB, { useCache: true });
		const targetConnection = mongoose.connection.useDb(targetDB, { useCache: true });

		const source: Db = sourceConnection.getClient().db(sourceDB);
		const target: Db = targetConnection.getClient().db(targetDB);

		if (!source || !target) return {};

		const collections = (await source.listCollections().toArray()).sort((a, b) =>
			a.name.localeCompare(b.name)
		);

		for (const { name: collectionName } of collections) {
			if (collectionName.startsWith('system.')) continue;

			const sourceCollection = source.collection(collectionName);
			const targetCollection = target.collection(collectionName);

			try {
				await targetCollection.drop();
			} catch {}

			await target.createCollection(collectionName);

			const sourceIndexes = await sourceCollection.indexes();
			for (const { key, name: indexName, ns, v, ...options } of sourceIndexes) {
				if (indexName === '_id_') continue;
				await targetCollection.createIndex(key, { name: indexName, ...options });
			}

			const sourceCursor = sourceCollection.find({}, { noCursorTimeout: true });
			let batch: Document[] = [];

			for await (const doc of sourceCursor) {
				batch.push(doc);

				if (batch.length >= maxBatchSize) {
					await targetCollection.insertMany(batch, { ordered: false });
					batch = [];
				}
			}

			if (batch.length) await targetCollection.insertMany(batch, { ordered: false });
		}

		return {};
	}
};
