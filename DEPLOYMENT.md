# SatStream Deployment Guide

This document provides detailed instructions for deploying SatStream in both development and production environments.

## Quick Start

### Development (Local)

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd satstream
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your development values
   ```

3. **Database Setup**
   ```bash
   npm run db:push
   npm run db:seed  # Optional: Add sample data
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   Access: http://localhost:5000

### Production (Replit - Recommended)

1. **Fork Repository** to your Replit account
2. **Configure Secrets** in Replit dashboard:
   - `DATABASE_URL`, `JWT_SECRET`, `BREEZ_API_KEY`, etc.
3. **Initialize Database**: `npm run db:push`
4. **Deploy**: Click "Deploy" button in Replit

## Detailed Deployment Options

### Option 1: Replit Deployment (Recommended)

**Advantages:**
- Automatic PostgreSQL database provisioning
- Built-in environment secrets management
- One-click deployment with automatic scaling
- Built-in SSL and custom domain support
- No server maintenance required

**Steps:**
1. Fork this repository to your Replit account
2. Configure environment secrets in the Secrets tab
3. Run `npm run db:push` to initialize the database
4. Click the Deploy button
5. Access your deployed application

**Required Secrets:**
```
DATABASE_URL=<automatically-provided>
JWT_SECRET=<generate-strong-secret>
BREEZ_API_KEY=<your-breez-api-key>
BREEZ_ENVIRONMENT=testnet  # or mainnet
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=<secure-password>
```

### Option 2: Traditional Server Deployment

**Requirements:**
- Ubuntu 20.04+ or similar
- Node.js 18+
- PostgreSQL 13+
- Nginx (recommended)
- PM2 for process management

**Automated Deployment:**
```bash
chmod +x deploy.sh
./deploy.sh
```

**Manual Deployment:**
```bash
# 1. Server Setup
sudo apt update && sudo apt upgrade -y
sudo apt install nodejs npm postgresql postgresql-contrib nginx

# 2. Clone Repository
git clone <repository-url>
cd satstream

# 3. Environment Configuration
cp .env.example .env.production
nano .env.production  # Edit with production values

# 4. Install Dependencies
npm ci --only=production
sudo npm install -g pm2

# 5. Build Application
npm run build

# 6. Database Setup
npm run db:push

# 7. Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save && pm2 startup

# 8. Configure Nginx
sudo cp nginx.conf /etc/nginx/sites-available/satstream
sudo ln -s /etc/nginx/sites-available/satstream /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 9. SSL Setup (Optional)
sudo certbot --nginx -d your-domain.com
```

### Option 3: Docker Deployment

**Docker Compose (Recommended):**
```bash
# 1. Configure environment
cp .env.example .env
nano .env  # Edit with your values

# 2. Build and start services
docker-compose up -d

# 3. Initialize database
docker-compose exec app npm run db:push

# 4. Access application
open http://localhost:3000
```

**Single Container:**
```bash
# 1. Build image
docker build -t satstream .

# 2. Run container
docker run -d \
  --name satstream \
  -p 3000:3000 \
  -e DATABASE_URL="your-database-url" \
  -e JWT_SECRET="your-jwt-secret" \
  -v ./uploads:/app/uploads \
  satstream

# 3. Initialize database
docker exec satstream npm run db:push
```

## Environment Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret for JWT token signing | `your-super-secret-key` |
| `BREEZ_API_KEY` | Breez SDK API key | `your-breez-api-key` |
| `BREEZ_ENVIRONMENT` | Breez environment | `testnet` or `mainnet` |
| `ADMIN_USERNAME` | Default admin username | `admin` |
| `ADMIN_EMAIL` | Default admin email | `admin@yourdomain.com` |
| `ADMIN_PASSWORD` | Default admin password | `secure-password` |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Node environment | `development` |
| `UPLOAD_DIR` | File upload directory | `./uploads` |
| `MAX_FILE_SIZE` | Max file size in bytes | `52428800` (50MB) |
| `SESSION_SECRET` | Session secret | Auto-generated |

## Database Management

### Schema Management
```bash
# Push schema changes
npm run db:push

# Generate migrations (if needed)
npm run db:generate

# View database
npm run db:studio
```

### Backup and Restore
```bash
# Backup database
pg_dump $DATABASE_URL > backup.sql

# Restore database
psql $DATABASE_URL < backup.sql
```

### Seeding Data
```bash
# Add sample data for development
npm run db:seed
```

## Monitoring and Maintenance

### Health Checks
- Health endpoint: `GET /api/health`
- Expected response: `{"status":"healthy","timestamp":"...","environment":"...","version":"..."}`

### PM2 Management
```bash
# View status
pm2 status

# View logs
pm2 logs satstream

# Restart application
pm2 restart satstream

# Stop application
pm2 stop satstream

# Monitor resources
pm2 monit
```

### Nginx Management
```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# View logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Database Monitoring
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Connect to database
psql $DATABASE_URL

# Check connections
SELECT * FROM pg_stat_activity;
```

## Security Considerations

### Production Security Checklist

- [ ] Use strong, unique JWT secrets
- [ ] Enable HTTPS with valid SSL certificates
- [ ] Configure proper firewall rules
- [ ] Use environment variables for sensitive data
- [ ] Enable rate limiting in Nginx
- [ ] Regular security updates
- [ ] Monitor application logs
- [ ] Backup database regularly
- [ ] Use non-root user for application
- [ ] Secure Lightning wallet seed phrases

### Recommended Security Headers
The nginx.conf includes security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

## Performance Optimization

### Production Optimizations
- Enable gzip compression in Nginx
- Use CDN for static assets
- Implement database connection pooling
- Enable Redis for session storage (optional)
- Monitor and optimize database queries
- Use PM2 cluster mode for multiple instances

### Scaling Considerations
- Horizontal scaling with load balancer
- Database read replicas for high traffic
- Redis/Memcached for caching
- CDN for global content delivery
- Lightning Network node optimization

## Troubleshooting

### Common Issues

**Database Connection Error:**
```bash
# Check database status
sudo systemctl status postgresql

# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT version();"
```

**Application Won't Start:**
```bash
# Check PM2 logs
pm2 logs satstream

# Check node version
node --version  # Should be 18+

# Check environment variables
pm2 show satstream
```

**Nginx Errors:**
```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Verify proxy settings
curl -I http://localhost:3000/api/health
```

**Lightning Network Issues:**
- Verify Breez API key and environment
- Check network connectivity
- Monitor Lightning node logs
- Ensure proper mainnet/testnet configuration

### Getting Help
- Check application logs: `pm2 logs satstream`
- Health check: `curl http://localhost:3000/api/health`
- Database status: `npm run db:studio`
- GitHub Issues: Report bugs and get support

## Backup and Recovery

### Automated Backup Script
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/path/to/backups"

# Database backup
pg_dump $DATABASE_URL > "$BACKUP_DIR/db_backup_$DATE.sql"

# Application files backup
tar -czf "$BACKUP_DIR/uploads_backup_$DATE.tar.gz" uploads/

# Keep only last 30 days of backups
find $BACKUP_DIR -type f -mtime +30 -delete
```

### Recovery Process
1. Stop the application: `pm2 stop satstream`
2. Restore database: `psql $DATABASE_URL < backup.sql`
3. Restore uploads: `tar -xzf uploads_backup.tar.gz`
4. Start application: `pm2 start satstream`
5. Verify health: `curl http://localhost:3000/api/health`

---

For additional support, check the main README.md or create an issue in the repository.