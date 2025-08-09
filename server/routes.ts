import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { breezService } from "./services/breezService";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SALT_ROUNDS = 10;

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  }
});

// Authentication middleware
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: 'User is banned' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Admin middleware
const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Initialize WebSocket server for real-time features
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const clients = new Map<string, WebSocket>();

  wss.on('connection', (ws) => {
    const clientId = randomUUID();
    clients.set(clientId, ws);

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        // Handle different message types for real-time features
        switch (message.type) {
          case 'join-stream':
            // Handle joining a live stream
            broadcast('user-joined', { streamId: message.streamId, userId: message.userId });
            break;
          case 'chat-message':
            // Handle chat messages in live streams
            broadcast('chat-message', message.data);
            break;
          case 'tip-notification':
            // Handle real-time tip notifications
            broadcast('tip-received', message.data);
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      clients.delete(clientId);
    });
  });

  const broadcast = (type: string, data: any) => {
    const message = JSON.stringify({ type, data });
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  // Auth Routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, email, password } = req.body;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      
      // Generate unique wallet ID
      const walletId = randomUUID();

      // Create user
      const user = await storage.createUser({
        username,
        email,
        passwordHash,
        walletId,
        balance: 0,
        isAdmin: false,
        isBanned: false
      });

      // Initialize Breez SDK for user (in production, seed should be generated securely)
      const walletSeed = randomUUID(); // This should be a proper seed in production
      await breezService.initializeSdk(walletSeed, process.env.BREEZ_API_KEY || '');

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      res.json({ 
        token, 
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email,
          balance: user.balance,
          isAdmin: user.isAdmin 
        } 
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Registration failed' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      if (user.isBanned) {
        return res.status(403).json({ message: 'Account is banned' });
      }

      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      res.json({ 
        token, 
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email,
          balance: user.balance,
          isAdmin: user.isAdmin 
        } 
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  app.get('/api/auth/profile', authenticateToken, async (req: any, res) => {
    try {
      const user = req.user;
      const balance = await breezService.getBalance();
      
      // Update balance in database
      await storage.updateUser(user.id, { balance });

      res.json({ 
        id: user.id, 
        username: user.username, 
        email: user.email,
        balance,
        isAdmin: user.isAdmin 
      });
    } catch (error) {
      console.error('Profile fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch profile' });
    }
  });

  // Content Routes
  app.post('/api/posts/upload', authenticateToken, upload.single('content'), async (req: any, res) => {
    try {
      const { text, contentType } = req.body;
      const contentUrl = req.file ? `/uploads/${req.file.filename}` : null;

      const post = await storage.createPost({
        authorId: req.user.id,
        contentType: contentType || 'text',
        contentUrl,
        text: text || null
      });

      res.json(post);
    } catch (error) {
      console.error('Post creation error:', error);
      res.status(500).json({ message: 'Failed to create post' });
    }
  });

  app.get('/api/posts/feed', authenticateToken, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const posts = await storage.getPosts(limit, offset);
      res.json(posts);
    } catch (error) {
      console.error('Feed fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch feed' });
    }
  });

  app.post('/api/posts/:id/react', authenticateToken, async (req: any, res) => {
    try {
      const { reactionType, amount } = req.body;
      const postId = parseInt(req.params.id);

      const reaction = await storage.createReaction({
        postId,
        userId: req.user.id,
        reactionType,
        amount: amount || 0
      });

      // If it's a tip, handle Lightning payment
      if (reactionType === 'tip' && amount > 0) {
        // Get post author
        const posts = await storage.getPosts(1, 0);
        const post = posts.find(p => p.id === postId);
        
        if (post) {
          // Create tip transaction
          await storage.createTransaction({
            senderId: req.user.id,
            receiverId: post.author.id,
            type: 'tip',
            amount,
            status: 'completed'
          });

          // Update balances
          await storage.updateUser(req.user.id, { 
            balance: req.user.balance - amount 
          });
          await storage.updateUser(post.author.id, { 
            balance: post.author.balance + amount 
          });

          // Broadcast tip notification
          broadcast('tip-received', {
            postId,
            amount,
            from: req.user.username,
            to: post.author.username
          });
        }
      }

      res.json(reaction);
    } catch (error) {
      console.error('Reaction error:', error);
      res.status(500).json({ message: 'Failed to add reaction' });
    }
  });

  app.delete('/api/posts/:id', authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.id);
      await storage.deletePost(postId);
      res.json({ message: 'Post deleted successfully' });
    } catch (error) {
      console.error('Post deletion error:', error);
      res.status(500).json({ message: 'Failed to delete post' });
    }
  });

  // Lightning/Wallet Routes
  app.post('/api/lightning/tip', authenticateToken, async (req: any, res) => {
    try {
      const { receiverId, amount, message } = req.body;

      if (req.user.balance < amount) {
        return res.status(400).json({ message: 'Insufficient balance' });
      }

      // Create transaction
      const transaction = await storage.createTransaction({
        senderId: req.user.id,
        receiverId,
        type: 'tip',
        amount,
        status: 'completed'
      });

      // Update balances
      const receiver = await storage.getUser(receiverId);
      if (receiver) {
        await storage.updateUser(req.user.id, { 
          balance: req.user.balance - amount 
        });
        await storage.updateUser(receiverId, { 
          balance: receiver.balance + amount 
        });
      }

      res.json(transaction);
    } catch (error) {
      console.error('Tip error:', error);
      res.status(500).json({ message: 'Failed to send tip' });
    }
  });

  app.post('/api/lightning/withdraw-request', authenticateToken, async (req: any, res) => {
    try {
      const { destinationAddress, amount } = req.body;

      if (req.user.balance < amount) {
        return res.status(400).json({ message: 'Insufficient balance' });
      }

      // Validate address
      const isValidAddress = await breezService.validateAddress(destinationAddress);
      if (!isValidAddress) {
        return res.status(400).json({ message: 'Invalid destination address' });
      }

      // Create pending withdrawal transaction
      const transaction = await storage.createTransaction({
        senderId: req.user.id,
        type: 'withdrawal',
        amount,
        status: 'pending',
        destinationAddress
      });

      res.json(transaction);
    } catch (error) {
      console.error('Withdrawal request error:', error);
      res.status(500).json({ message: 'Failed to create withdrawal request' });
    }
  });

  // Admin Routes
  app.get('/api/admin/withdrawal-requests', authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const requests = await storage.getPendingWithdrawals();
      res.json(requests);
    } catch (error) {
      console.error('Withdrawal requests fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch withdrawal requests' });
    }
  });

  app.post('/api/admin/withdrawal-requests/:id/approve', authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const transactionId = parseInt(req.params.id);
      const transaction = await storage.getTransactions(0, 1000);
      const withdrawal = transaction.find(t => t.id === transactionId);

      if (!withdrawal || withdrawal.status !== 'pending') {
        return res.status(404).json({ message: 'Withdrawal request not found' });
      }

      // Process payment using Breez SDK
      let paymentResult;
      if (withdrawal.destinationAddress?.startsWith('lnbc')) {
        // Lightning payment
        paymentResult = await breezService.sendPayment(withdrawal.destinationAddress);
      } else {
        // On-chain payment
        paymentResult = await breezService.sendOnchain(withdrawal.destinationAddress!, withdrawal.amount);
      }

      if (paymentResult.success) {
        // Update transaction status
        await storage.updateTransaction(transactionId, {
          status: 'completed',
          transactionId: paymentResult.transactionId,
          adminId: req.user.id
        });

        // Update user balance
        if (withdrawal.sender && withdrawal.sender.balance !== null) {
          await storage.updateUser(withdrawal.senderId!, { 
            balance: withdrawal.sender.balance - withdrawal.amount 
          });
        }

        res.json({ message: 'Withdrawal approved and processed' });
      } else {
        await storage.updateTransaction(transactionId, {
          status: 'denied',
          adminId: req.user.id
        });
        res.status(400).json({ message: 'Payment failed: ' + paymentResult.error });
      }
    } catch (error) {
      console.error('Withdrawal approval error:', error);
      res.status(500).json({ message: 'Failed to process withdrawal' });
    }
  });

  app.post('/api/admin/withdrawal-requests/:id/deny', authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const transactionId = parseInt(req.params.id);
      
      await storage.updateTransaction(transactionId, {
        status: 'denied',
        adminId: req.user.id
      });

      res.json({ message: 'Withdrawal request denied' });
    } catch (error) {
      console.error('Withdrawal denial error:', error);
      res.status(500).json({ message: 'Failed to deny withdrawal' });
    }
  });

  app.post('/api/admin/users/:id/ban', authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.banUser(userId);
      res.json({ message: 'User banned successfully', user });
    } catch (error) {
      console.error('User ban error:', error);
      res.status(500).json({ message: 'Failed to ban user' });
    }
  });

  // Live Stream Routes
  app.get('/api/streams/active', authenticateToken, async (req: any, res) => {
    try {
      const streams = await storage.getActiveLiveStreams();
      res.json(streams);
    } catch (error) {
      console.error('Active streams fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch active streams' });
    }
  });

  app.post('/api/streams/create', authenticateToken, async (req: any, res) => {
    try {
      const { title, description } = req.body;
      
      const stream = await storage.createLiveStream({
        streamerId: req.user.id,
        title,
        description,
        isActive: true,
        viewerCount: 0,
        totalTips: 0
      });

      res.json(stream);
    } catch (error) {
      console.error('Stream creation error:', error);
      res.status(500).json({ message: 'Failed to create stream' });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    });
  });

  return httpServer;
}
