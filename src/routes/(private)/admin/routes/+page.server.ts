import { db } from "$lib/server/db"

export const load = async () => {
    return {
        streamed: {
            routes: db.query.route.findMany()
        }
    }
}