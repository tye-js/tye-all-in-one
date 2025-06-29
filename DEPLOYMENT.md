# Deployment Guide

This guide covers different deployment options for the TYE All-in-One application.

## Prerequisites

- Docker and Docker Compose
- Domain name (for production)
- SSL certificate (for production)
- Google Cloud account (for TTS functionality)

## Quick Deployment with Docker

### 1. Clone and Initialize

```bash
git clone <repository-url>
cd tye-all-in-one
./deploy.sh init
```

### 2. Configure Environment

Edit `.env` file with your settings:

```bash
# Database
POSTGRES_PASSWORD=your_secure_password

# NextAuth.js
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your_nextauth_secret

# Google Cloud
GOOGLE_CLOUD_PROJECT_ID=your-project-id

# Admin
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your_admin_password
```

### 3. Add Google Credentials

Replace `google-credentials.json` with your service account key.

### 4. Deploy

```bash
./deploy.sh deploy
```

## Production Deployment

### Server Requirements

**Minimum:**
- 2 CPU cores
- 4GB RAM
- 20GB storage
- Ubuntu 20.04+ or similar

**Recommended:**
- 4 CPU cores
- 8GB RAM
- 50GB SSD storage
- Load balancer (for high availability)

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login to apply group changes
```

### 2. Application Setup

```bash
# Create application directory
sudo mkdir -p /opt/tye-all-in-one
sudo chown $USER:$USER /opt/tye-all-in-one
cd /opt/tye-all-in-one

# Clone repository
git clone <repository-url> .

# Initialize
./deploy.sh init
```

### 3. SSL Certificate Setup

#### Option A: Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install certbot

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem
sudo chown $USER:$USER ssl/*.pem
```

#### Option B: Custom Certificate

Place your certificate files:
- `ssl/cert.pem` - Certificate file
- `ssl/key.pem` - Private key file

### 4. Production Configuration

Edit `.env` for production:

```bash
# Application
NODE_ENV=production
NEXTAUTH_URL=https://yourdomain.com
APP_URL=https://yourdomain.com

# Database (use strong password)
POSTGRES_PASSWORD=very_secure_password_here

# NextAuth (generate secure secret)
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Admin
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=secure_admin_password

# Google Cloud
GOOGLE_CLOUD_PROJECT_ID=your-project-id

# Optional: Email notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@yourdomain.com
```

### 5. Deploy to Production

```bash
./deploy.sh deploy
```

### 6. Verify Deployment

```bash
# Check service status
./deploy.sh status

# Check logs
./deploy.sh logs

# Test health endpoint
curl https://yourdomain.com/api/health
```

## Cloud Deployment

### AWS Deployment

#### Using EC2

1. Launch EC2 instance (t3.medium or larger)
2. Configure security groups (ports 80, 443, 22)
3. Follow production deployment steps
4. Configure Route 53 for DNS
5. Use Application Load Balancer for high availability

#### Using ECS

1. Create ECS cluster
2. Build and push Docker image to ECR
3. Create task definition
4. Configure service with load balancer
5. Set up RDS for PostgreSQL

### Google Cloud Deployment

#### Using Compute Engine

1. Create VM instance (e2-medium or larger)
2. Configure firewall rules
3. Follow production deployment steps
4. Use Cloud DNS for domain management
5. Configure Cloud Load Balancing

#### Using Cloud Run

1. Build container image
2. Push to Container Registry
3. Deploy to Cloud Run
4. Configure Cloud SQL for PostgreSQL
5. Set up custom domain

### DigitalOcean Deployment

#### Using Droplet

1. Create Droplet (2GB RAM minimum)
2. Follow production deployment steps
3. Configure domain in DNS settings
4. Use Load Balancer for scaling

#### Using App Platform

1. Connect GitHub repository
2. Configure build settings
3. Add PostgreSQL database
4. Set environment variables
5. Deploy application

## Environment-Specific Configurations

### Development

```bash
# .env.local
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tye_dev
```

### Staging

```bash
# .env.staging
NODE_ENV=production
NEXTAUTH_URL=https://staging.yourdomain.com
DATABASE_URL=postgresql://user:pass@staging-db:5432/tye_staging
```

### Production

```bash
# .env.production
NODE_ENV=production
NEXTAUTH_URL=https://yourdomain.com
DATABASE_URL=postgresql://user:pass@prod-db:5432/tye_production
```

## Database Management

### Backup

```bash
# Create backup
./deploy.sh backup

# Automated backups (add to crontab)
0 2 * * * cd /opt/tye-all-in-one && ./deploy.sh backup
```

### Restore

```bash
# Restore from backup
./deploy.sh restore backup_20231201_020000.sql
```

### Migration

```bash
# Run migrations
docker-compose exec app npm run db:migrate

# Push schema changes
docker-compose exec app npm run db:push
```

## Monitoring and Maintenance

### Health Monitoring

```bash
# Check application health
curl https://yourdomain.com/api/health

# Monitor with external service
# - UptimeRobot
# - Pingdom
# - StatusCake
```

### Log Management

```bash
# View logs
./deploy.sh logs app
./deploy.sh logs nginx
./deploy.sh logs postgres

# Log rotation (add to logrotate)
/opt/tye-all-in-one/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
}
```

### Updates

```bash
# Update application
cd /opt/tye-all-in-one
git pull origin main
./deploy.sh deploy

# Update Docker images
docker-compose pull
docker-compose up -d
```

### Security Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker
sudo apt update docker-ce docker-ce-cli containerd.io

# Renew SSL certificates
sudo certbot renew
```

## Scaling

### Horizontal Scaling

1. Use load balancer (Nginx, HAProxy, cloud LB)
2. Deploy multiple app instances
3. Use shared database
4. Configure session store (Redis)

### Vertical Scaling

1. Increase server resources
2. Optimize database queries
3. Enable caching
4. Use CDN for static assets

## Troubleshooting

### Common Issues

#### Application Won't Start

```bash
# Check logs
./deploy.sh logs app

# Check environment variables
docker-compose exec app env

# Verify database connection
docker-compose exec app npm run db:push
```

#### Database Connection Issues

```bash
# Check database status
./deploy.sh logs postgres

# Test connection
docker-compose exec postgres psql -U postgres -d tye_all_in_one -c "SELECT 1;"
```

#### SSL Certificate Issues

```bash
# Check certificate validity
openssl x509 -in ssl/cert.pem -text -noout

# Test SSL configuration
curl -I https://yourdomain.com
```

#### Performance Issues

```bash
# Check resource usage
docker stats

# Monitor database performance
docker-compose exec postgres pg_stat_activity

# Check application metrics
curl https://yourdomain.com/api/health
```

### Getting Help

1. Check application logs
2. Verify configuration
3. Test individual components
4. Check external dependencies
5. Review documentation
6. Create GitHub issue with details

## Security Considerations

### Production Security

1. Use strong passwords
2. Enable firewall
3. Regular security updates
4. Monitor access logs
5. Use HTTPS only
6. Implement rate limiting
7. Regular backups
8. Security scanning

### Environment Variables

Never commit sensitive data:
- Database passwords
- API keys
- JWT secrets
- SSL private keys

Use environment variables or secret management systems.

## Performance Optimization

### Application Level

1. Enable caching
2. Optimize database queries
3. Use CDN for static assets
4. Implement pagination
5. Optimize images

### Infrastructure Level

1. Use SSD storage
2. Configure database tuning
3. Enable gzip compression
4. Use HTTP/2
5. Implement caching layers
