#!/bin/bash

# SatStream Production Deployment Script
set -e

echo "🚀 Starting SatStream deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version 2>/dev/null || echo "not installed")
if [[ $NODE_VERSION == "not installed" ]]; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | cut -d'v' -f2)
if [[ $NODE_MAJOR -lt 18 ]]; then
    print_error "Node.js version 18+ is required. Current version: $NODE_VERSION"
    exit 1
fi

print_status "Node.js version check passed: $NODE_VERSION"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    print_warning "PostgreSQL client not found. Installing..."
    sudo apt update && sudo apt install -y postgresql-client
fi

# Check environment file
if [[ ! -f ".env.production" ]]; then
    print_warning ".env.production not found. Creating from template..."
    cp .env.example .env.production
    print_warning "Please edit .env.production with your production values before continuing"
    read -p "Press enter when ready to continue..."
fi

# Source production environment
set -a
source .env.production
set +a

# Validate required environment variables
required_vars=("DATABASE_URL" "JWT_SECRET" "ADMIN_USERNAME" "ADMIN_PASSWORD")
for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
        print_error "Required environment variable $var is not set in .env.production"
        exit 1
    fi
done

print_status "Environment variables validated"

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p logs uploads dist

# Install dependencies
print_status "Installing production dependencies..."
npm ci --only=production

# Install PM2 globally if not installed
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2 process manager..."
    sudo npm install -g pm2
fi

# Build the application
print_status "Building application for production..."
npm run build

# Database setup
print_status "Setting up database..."
npm run db:push

# Optional: Seed database with sample data
read -p "Do you want to seed the database with sample data? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Seeding database..."
    npm run db:seed
fi

# Start application with PM2
print_status "Starting application with PM2..."
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save
pm2 startup

print_status "Setting up log rotation..."
pm2 install pm2-logrotate

# Create nginx configuration if nginx is installed
if command -v nginx &> /dev/null; then
    print_status "Nginx detected. Setting up reverse proxy configuration..."
    
    # Backup existing nginx config
    if [[ -f "/etc/nginx/sites-enabled/default" ]]; then
        sudo cp /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/default.backup
    fi
    
    # Copy our nginx configuration
    sudo cp nginx.conf /etc/nginx/sites-available/satstream
    sudo ln -sf /etc/nginx/sites-available/satstream /etc/nginx/sites-enabled/
    
    # Test nginx configuration
    if sudo nginx -t; then
        print_status "Nginx configuration is valid"
        sudo systemctl reload nginx
    else
        print_error "Nginx configuration test failed"
        exit 1
    fi
else
    print_warning "Nginx not found. Please install nginx for production deployment"
fi

# Setup SSL with Let's Encrypt (optional)
if command -v certbot &> /dev/null; then
    read -p "Do you want to setup SSL with Let's Encrypt? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your domain name: " DOMAIN
        if [[ -n "$DOMAIN" ]]; then
            print_status "Setting up SSL for $DOMAIN..."
            sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "$ADMIN_EMAIL"
        fi
    fi
fi

# Final status check
print_status "Performing health check..."
sleep 5

if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    print_status "✅ Application is running successfully!"
    
    echo ""
    echo "🎉 SatStream deployment completed!"
    echo ""
    echo "Application URL: http://$(hostname -I | awk '{print $1}'):3000"
    echo "Health Check: http://$(hostname -I | awk '{print $1}'):3000/api/health"
    echo ""
    echo "Admin Credentials:"
    echo "Username: $ADMIN_USERNAME"
    echo "Email: $ADMIN_EMAIL"
    echo ""
    echo "Useful commands:"
    echo "  View logs: pm2 logs satstream"
    echo "  Restart app: pm2 restart satstream"
    echo "  Stop app: pm2 stop satstream"
    echo "  Monitor app: pm2 monit"
    echo ""
    echo "Database commands:"
    echo "  View schema: npm run db:studio"
    echo "  Push changes: npm run db:push"
    echo ""
else
    print_error "❌ Application health check failed!"
    echo "Please check the logs with: pm2 logs satstream"
    exit 1
fi