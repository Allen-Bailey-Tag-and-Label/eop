import { MongoClient } from 'mongodb';
import { MONGODB_URL } from '$env/static/private';

type Parameters = {
    url?: string,
    options?: Record<string, string>
}

let clients: Map<string, MongoClient> = new Map();

export const clientInit = async (parameters?: Parameters) => {
    console.log('clientInit - start')
    if (!clients.has(MONGODB_URL)) {
        console.log('clientInit - new MongoClient')
        const client = new MongoClient(MONGODB_URL);
        console.log('clientInit - await client.connect()')
        await client.connect();
        console.log('clientInit - set client in map');
        clients.set(MONGODB_URL, client);
    }
    console.log('clientInit - clients.get(MONGODB_URL)')

    let client = clients.get(MONGODB_URL) || new MongoClient(MONGODB_URL);
    console.log('clientInit - return client')

    return client;
}