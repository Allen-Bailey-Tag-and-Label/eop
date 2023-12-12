import { Prisma } from '@prisma/client';
import { prisma } from '$lib/prisma';
import { createFormActions } from '$lib/dataTable';

type ModelData = {
  [key: string]: {
    include: ModelData | Boolean;
  };
};

const getModel = (name: String) =>
  Prisma.dmmf.datamodel.models.find((model) => model.name === name);
const getPrismaPromises = (name: String) => {
  // initiate promise map
  const promiseMap = new Map();

  // add initial name to promise map
  promiseMap.set(name, {});
  // // check if model name isn't in model
  // if (!map.get(name)) {
  //   // add name to map
  //   map.set(name, {});

  //   // get all relation fields
  //   const relationFields = getModel(name)
  //     ?.fields.filter(
  //       (field) => field?.relationName !== undefined && map.get(field?.type) === undefined
  //     )
  //     .map((field) => field.type);

  // }
  // return map;
};

export const actions = createFormActions('Route');
export const load = async () => {
  const prismaModels = getPrismaPromises('Route');
  console.log(prismaModels);
  const [roles, routes] = await Promise.all([
    prisma.role.findMany({
      orderBy: [{ name: 'asc' }]
    }),
    prisma.route.findMany({
      include: { roles: true },
      orderBy: [{ group: 'asc' }, { label: 'asc' }]
    })
  ]);
  return {
    roles,
    routes
  };
};
