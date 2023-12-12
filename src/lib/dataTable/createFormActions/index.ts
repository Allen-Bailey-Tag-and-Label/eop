import { Prisma } from '@prisma/client';
import { prisma } from '$lib/prisma';
import { formDataToObject } from '$utilities';

export const createFormActions = (modelName) => {
  // throw if model name is not defined
  if (modelName === undefined) throw 'Model not defined';

  const schema = Prisma.dmmf.datamodel.models
    .find((model) => model.name === modelName)
    ?.fields?.reduce((obj, field) => {
      obj[field.name] = field;
      return obj;
    }, {});

  // create end point
  const create = async ({ request }) => {
    // get data from request
    const data = formDataToObject(await request.formData());

    await prisma[modelName].create({
      data: parseData(data, schema)
    });
  };

  // delete end point
  const deleteMethod = async ({ request }) => {
    // destructure request
    const { id } = formDataToObject(await request.formData());

    // determine if there are any connected keys
    if (dataHasConnectedKeys(schema)) {
      await prisma[modelName].update({
        where: {
          id
        },
        data: getDisconnectData(schema)
      });
    }

    await prisma[modelName].delete({
      where: {
        id
      }
    });

    return { success: true };
  };

  // edit end point
  const edit = async ({ request }) => {
    // destructure request
    const { id, ...data } = formDataToObject(await request.formData());

    // determine if there are any connected keys
    if (dataHasConnectedKeys(schema)) {
      await prisma[modelName].update({
        where: {
          id
        },
        data: getDisconnectData(schema)
      });
    }

    await prisma[modelName].update({
      where: {
        id
      },
      data: parseData(data, schema)
    });

    return { success: true };
  };

  return {
    create,
    delete: deleteMethod,
    edit
  };
};

const dataHasConnectedKeys = (schema) => getConnectedKeys(schema).length > 0;
const getConnectedKeys = (schema) =>
  Object.keys(schema).filter(
    (key) => schema[key]?.relationName !== undefined && schema[key]?.isList === true
  );
const getDisconnectData = (schema) =>
  getConnectedKeys(schema).reduce((obj, key) => {
    obj[key] = {
      set: []
    };

    return obj;
  }, {});

const parseData = (data, schema) => {
  Object.keys(data).map((key) => {
    if (schema?.[key]?.relationName !== undefined) {
      data[key] = {
        connect: JSON.parse(data[key]).map((id) => {
          return {
            id
          };
        })
      };
    }
    if (schema?.[key]?.type === 'Int') data[key] = +data[key];
  });
  return data;
};
