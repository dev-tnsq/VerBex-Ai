# Passkey Kit Production Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Passkey Kit implementation to production, including all necessary configurations, security considerations, and monitoring setup.

## Prerequisites

### 1. **Environment Setup**
```bash
# Required environment variables
SOROBAN_RPC_URL=https://soroban-mainnet.stellar.org
NETWORK_PASSPHRASE=Public Global Stellar Network ; September 2015
WALLET_WASM_HASH=ecd990f0b45ca6817149b6175f79b32efb442f35731985a084131e8265c4cd90
LAUNCHTUBE_URL=https://mainnet.launchtube.xyz
LAUNCHTUBE_JWT=your_launchtube_jwt_here
MERCURY_URL=https://mainnet.mercurydata.app
MERCURY_JWT=your_mercury_jwt_here
```

### 2. **Database Setup**
```bash
# PostgreSQL for persistent storage
DATABASE_URL=postgresql://user:password@localhost:5432/passkey_kit

# Redis for session management
REDIS_URL=redis://localhost:6379
```

### 3. **Security Requirements**
- SSL/TLS certificates
- Secure environment variables
- Firewall configuration
- Rate limiting setup

## Deployment Steps

### Step 1: Environment Configuration

Create a `.env` file for production:

```env
# Network Configuration
SOROBAN_RPC_URL=https://soroban-mainnet.stellar.org
NETWORK_PASSPHRASE=Public Global Stellar Network ; September 2015
WALLET_WASM_HASH=ecd990f0b45ca6817149b6175f79b32efb442f35731985a084131e8265c4cd90

# Passkey Kit Configuration
PASSKEY_TIMEOUT_SECONDS=30
CHALLENGE_TIMEOUT_MS=300000
MAX_RETRIES=3

# Launchtube Configuration
LAUNCHTUBE_URL=https://mainnet.launchtube.xyz
LAUNCHTUBE_JWT=your_launchtube_jwt_here

# Mercury Configuration
MERCURY_URL=https://mainnet.mercurydata.app
MERCURY_JWT=your_mercury_jwt_here

# App Configuration
APP_NAME=VerbexAI DeFi
RP_ID=yourdomain.com

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/passkey_kit
REDIS_URL=redis://localhost:6379

# Logging Configuration
LOG_LEVEL=info
ENABLE_DEBUG_LOGS=false

# Security Configuration
AGENT_SECRET=your_agent_secret_here
```

### Step 2: Database Setup

#### PostgreSQL Setup
```sql
-- Create database
CREATE DATABASE passkey_kit;

-- Create tables
CREATE TABLE passkey_registrations (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(56) UNIQUE NOT NULL,
    credential_id TEXT NOT NULL,
    public_key TEXT NOT NULL,
    contract_id VARCHAR(56),
    user_identifier VARCHAR(255),
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE smart_wallets (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(56) UNIQUE NOT NULL,
    contract_id VARCHAR(56) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE challenges (
    id SERIAL PRIMARY KEY,
    challenge_hash VARCHAR(255) UNIQUE NOT NULL,
    wallet_address VARCHAR(56),
    xdr TEXT,
    operation_type VARCHAR(50),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_passkey_wallet_address ON passkey_registrations(wallet_address);
CREATE INDEX idx_smart_wallet_address ON smart_wallets(wallet_address);
CREATE INDEX idx_challenges_hash ON challenges(challenge_hash);
CREATE INDEX idx_challenges_expires ON challenges(expires_at);
```

#### Redis Setup
```bash
# Install Redis
sudo apt-get install redis-server

# Configure Redis for production
sudo nano /etc/redis/redis.conf

# Add these settings:
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

### Step 3: Application Deployment

#### Docker Setup
Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN pnpm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3001

# Start application
CMD ["pnpm", "start"]
```

#### Docker Compose
Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: passkey_kit
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Step 4: Nginx Configuration

Create `/etc/nginx/sites-available/passkey-kit`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=passkey:10m rate=5r/s;

    # API endpoints
    location /api/passkey/ {
        limit_req zone=passkey burst=20 nodelay;
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # MCP endpoints
    location /mcp/ {
        limit_req zone=api burst=50 nodelay;
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location / {
        root /var/www/passkey-kit;
        try_files $uri $uri/ /index.html;
    }
}
```

### Step 5: Security Configuration

#### Firewall Setup
```bash
# Configure UFW firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 5432/tcp
sudo ufw allow 6379/tcp
sudo ufw enable
```

#### SSL Certificate
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com
```

### Step 6: Monitoring Setup

#### Application Monitoring
```bash
# Install PM2 for process management
npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'passkey-kit-mcp',
    script: 'dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF

# Start application with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### Database Monitoring
```bash
# Install pgAdmin for PostgreSQL monitoring
sudo apt-get install pgadmin4

# Set up monitoring queries
cat > monitoring_queries.sql << EOF
-- Active wallets
SELECT COUNT(*) as active_wallets FROM smart_wallets WHERE status = 'active';

-- Recent registrations
SELECT COUNT(*) as recent_registrations 
FROM passkey_registrations 
WHERE registered_at > NOW() - INTERVAL '24 hours';

-- Challenge usage
SELECT COUNT(*) as active_challenges 
FROM challenges 
WHERE expires_at > NOW();
EOF
```

### Step 7: Testing

#### Health Check Endpoint
```typescript
// Add to server.ts
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      database: 'connected',
      redis: 'connected',
      passkeyKit: 'ready'
    }
  });
});
```

#### Load Testing
```bash
# Install Artillery for load testing
npm install -g artillery

# Create load test configuration
cat > load-test.yml << EOF
config:
  target: 'https://yourdomain.com'
  phases:
    - duration: 60
      arrivalRate: 10
  defaults:
    headers:
      Content-Type: 'application/json'

scenarios:
  - name: "Passkey enrollment flow"
    flow:
      - post:
          url: "/api/passkey/start-enrollment"
          json:
            userAddress: "GABC123456789012345678901234567890123456789012345678901234567890"
      - think: 2
      - post:
          url: "/api/passkey/complete-enrollment"
          json:
            walletAddress: "GABC123456789012345678901234567890123456789012345678901234567890"
            credential: {}
            challenge: "test_challenge"
EOF

# Run load test
artillery run load-test.yml
```

## Production Checklist

### ✅ **Security**
- [ ] SSL/TLS certificates installed
- [ ] Environment variables secured
- [ ] Firewall configured
- [ ] Rate limiting enabled
- [ ] Security headers set

### ✅ **Database**
- [ ] PostgreSQL installed and configured
- [ ] Database tables created
- [ ] Indexes optimized
- [ ] Backup strategy implemented
- [ ] Monitoring queries set up

### ✅ **Application**
- [ ] Application deployed with Docker
- [ ] PM2 process manager configured
- [ ] Logging configured
- [ ] Health checks implemented
- [ ] Error handling comprehensive

### ✅ **Monitoring**
- [ ] Application monitoring enabled
- [ ] Database monitoring set up
- [ ] Log aggregation configured
- [ ] Alerting system implemented
- [ ] Performance metrics tracked

### ✅ **Testing**
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Load testing completed
- [ ] Security testing performed
- [ ] User acceptance testing done

## Troubleshooting

### Common Issues

#### 1. **Passkey Kit Deployment Fails**
```bash
# Check logs
pm2 logs passkey-kit-mcp

# Verify environment variables
echo $SOROBAN_RPC_URL
echo $LAUNCHTUBE_JWT

# Test network connectivity
curl -X POST https://soroban-mainnet.stellar.org
```

#### 2. **Database Connection Issues**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test database connection
psql -h localhost -U user -d passkey_kit -c "SELECT 1;"

# Check connection pool
SELECT * FROM pg_stat_activity;
```

#### 3. **Redis Connection Issues**
```bash
# Check Redis status
sudo systemctl status redis

# Test Redis connection
redis-cli ping

# Check Redis memory usage
redis-cli info memory
```

### Performance Optimization

#### 1. **Database Optimization**
```sql
-- Analyze table statistics
ANALYZE passkey_registrations;
ANALYZE smart_wallets;
ANALYZE challenges;

-- Check query performance
EXPLAIN ANALYZE SELECT * FROM passkey_registrations WHERE wallet_address = 'GABC...';
```

#### 2. **Application Optimization**
```bash
# Monitor memory usage
pm2 monit

# Check CPU usage
top -p $(pgrep -f "passkey-kit")

# Monitor network connections
netstat -an | grep :3001
```

## Maintenance

### Daily Tasks
- [ ] Check application logs for errors
- [ ] Monitor database performance
- [ ] Verify SSL certificate validity
- [ ] Check disk space usage

### Weekly Tasks
- [ ] Review security logs
- [ ] Update dependencies
- [ ] Backup database
- [ ] Test disaster recovery

### Monthly Tasks
- [ ] Security audit
- [ ] Performance review
- [ ] Update SSL certificates
- [ ] Review monitoring alerts

## Conclusion

This production deployment guide provides a comprehensive approach to deploying the Passkey Kit implementation securely and efficiently. Follow each step carefully and ensure all security measures are in place before going live.

For additional support, refer to the Passkey Kit documentation and the Stellar developer community. 