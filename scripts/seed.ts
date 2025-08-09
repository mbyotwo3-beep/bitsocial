#!/usr/bin/env tsx

import { db } from "../server/db.js";
import { users, posts, transactions } from "../shared/schema.js";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";

async function seed() {
  console.log("🌱 Starting database seeding...");

  try {
    // Create sample users
    const hashedPassword = await bcrypt.hash("password123", 10);
    
    const [adminUser] = await db
      .insert(users)
      .values({
        username: "admin",
        email: "admin@satstream.com",
        passwordHash: hashedPassword,
        walletId: nanoid(),
        balance: 1000000, // 1M sats
        isAdmin: true,
      })
      .returning();

    const [testUser] = await db
      .insert(users)
      .values({
        username: "satoshi",
        email: "satoshi@bitcoin.org",
        passwordHash: hashedPassword,
        walletId: nanoid(),
        balance: 500000, // 500k sats
        isAdmin: false,
      })
      .returning();

    console.log("👥 Created sample users");

    // Create sample posts
    await db.insert(posts).values([
      {
        authorId: testUser.id,
        contentType: "text",
        text: "Welcome to SatStream! ⚡ The future of social media monetization with Bitcoin Lightning Network.",
        contentUrl: null,
      },
      {
        authorId: adminUser.id,
        contentType: "text",
        text: "Just deployed SatStream to production! Ready to revolutionize social media with Lightning Network micropayments. 🚀 #Bitcoin #Lightning #SocialMedia",
        contentUrl: null,
      },
      {
        authorId: testUser.id,
        contentType: "text",
        text: "Love how instant the tips are on this platform! Lightning Network is the future of payments. ⚡",
        contentUrl: null,
      },
    ]);

    console.log("📝 Created sample posts");

    // Create sample transactions
    await db.insert(transactions).values([
      {
        senderId: adminUser.id,
        receiverId: testUser.id,
        type: "tip",
        amount: 1000, // 1000 sats
        status: "completed",
      },
      {
        senderId: testUser.id,
        receiverId: adminUser.id,
        type: "tip",
        amount: 500, // 500 sats
        status: "completed",
      },
    ]);

    console.log("💰 Created sample transactions");
    console.log("✅ Database seeding completed successfully!");
    
    // Print sample credentials
    console.log("\n📋 Sample Login Credentials:");
    console.log("Admin User:");
    console.log("  Username: admin");
    console.log("  Email: admin@satstream.com");
    console.log("  Password: password123");
    console.log("\nTest User:");
    console.log("  Username: satoshi");
    console.log("  Email: satoshi@bitcoin.org");
    console.log("  Password: password123");

  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

seed();