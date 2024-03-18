import { prisma } from '$lib/prisma';
import { convert } from '$utilities';
import { DateTime } from 'luxon';

export const actions = {
	find: async ({ request }) => {
		try {
			const { date: dateString, ennisId: ennisIdString } = <{ date: string; ennisId: string }>(
				convert(await request.formData()).formData.to.Object()
			);
			const date = DateTime.fromFormat(dateString, 'yyyy-MM-dd').toJSDate();
			const ennisId = +ennisIdString;
			const dateAndEnnisId = `${dateString}-${ennisIdString}`;
			const result = await prisma.laborEntry.findUnique({ where: { dateAndEnnisId } });
			const entries =
				result?.entries ||
				[...Array(10)].map((_, i) => ({
					workOrder: '',
					sequence: 0,
					start: '',
					end: '',
					completed: '',
					status: 20
				}));
			return entries;
		} catch (error) {
			console.log(error);
		}
	},
	update: async ({ request }) => {
		try {
			const {
				date: dateString,
				ennisId: ennisIdString,
				entries: entriesString
			} = <{ date: string; ennisId: string; entries: string }>(
				convert(await request.formData()).formData.to.Object()
			);
			const date = DateTime.fromFormat(dateString, 'yyyy-MM-dd').toJSDate();
			const ennisId = +ennisIdString;
			const entries = JSON.parse(entriesString);
			const dateAndEnnisId = `${dateString}-${ennisIdString}`;

			await prisma.laborEntry.upsert({
				where: {
					dateAndEnnisId
				},
				create: {
					date,
					ennisId,
					entries,
					dateAndEnnisId
				},
				update: {
					date,
					ennisId,
					entries,
					dateAndEnnisId
				}
			});

			return { success: true };
		} catch (error) {
			console.log(error);
		}
	}
};

export const load = async () => {
	const [workOrderRoutings, userProfiles] = await Promise.all([
		prisma.workOrderRouting.findMany(),
		prisma.userProfile.findMany()
	]);

	return { workOrderRoutings, userProfiles };
};
