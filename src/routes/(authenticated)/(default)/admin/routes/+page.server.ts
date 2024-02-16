import { prisma } from "$lib/prisma"

export const load = async () => {
    const routes = await prisma.route.findMany();

    return { routes }
}