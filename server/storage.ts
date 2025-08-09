import { 
  users, 
  posts, 
  reactions, 
  transactions, 
  liveStreams,
  type User, 
  type InsertUser,
  type Post,
  type InsertPost,
  type Reaction,
  type InsertReaction,
  type Transaction,
  type InsertTransaction,
  type LiveStream,
  type InsertLiveStream
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  
  // Post operations
  createPost(post: InsertPost): Promise<Post>;
  getPosts(limit?: number, offset?: number): Promise<Array<Post & { author: User; _count: { reactions: number; tips: number } }>>;
  deletePost(id: number): Promise<void>;
  
  // Reaction operations
  createReaction(reaction: InsertReaction): Promise<Reaction>;
  getPostReactions(postId: number): Promise<Reaction[]>;
  
  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactions(userId: number, limit?: number): Promise<Array<Transaction & { sender?: User; receiver?: User }>>;
  getPendingWithdrawals(): Promise<Array<Transaction & { sender?: User; receiver?: User }>>;
  updateTransaction(id: number, updates: Partial<Transaction>): Promise<Transaction>;
  
  // Live stream operations
  createLiveStream(stream: InsertLiveStream): Promise<LiveStream>;
  getActiveLiveStreams(): Promise<Array<LiveStream & { streamer: User }>>;
  updateLiveStream(id: number, updates: Partial<LiveStream>): Promise<LiveStream>;
  
  // Admin operations
  banUser(id: number): Promise<User>;
  unbanUser(id: number): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, createdAt: sql`${users.createdAt}` })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async createPost(post: InsertPost): Promise<Post> {
    const [newPost] = await db
      .insert(posts)
      .values(post)
      .returning();
    return newPost;
  }

  async getPosts(limit = 20, offset = 0): Promise<Array<Post & { author: User; _count: { reactions: number; tips: number } }>> {
    const result = await db
      .select({
        id: posts.id,
        authorId: posts.authorId,
        contentType: posts.contentType,
        contentUrl: posts.contentUrl,
        text: posts.text,
        createdAt: posts.createdAt,
        author: users,
        reactionCount: sql<number>`count(DISTINCT ${reactions.id})`.as('reactionCount'),
        tipCount: sql<number>`count(DISTINCT CASE WHEN ${reactions.reactionType} = 'tip' THEN ${reactions.id} END)`.as('tipCount'),
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .leftJoin(reactions, eq(posts.id, reactions.postId))
      .groupBy(posts.id, users.id)
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    return result.map(row => ({
      ...row,
      _count: {
        reactions: row.reactionCount || 0,
        tips: row.tipCount || 0,
      }
    }));
  }

  async deletePost(id: number): Promise<void> {
    await db.delete(posts).where(eq(posts.id, id));
  }

  async createReaction(reaction: InsertReaction): Promise<Reaction> {
    const [newReaction] = await db
      .insert(reactions)
      .values(reaction)
      .returning();
    return newReaction;
  }

  async getPostReactions(postId: number): Promise<Reaction[]> {
    return await db
      .select()
      .from(reactions)
      .where(eq(reactions.postId, postId));
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async getTransactions(userId: number, limit = 50): Promise<Array<Transaction & { sender?: User; receiver?: User }>> {
    const results = await db
      .select()
      .from(transactions)
      .leftJoin(users, eq(transactions.senderId, users.id))
      .where(or(eq(transactions.senderId, userId), eq(transactions.receiverId, userId)))
      .orderBy(desc(transactions.createdAt))
      .limit(limit);

    return results.map(row => ({
      id: row.transactions.id,
      senderId: row.transactions.senderId,
      receiverId: row.transactions.receiverId,
      type: row.transactions.type,
      amount: row.transactions.amount,
      status: row.transactions.status,
      destinationAddress: row.transactions.destinationAddress,
      transactionId: row.transactions.transactionId,
      adminId: row.transactions.adminId,
      createdAt: row.transactions.createdAt,
      sender: row.users || undefined,
      receiver: undefined,
    })) as Array<Transaction & { sender?: User; receiver?: User }>;
  }

  async getPendingWithdrawals(): Promise<Array<Transaction & { sender?: User; receiver?: User }>> {
    const results = await db
      .select()
      .from(transactions)
      .leftJoin(users, eq(transactions.senderId, users.id))
      .where(and(eq(transactions.type, "withdrawal"), eq(transactions.status, "pending")))
      .orderBy(desc(transactions.createdAt));

    return results.map(row => ({
      id: row.transactions.id,
      senderId: row.transactions.senderId,
      receiverId: row.transactions.receiverId,
      type: row.transactions.type,
      amount: row.transactions.amount,
      status: row.transactions.status,
      destinationAddress: row.transactions.destinationAddress,
      transactionId: row.transactions.transactionId,
      adminId: row.transactions.adminId,
      createdAt: row.transactions.createdAt,
      sender: row.users || undefined,
      receiver: undefined,
    })) as Array<Transaction & { sender?: User; receiver?: User }>;
  }

  async updateTransaction(id: number, updates: Partial<Transaction>): Promise<Transaction> {
    const [transaction] = await db
      .update(transactions)
      .set({ ...updates, createdAt: sql`${transactions.createdAt}` })
      .where(eq(transactions.id, id))
      .returning();
    return transaction;
  }

  async createLiveStream(stream: InsertLiveStream): Promise<LiveStream> {
    const [newStream] = await db
      .insert(liveStreams)
      .values(stream)
      .returning();
    return newStream;
  }

  async getActiveLiveStreams(): Promise<Array<LiveStream & { streamer: User }>> {
    return await db
      .select({
        id: liveStreams.id,
        streamerId: liveStreams.streamerId,
        title: liveStreams.title,
        description: liveStreams.description,
        isActive: liveStreams.isActive,
        viewerCount: liveStreams.viewerCount,
        totalTips: liveStreams.totalTips,
        createdAt: liveStreams.createdAt,
        streamer: users,
      })
      .from(liveStreams)
      .innerJoin(users, eq(liveStreams.streamerId, users.id))
      .where(eq(liveStreams.isActive, true))
      .orderBy(desc(liveStreams.viewerCount));
  }

  async updateLiveStream(id: number, updates: Partial<LiveStream>): Promise<LiveStream> {
    const [stream] = await db
      .update(liveStreams)
      .set({ ...updates, createdAt: sql`${liveStreams.createdAt}` })
      .where(eq(liveStreams.id, id))
      .returning();
    return stream;
  }

  async banUser(id: number): Promise<User> {
    return await this.updateUser(id, { isBanned: true });
  }

  async unbanUser(id: number): Promise<User> {
    return await this.updateUser(id, { isBanned: false });
  }
}

export const storage = new DatabaseStorage();
