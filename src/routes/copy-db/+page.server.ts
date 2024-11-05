import { DATABASE_URL_FROM } from '$env/static/private';
import { prisma } from '$lib/prisma';
import { PrismaClient } from '@prisma/client';

const prismaFrom = new PrismaClient({ datasources: { db: { url: DATABASE_URL_FROM } } });

export const load = async () => {
	const [users, profiles] = await Promise.all([
		prismaFrom.user.findMany(),
		prismaFrom.userProfile.findMany()
	]);

	const userData = users.map(({ active, ...user }) => {
		return { ...user, active: true };
	});

	const profileData = profiles.map(
		({
			dateHired,
			employeeNumber,
			emailSignatureTitle,
			ennisId,
			extension,
			firstName,
			lastName,
			userId
		}) => {
			return {
				dateOfHire: dateHired,
				employeeNumber: ennisId,
				emailSignatureTitle,
				extension,
				firstName,
				lastName,
				userId
			};
		}
	);

	await Promise.all([prisma.userProfile.deleteMany()]);
	await Promise.all([prisma.user.deleteMany()]);
	await prisma.$transaction([
		prisma.user.createMany({ data: userData }),
		prisma.userProfile.createMany({ data: profileData })
	]);

	console.log('success');
};
