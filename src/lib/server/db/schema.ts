import { boolean, pgTable, serial, text } from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
	id: serial('id').primaryKey(),
	isActive: boolean('isActive').default(false),
	password: text('password'),
	username: text('username').unique()
});
