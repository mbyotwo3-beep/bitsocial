# SatStream - Bitcoin Lightning Social Media Platform

SatStream is a full-stack social media platform that integrates real Bitcoin Lightning Network monetization. Users can create posts, tip content creators with satoshis, stream live content, and manage their Bitcoin Lightning wallets. The platform combines traditional social media features with cryptocurrency microtransactions, enabling a creator economy powered by Bitcoin.

## Features

### 🔐 Authentication & User Management
- Secure JWT-based authentication with bcrypt password hashing
- User registration with automatic Lightning wallet creation
- Admin user privileges for moderation and platform management
- User banning system for community safety

### 💰 Lightning Network Integration
- **Real Breez SDK Integration** for Lightning Network operations
- Admin-controlled main wallet architecture for all platform transactions
- Individual user balance tracking in satoshis (private balances)
- Lightning invoice generation and payment processing
- Tip system allowing users to send satoshis to content creators
- Withdrawal system with admin approval workflow
- Complete transaction history with sender/receiver relationships

### 📱 Social Media Features
- Create posts with text, images, and video support
- Like and tip posts with Lightning Network payments
- Real-time feed with user interactions
- User profiles with wallet information
- Post reactions and engagement tracking

### 🎥 Live Streaming
- Real-time live streaming functionality
- Live chat with WebSocket integration
- Tip streamers during live sessions
- Viewer count tracking
- Stream monetization with Lightning Network

### 👑 Admin Dashboard
- Withdrawal request management and approval
- User management (ban/unban functionality)
- Platform analytics and transaction monitoring
- Real-time withdrawal processing via Lightning Network

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** with shadcn/ui components
- **TanStack Query** for server state management
- **Wouter** for lightweight client-side routing
- **WebSocket** for real-time features

### Backend
- **Node.js** with Express.js
- **TypeScript** with ES modules
- **Drizzle ORM** for type-safe database operations
- **PostgreSQL** with Neon serverless database
- **JWT** authentication with bcrypt
- **Multer** for file uploads
- **WebSocket** server for live features

### Bitcoin Integration
- **Breez SDK** for Lightning Network operations
- **Lightning Network** for instant, low-fee Bitcoin transactions
- **Lightning invoices** for payment processing
- **On-chain Bitcoin** support for withdrawals

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 18 or higher)
- **npm** or **yarn** package manager
- **PostgreSQL** database (local or hosted)

### Breez SDK Requirements

For Lightning Network functionality, you'll need:
- A Breez SDK API key (contact Breez for production access)
- Lightning Network testnet/mainnet access
- Admin wallet setup for platform operations

## Installation & Setup

### Local Development

1. **Clone the repository**
```bash
git clone <your-repository-url>
cd satstream
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Variables**

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/satstream"
PGHOST=localhost
PGPORT=5432
PGUSER=your_username
PGPASSWORD=your_password
PGDATABASE=satstream

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here

# Admin Configuration
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@satstream.com
ADMIN_PASSWORD=secure-admin-password

# Breez SDK Configuration (Contact Breez for production keys)
BREEZ_API_KEY=your-breez-api-key
BREEZ_ENVIRONMENT=testnet  # or 'mainnet' for production

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800  # 50MB in bytes

# Server Configuration
PORT=5000
NODE_ENV=development
```

4. **Database Setup**

Initialize your PostgreSQL database:

```bash
# Create the database
createdb satstream

# Push the schema to the database
npm run db:push

# Optional: Seed with sample data
npm run db:seed
```

5. **Create Upload Directory**
```bash
mkdir uploads
```

6. **Start Development Server**
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

### Production Deployment

#### Option 1: Replit Deployment (Recommended)

1. **Fork this repository** to your Replit account

2. **Configure Environment Variables** in Replit:
   - Go to your Repl → Secrets tab
   - Add all required environment variables from the `.env` example above
   - Use production values for database and Breez SDK

3. **Database Setup**:
   - The app automatically creates a PostgreSQL database
   - Run `npm run db:push` to initialize the schema
   - Create an admin user on first run

4. **Deploy**:
   - Click the "Deploy" button in your Repl
   - Configure your custom domain if desired
   - Monitor deployment logs for any issues

#### Option 2: Traditional Server Deployment

1. **Server Requirements**:
   - Ubuntu 20.04+ or similar Linux distribution
   - Node.js 18+
   - PostgreSQL 13+
   - Nginx (for reverse proxy)
   - SSL certificate (Let's Encrypt recommended)

2. **Clone and Setup**:
```bash
git clone <your-repository-url>
cd satstream
npm install --production
```

3. **Database Configuration**:
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE satstream;
CREATE USER satstream_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE satstream TO satstream_user;
\q

# Initialize database
npm run db:push
```

4. **Environment Configuration**:
```bash
# Create production environment file
cp .env.example .env.production

# Edit with production values
nano .env.production
```

5. **Process Management**:
```bash
# Install PM2 for process management
npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'satstream',
    script: 'server/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
EOF

# Build and start
npm run build
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

6. **Nginx Configuration**:
```nginx
# /etc/nginx/sites-available/satstream
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket support
    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

7. **SSL with Let's Encrypt**:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Configuration

### Database Schema

The application uses the following main tables:

- **users**: User accounts with wallet information
- **posts**: User-generated content with media support
- **reactions**: Likes and tips on posts
- **transactions**: Lightning Network payments and tips
- **liveStreams**: Live streaming sessions
- **sessions**: User session storage

### Admin User Setup

On first run, the application creates an admin user with credentials from environment variables. You can also create additional admin users through the database:

```sql
UPDATE users SET "isAdmin" = true WHERE username = 'your_username';
```

### Lightning Network Configuration

#### Testnet Setup (Development)
```env
BREEZ_ENVIRONMENT=testnet
BREEZ_API_KEY=your_testnet_key
```

#### Mainnet Setup (Production)
```env
BREEZ_ENVIRONMENT=mainnet
BREEZ_API_KEY=your_mainnet_key
```

**Important**: Never use mainnet configuration in development!

## API Documentation

### Authentication Endpoints

```
POST /api/auth/register - Register new user
POST /api/auth/login - User login
POST /api/auth/logout - User logout
GET /api/auth/me - Get current user
```

### Post Endpoints

```
GET /api/posts - Get all posts
POST /api/posts - Create new post
DELETE /api/posts/:id - Delete post
POST /api/posts/:id/reactions - Add reaction/tip
```

### Wallet Endpoints

```
GET /api/wallet/balance - Get user balance
POST /api/wallet/withdraw - Request withdrawal
GET /api/wallet/transactions - Get transaction history
```

### Live Streaming Endpoints

```
GET /api/streams - Get active streams
POST /api/streams - Start new stream
PUT /api/streams/:id/end - End stream
POST /api/streams/:id/tip - Tip streamer
```

### Admin Endpoints

```
GET /api/admin/users - Get all users
PUT /api/admin/users/:id/ban - Ban user
PUT /api/admin/users/:id/unban - Unban user
GET /api/admin/withdrawal-requests - Get pending withdrawals
POST /api/admin/withdrawal-requests/:id/approve - Approve withdrawal
POST /api/admin/withdrawal-requests/:id/deny - Deny withdrawal
```

## WebSocket Events

### Client Events
- `join-stream` - Join a live stream
- `leave-stream` - Leave a live stream
- `stream-message` - Send chat message
- `stream-tip` - Send tip to streamer

### Server Events
- `stream-joined` - Confirmation of stream join
- `stream-message` - Broadcast chat message
- `stream-tip` - Broadcast tip notification
- `viewer-count` - Updated viewer count

## File Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions
│   │   └── contexts/       # React contexts
│   └── index.html
├── server/                 # Backend Node.js application
│   ├── services/           # Business logic services
│   ├── index.ts           # Application entry point
│   ├── routes.ts          # API route definitions
│   ├── storage.ts         # Database operations
│   └── db.ts              # Database configuration
├── shared/                 # Shared types and schemas
│   └── schema.ts          # Drizzle database schema
├── uploads/               # User uploaded files
└── README.md             # This file
```

## Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run db:push      # Push schema changes to database
npm run db:studio    # Open Drizzle Studio for database management
npm run db:seed      # Seed database with sample data
npm run lint         # Run TypeScript linter
npm run type-check   # Type check without building
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify PostgreSQL is running
   - Check DATABASE_URL in environment variables
   - Ensure database exists and user has proper permissions

2. **Breez SDK Errors**
   - Verify API key is correct for the environment (testnet/mainnet)
   - Check network connectivity
   - Ensure proper Lightning Network setup

3. **File Upload Issues**
   - Verify uploads directory exists and is writable
   - Check MAX_FILE_SIZE environment variable
   - Ensure sufficient disk space

4. **WebSocket Connection Issues**
   - Check firewall settings for WebSocket connections
   - Verify reverse proxy configuration includes WebSocket support
   - Check browser console for connection errors

### Logs

Application logs are available:
- Development: Console output
- Production: PM2 logs (`pm2 logs satstream`)
- Database: PostgreSQL logs

### Performance

For production optimization:
- Enable database connection pooling
- Implement Redis for session storage
- Use CDN for static file serving
- Enable gzip compression in Nginx
- Monitor Lightning Network node performance

## Security

### Security Considerations

1. **Environment Variables**: Never commit sensitive environment variables
2. **JWT Secrets**: Use strong, unique JWT secrets in production
3. **Database**: Use strong database passwords and limit access
4. **Lightning**: Secure your Lightning node and backup seed phrases
5. **File Uploads**: Validate and sanitize all uploaded content
6. **Rate Limiting**: Implement rate limiting for API endpoints

### Backup Strategy

1. **Database**: Regular PostgreSQL backups
2. **Lightning Wallet**: Secure seed phrase backup
3. **Uploaded Files**: Regular file system backups
4. **Environment**: Secure environment variable backup

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the troubleshooting section above

## Changelog

### v1.0.0 (Current)
- Initial release with full Lightning Network integration
- Complete social media functionality
- Live streaming with real-time monetization
- Admin dashboard and user management
- Production-ready deployment configuration

---

**⚡ Built with Lightning Network ⚡**

Experience the future of social media monetization with instant, low-fee Bitcoin transactions.