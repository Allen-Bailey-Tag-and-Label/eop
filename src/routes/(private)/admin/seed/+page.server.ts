import type { Actions } from "@sveltejs/kit";
import { clientInit } from "$lib/mongoDB";

export const actions: Actions = {
    default: async ({ request }) => {
        console.log('made it')
        const { table } = <Record<string, string>>Object.fromEntries(await request.formData());

        const client = await clientInit();
        const db = client.db('production');
        const collection = db.collection(table);

        const docs = await collection.find({}).toArray();

        console.log({ table, docs });

        return {}
    }
}