import { fail, type Actions } from '@sveltejs/kit';
import { clientInit } from '$lib/mongoDB';
import { db } from '$lib/server/db';
import * as schema from '$lib/server/db/schema';

const rowMap: Map<string, (doc: any) => Record<string, any>> = new Map([
	[
		'ups-quotes',
		(doc: {
			classification: string;
			date: Date;
			packageInfo: { Packages: string; Weight: string };
			quote: number;
			rates: { description: string; rate: number }[];
			shipper: {
				AddressLine: string;
				City: string;
				StateProvinceCode: string;
				PostalCode: string;
				CountryCode: string;
			};
			shipTo: {
				AddressLine: string;
				City: string;
				StateProvinceCode: string;
				PostalCode: string;
				CountryCode: string;
			};
		}) => {
			const { classification, date, packageInfo, quote, rates, shipper, shipTo } = doc;
			const packageTotalCount = Math.ceil(+packageInfo.Packages);
			const packageTotalWeight = Math.ceil(+packageInfo.Weight);
			const packageWeight = Math.ceil(packageTotalWeight / packageTotalCount);

			return {
				classification,
				date,
				packageTotalCount,
				packageTotalWeight,
				packageWeight,
				quote,
				rates,
				shipper,
				shipTo
			};
		}
	]
]);
const tableMap = new Map([['ups-quotes', schema.upsQuote]]);

export const actions: Actions = {
	default: async ({ request }) => {
		const { table } = <Record<string, string>>Object.fromEntries(await request.formData());

		const rowMapFn = rowMap.get(table);
		if (!rowMapFn) {
			const error = `Invalid table: ${table}.  Missing rowMap value.`;
			console.error(error);
			return fail(400, { error });
		}

		const tableSchema = tableMap.get(table);
		if (!tableSchema) {
			const error = `Invalid table: ${table}.  Missing tableMap value.`;
			console.error(error);
			return fail(400, { error });
		}

		const client = await clientInit();
		const mongoDB = client.db('production');
		const collection = mongoDB.collection(table);

		const docs = await collection.find({}).toArray();
		await db.delete(tableSchema);

		const rows = docs.map(rowMapFn);
		const BATCH_SIZE = 100;
		console.log(`db.insert(${table}).values(rows) - start`);
		for (let i = 0; i < rows.length; i += BATCH_SIZE) {
			const batch = rows.slice(i, i + BATCH_SIZE);
			await db.insert(tableSchema).values(batch);
		}
		console.log(`db.insert(${table}).values(rows) - end`);

		return { message: `Successfully added ${rows.length} rows to table: ${table}` };
	}
};
