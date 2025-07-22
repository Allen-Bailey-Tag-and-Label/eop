import {
	boolean,
	date,
	integer,
	json,
	pgTable,
	primaryKey,
	serial,
	timestamp,
	text
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const role = pgTable('role', {
	id: serial('id').primaryKey(),
	label: text('label').unique().notNull()
});
export const route = pgTable('route', {
	id: serial('id').primaryKey(),
	href: text('href'),
	isDirectory: boolean('isDirectory').notNull().default(false),
	label: text('label').notNull(),
	parentId: integer('parentId')
});
export const upsQuote = pgTable('upsQuote', {
	id: serial('id').primaryKey(),
	classification: text('classification'),
	date: timestamp('date'),
	packageTotalCount: integer('packageTotalCount'),
	packageTotalWeight: integer('packageTotalWeight'),
	packageWeight: integer('packageWeight'),
	quote: integer('quote'),
	rates: json('rates').array(),
	shipper: json('shipper'),
	shipTo: json('shipTo')
});
export const user = pgTable('user', {
	id: serial('id').primaryKey(),
	isActive: boolean('isActive').notNull().default(false),
	passwordHash: text('passwordHash').notNull(),
	username: text('username').unique().notNull()
});

// === Join Tables ===
export const roleRoutes = pgTable(
	'roleRoutes',
	{
		roleId: integer('roleId')
			.notNull()
			.references(() => role.id, { onDelete: 'cascade' }),
		routeId: integer('routeId')
			.notNull()
			.references(() => route.id, { onDelete: 'cascade' })
	},
	(table) => ({
		primaryKey: [table.roleId, table.routeId]
	})
);
export const userRoles = pgTable(
	'userRoles',
	{
		userId: integer('userId')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		roleId: integer('roleId')
			.notNull()
			.references(() => role.id, { onDelete: 'cascade' })
	},
	(table) => ({
		primaryKey: [table.userId, table.roleId]
	})
);

// === Relations ===
export const roleRelations = relations(role, ({ many }) => ({
	users: many(userRoles),
	routes: many(roleRoutes)
}));
export const roleRoutesRelations = relations(roleRoutes, ({ one }) => ({
	role: one(role, { fields: [roleRoutes.roleId], references: [role.id] }),
	route: one(route, { fields: [roleRoutes.routeId], references: [route.id] })
}));
export const routeRelations = relations(route, ({ one, many }) => ({
	children: many(route),
	parent: one(route, {
		fields: [route.parentId],
		references: [route.id]
	}),
	roles: many(roleRoutes)
}));
export const userRelations = relations(user, ({ many }) => ({
	roles: many(userRoles)
}));
export const userRolesRelations = relations(userRoles, ({ one }) => ({
	user: one(user, { fields: [userRoles.userId], references: [user.id] }),
	role: one(role, { fields: [userRoles.roleId], references: [role.id] })
}));
