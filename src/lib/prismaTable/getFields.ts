import { Prisma } from '@prisma/client';

export const getFields = (modelName: string) =>
	Prisma.dmmf.datamodel.models.find((model) => model.name === modelName)?.fields || [];
