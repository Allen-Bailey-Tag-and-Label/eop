import { Prisma } from '@prisma/client';

export const getModels = () => Prisma.dmmf.datamodel.models;
