import { fail, type Actions } from '@sveltejs/kit';
import { Types } from 'mongoose';
import { clientInit } from '$lib/server/mongoDB';
import {
	Branch,
	Log,
	Role,
	UpsQuote,
	User,
	UserProfile,
	UserSettings
} from '$lib/server/mongoose/models';
import { connect } from '$lib/server/mongoose';
import type { MongoClient } from 'mongodb';

type BatchParams = { batchSize?: number; docs: any[]; model: any; modelName: string };
type UpdateParams = { _createdById: string; client: MongoClient };
type Update = (params: UpdateParams) => void;

const batchInsert = async ({ batchSize, docs, model, modelName }: BatchParams) => {
	batchSize = batchSize ?? 100;
	console.log(`${modelName}.insertMany(docs) - start`);
	for (let i = 0; i < docs.length; i += batchSize) {
		await insertDocs({ docs: docs.slice(i, i + batchSize), model, modelName });
	}
	console.log(`${modelName}.insertMany(docs) - end`);
};
const insertDocs = async ({
	docs,
	model,
	modelName
}: {
	docs: any[];
	model: any;
	modelName: string;
}): Promise<any[]> => {
	const insertedDocs = await model.insertMany(docs);
	await Log.insertMany(
		insertedDocs.map((doc: any) => ({
			_createdById: doc._createdById,
			data: doc,
			model: modelName,
			operation: 'create'
		}))
	);
	return insertedDocs;
};
const tableMap: Map<string, Update> = new Map([
	[
		'ups-quotes',
		async ({ _createdById, client }: UpdateParams) => {
			const mongoDB = client.db('production');
			const collection = mongoDB.collection('ups-quotes');

			await UpsQuote.deleteMany();
			const docs = await collection.find({}).toArray();
			const formattedDocs = docs.map((doc) => {
				const { classification, date: createdAt, packageInfo, quote, rates, shipper, shipTo } = doc;
				const packageTotalCount = Math.ceil(+packageInfo.Packages);
				const packageTotalWeight = Math.ceil(+packageInfo.Weight);
				const packageWeight = Math.ceil(packageTotalWeight / packageTotalCount);

				return {
					_createdById,
					classification,
					packageTotalCount,
					packageTotalWeight,
					packageWeight,
					quote,
					rates,
					shipper,
					shipTo,
					createdAt,
					updatedAt: createdAt
				};
			});

			await batchInsert({ docs: formattedDocs, model: UpsQuote, modelName: 'UpsQuote' });

			return { message: `Successfully added ${formattedDocs.length} rows to model: UpsQuote` };
		}
	],
	[
		'users',
		async ({ _createdById, client }: UpdateParams) => {
			const mongoDB = client.db('production');
			const collection = mongoDB.collection('users');

			await Promise.all([
				User.deleteMany({ username: { $ne: 'bmcaleavey' } }),
				UserProfile.deleteMany({ email: { $ne: 'bob_mcaleavey@ennis.com' } }),
				UserSettings.deleteMany({ magnification: { $ne: 14 } })
			]);
			const abtlBranch = await Branch.findOne({ number: 2046 });
			const userRole = await Role.findOne({ label: 'User' });
			const docs = await collection.find({ username: { $ne: 'bmcaleavey' } }).toArray();
			const formattedDocs = docs.map((doc) => {
				doc.ennisId = +(doc.ennisId ?? 0);
				doc.hireDate = new Date(+doc.hireDate);

				const {
					ennisId,
					email,
					firstName,
					hireDate,
					isActive,
					lastName,
					password: passwordHash,
					username
				} = doc;

				return {
					user: {
						_branchIds: [abtlBranch?._id ?? ''],
						_createdById,
						_defaultBranchId: abtlBranch?._id ?? '',
						_profileId: '',
						_roleIds: [userRole?._id ?? ''],
						_settingsId: '',
						isActive: isActive ?? false,
						passwordHash,
						username
					},
					userProfile: {
						ennisId,
						email,
						firstName,
						hireDate,
						lastName
					}
				};
			});

			const batchSize = 100;
			console.log(`User.insertMany(docs) - start`);
			const formattedUserDocs = formattedDocs.map((doc) => doc.user);
			const formattedUserProfileDocs = formattedDocs.map((doc) => doc.userProfile);
			for (let i = 0; i < formattedUserDocs.length; i += batchSize) {
				const userProfiles = await insertDocs({
					docs: formattedUserProfileDocs.slice(i, i + batchSize),
					model: UserProfile,
					modelName: 'UserProfile'
				});
				const userSettings = await insertDocs({
					docs: formattedUserProfileDocs
						.slice(i, i + batchSize)
						.map(() => ({ _createdById, magnification: 16 })),
					model: UserSettings,
					modelName: 'UserSettings'
				});
				await insertDocs({
					docs: userProfiles.map((userProfile, index) => {
						const user = formattedUserDocs[index];
						user._profileId = userProfile._id;
						user._settingsId = userSettings[index]._id;
						return user;
					}),
					model: User,
					modelName: 'User'
				});
			}
			console.log(`User.insertMany(docs) - end`);

			return { message: `Successfully added ${formattedDocs.length} rows to model: User` };
		}
	]
]);

export const actions: Actions = {
	default: async ({ locals, request }) => {
		await connect();

		const { table } = <Record<string, string>>Object.fromEntries(await request.formData());

		const update = tableMap.get(table);
		if (!update) {
			const error = `Invalid table: ${table}.  Missing in tableMap`;
			console.error(error);
			return fail(400, { error });
		}

		const client = await clientInit();

		await update({ _createdById: locals.user._id, client });
	}
};

export const load = async () => {
	const tableOptions = [
		{ label: '', value: '' },
		{ label: 'ups-quotes', value: 'ups-quotes' },
		{ label: 'users', value: 'users' }
	];

	return { tableOptions };
};
