import { query, Client } from 'faunadb';

export let server: Client = new Client({secret:process.env.FAUNADB_SECRET || "" , domain:"db.fauna.com"})
export const q = query;
export const client = (token: string): Client => new Client({ secret: token });