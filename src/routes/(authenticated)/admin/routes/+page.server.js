import { prisma } from "$lib/prisma"

export const load = async() => {
    return {
        streamed: {
            routes: await prisma.route.findMany({include:{roles:true},orderBy:[{id:'asc'}]})
        }
    }
}
