import { invalid } from '@sveltejs/kit';
import { ObjectId } from 'mongodb';
import db from '$db';

export const actions = {
  create: async ({ request }) => {
    try {
      // get form data
      const data = await request.formData();

      // destructure request
      let { collection, insert } = Object.fromEntries(data);
      try {
        insert = JSON.parse(insert);
      } catch (error) {}

      // perform insert
      await db.create({ collection, insert });

      // find doc
      const [doc] = await db.find({ collection, query: insert });

      return { doc: JSON.parse(JSON.stringify(doc)), success: true };
    } catch (error) {
      console.log(error);
      return invalid(401, error);
    }
  },
  remove: async ({ request }) => {
    try {
      // get form data
      const data = await request.formData();

      // destructure request
      let { collection, query } = Object.fromEntries(data);
      try {
        query = JSON.parse(query);
      } catch (error) {}

      // sanitize query
      query.$or = query.$or.map(({ _id }) => {
        return { _id: ObjectId(_id) };
      });

      // perform update
      await db.remove({ collection, query });

      // return response
      return { success: true };
    } catch (error) {
      console.log(error);
      return invalid(401, error);
    }
  },
  update: async ({ request }) => {
    try {
      // get form data
      const data = await request.formData();

      // destructure request
      let { collection, query, update } = Object.fromEntries(data);
      try {
        query = JSON.parse(query);
        update = JSON.parse(update);
      } catch (error) {}

      // sanitize query
      query = Object.keys(query).reduce((obj, key) => {
        const value = key.substring(0, 1) === '_' ? ObjectId(query[key]) : query[key];
        obj[key] = value;
        return obj;
      }, {});

      // perform update
      await db.update({ collection, query, update });

      // find document
      const [doc] = await db.find({ collection, query });

      return { doc: JSON.parse(JSON.stringify(doc)), success: true };
    } catch (error) {
      console.log(error);
      return invalid(401, error);
    }
  }
};
