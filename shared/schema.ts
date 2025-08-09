import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  index,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  walletId: varchar("wallet_id", { length: 255 }).notNull().unique(),
  balance: bigint("balance", { mode: "number" }).default(0), // In satoshis
  isAdmin: boolean("is_admin").default(false),
  isBanned: boolean("is_banned").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Posts table
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  authorId: serial("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  contentType: varchar("content_type", { length: 50 }).notNull(),
  contentUrl: text("content_url"),
  text: text("text"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Reactions table
export const reactions = pgTable("reactions", {
  id: serial("id").primaryKey(),
  postId: serial("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: serial("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reactionType: varchar("reaction_type", { length: 50 }).notNull(), // 'like', 'tip'
  amount: bigint("amount", { mode: "number" }).default(0), // For tips in satoshis
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  senderId: serial("sender_id").references(() => users.id, { onDelete: "set null" }),
  receiverId: serial("receiver_id").references(() => users.id, { onDelete: "set null" }),
  type: varchar("type", { length: 50 }).notNull(), // 'tip', 'reward', 'withdrawal'
  amount: bigint("amount", { mode: "number" }).notNull(), // Amount in satoshis
  status: varchar("status", { length: 50 }).default("completed"), // 'pending', 'approved', 'denied', 'completed'
  destinationAddress: text("destination_address"),
  transactionId: text("transaction_id"), // ID from Breez SDK
  adminId: serial("admin_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Live streams table
export const liveStreams = pgTable("live_streams", {
  id: serial("id").primaryKey(),
  streamerId: serial("streamer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  viewerCount: serial("viewer_count").default(0),
  totalTips: bigint("total_tips", { mode: "number" }).default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  reactions: many(reactions),
  sentTransactions: many(transactions, { relationName: "sentTransactions" }),
  receivedTransactions: many(transactions, { relationName: "receivedTransactions" }),
  liveStreams: many(liveStreams),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  reactions: many(reactions),
}));

export const reactionsRelations = relations(reactions, ({ one }) => ({
  post: one(posts, {
    fields: [reactions.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [reactions.userId],
    references: [users.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  sender: one(users, {
    fields: [transactions.senderId],
    references: [users.id],
    relationName: "sentTransactions",
  }),
  receiver: one(users, {
    fields: [transactions.receiverId],
    references: [users.id],
    relationName: "receivedTransactions",
  }),
  admin: one(users, {
    fields: [transactions.adminId],
    references: [users.id],
  }),
}));

export const liveStreamsRelations = relations(liveStreams, ({ one }) => ({
  streamer: one(users, {
    fields: [liveStreams.streamerId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  createdAt: true,
});

export const insertReactionSchema = createInsertSchema(reactions).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertLiveStreamSchema = createInsertSchema(liveStreams).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Reaction = typeof reactions.$inferSelect;
export type InsertReaction = z.infer<typeof insertReactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type LiveStream = typeof liveStreams.$inferSelect;
export type InsertLiveStream = z.infer<typeof insertLiveStreamSchema>;
