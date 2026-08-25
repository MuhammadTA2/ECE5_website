import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

export const gallerySettings = sqliteTable(
  'gallery_settings',
  {
    id: integer('id').primaryKey(),
    title: text('title').notNull(),
    subtitle: text('subtitle').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => [check('gallery_settings_singleton', sql`${table.id} = 1`)],
);

export const galleryMeta = sqliteTable(
  'gallery_meta',
  {
    id: integer('id').primaryKey(),
    revision: integer('revision').notNull().default(0),
  },
  (table) => [check('gallery_meta_singleton', sql`${table.id} = 1`)],
);

export const editors = sqliteTable(
  'editors',
  {
    userId: text('user_id').primaryKey(),
    email: text('email').notNull(),
    displayName: text('display_name').notNull(),
    role: text('role', { enum: ['owner', 'editor'] }).notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [
    uniqueIndex('idx_editors_single_owner')
      .on(table.role)
      .where(sql`${table.role} = 'owner'`),
    check('editors_valid_role', sql`${table.role} IN ('owner', 'editor')`),
  ],
);

export const photos = sqliteTable(
  'photos',
  {
    id: text('id').primaryKey(),
    objectKey: text('object_key').notNull().unique(),
    filename: text('filename').notNull(),
    contentType: text('content_type').notNull(),
    byteSize: integer('byte_size').notNull(),
    caption: text('caption').notNull().default(''),
    addedAt: integer('added_at').notNull(),
    addedBy: text('added_by').notNull(),
    position: integer('position').notNull(),
    deletedAt: integer('deleted_at'),
    version: integer('version').notNull().default(1),
  },
  (table) => [
    index('idx_photos_active_position')
      .on(table.position)
      .where(sql`${table.deletedAt} IS NULL`),
    index('idx_photos_deleted_at').on(table.deletedAt),
  ],
);

export const photoTags = sqliteTable(
  'photo_tags',
  {
    photoId: text('photo_id')
      .notNull()
      .references(() => photos.id, { onDelete: 'cascade' }),
    tag: text('tag').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.photoId, table.tag] }),
    index('idx_photo_tags_tag').on(table.tag, table.photoId),
  ],
);

export const rateLimits = sqliteTable('rate_limits', {
  key: text('key').primaryKey(),
  windowStart: integer('window_start').notNull(),
  count: integer('count').notNull(),
});
