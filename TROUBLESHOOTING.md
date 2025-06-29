# Troubleshooting Guide

This guide helps you diagnose and resolve common issues with the TYE All-in-One application.

## Quick Diagnostics

### Health Check

First, check the application health:

```bash
# Check overall health
curl https://yourdomain.com/api/health

# Check service status
./deploy.sh status

# View recent logs
./deploy.sh logs
```

### Common Commands

```bash
# Restart all services
./deploy.sh restart

# View specific service logs
./deploy.sh logs app
./deploy.sh logs postgres
./deploy.sh logs nginx

# Check resource usage
docker stats

# Test database connection
docker-compose exec postgres psql -U postgres -d tye_all_in_one -c "SELECT 1;"
```

## Application Issues

### Application Won't Start

**Symptoms:**
- Container exits immediately
- "Application failed to start" error
- Port binding errors

**Diagnosis:**
```bash
# Check application logs
./deploy.sh logs app

# Check if port is already in use
sudo netstat -tulpn | grep :3000

# Verify environment variables
docker-compose exec app env | grep -E "(DATABASE_URL|NEXTAUTH)"
```

**Solutions:**

1. **Port already in use:**
   ```bash
   # Kill process using port 3000
   sudo kill $(sudo lsof -t -i:3000)
   
   # Or change port in docker-compose.yml
   ```

2. **Missing environment variables:**
   ```bash
   # Check .env file exists and has required variables
   cat .env | grep -E "(DATABASE_URL|NEXTAUTH_SECRET)"
   
   # Copy from example if missing
   cp .env.example .env
   ```

3. **Database connection issues:**
   ```bash
   # Wait for database to be ready
   docker-compose up postgres -d
   sleep 30
   docker-compose up app -d
   ```

### Build Failures

**Symptoms:**
- Docker build fails
- "Module not found" errors
- TypeScript compilation errors

**Diagnosis:**
```bash
# Check build logs
docker-compose build app

# Check Node.js version
docker-compose run app node --version

# Verify package.json
cat package.json | grep -E "(next|react)"
```

**Solutions:**

1. **Clear Docker cache:**
   ```bash
   docker-compose build --no-cache app
   docker system prune -f
   ```

2. **Update dependencies:**
   ```bash
   # Local development
   npm install
   npm audit fix
   
   # Rebuild container
   docker-compose build app
   ```

3. **TypeScript errors:**
   ```bash
   # Check TypeScript configuration
   npx tsc --noEmit
   
   # Fix type errors in code
   ```

## Database Issues

### Database Connection Failed

**Symptoms:**
- "Connection refused" errors
- "Database not found" errors
- Application can't connect to database

**Diagnosis:**
```bash
# Check database status
./deploy.sh logs postgres

# Test connection
docker-compose exec postgres pg_isready -U postgres

# Check database exists
docker-compose exec postgres psql -U postgres -l
```

**Solutions:**

1. **Database not running:**
   ```bash
   # Start database
   docker-compose up postgres -d
   
   # Check if it's healthy
   docker-compose ps postgres
   ```

2. **Wrong connection string:**
   ```bash
   # Verify DATABASE_URL in .env
   echo $DATABASE_URL
   
   # Should be: postgresql://postgres:password@postgres:5432/tye_all_in_one
   ```

3. **Database doesn't exist:**
   ```bash
   # Create database
   docker-compose exec postgres createdb -U postgres tye_all_in_one
   
   # Run migrations
   docker-compose exec app npm run db:push
   ```

### Migration Failures

**Symptoms:**
- "Migration failed" errors
- Schema mismatch errors
- Table doesn't exist errors

**Diagnosis:**
```bash
# Check migration status
docker-compose exec app npm run db:studio

# View database schema
docker-compose exec postgres psql -U postgres -d tye_all_in_one -c "\dt"
```

**Solutions:**

1. **Reset database:**
   ```bash
   # Backup first if needed
   ./deploy.sh backup
   
   # Reset and migrate
   docker-compose exec app npm run db:push
   docker-compose exec app npm run db:seed
   ```

2. **Manual migration:**
   ```bash
   # Generate new migration
   docker-compose exec app npm run db:generate
   
   # Apply migration
   docker-compose exec app npm run db:migrate
   ```

## Authentication Issues

### NextAuth.js Errors

**Symptoms:**
- "Invalid session" errors
- Redirect loops
- "NEXTAUTH_SECRET" warnings

**Diagnosis:**
```bash
# Check NextAuth configuration
grep NEXTAUTH .env

# Check session endpoint
curl https://yourdomain.com/api/auth/session
```

**Solutions:**

1. **Missing NEXTAUTH_SECRET:**
   ```bash
   # Generate secret
   openssl rand -base64 32
   
   # Add to .env
   echo "NEXTAUTH_SECRET=your_generated_secret" >> .env
   ```

2. **Wrong NEXTAUTH_URL:**
   ```bash
   # Update in .env
   NEXTAUTH_URL=https://yourdomain.com
   
   # Restart application
   ./deploy.sh restart
   ```

3. **Session issues:**
   ```bash
   # Clear browser cookies
   # Or use incognito mode for testing
   ```

### User Registration Issues

**Symptoms:**
- "User already exists" errors
- Email validation failures
- Password requirements not met

**Solutions:**

1. **Check user in database:**
   ```bash
   docker-compose exec postgres psql -U postgres -d tye_all_in_one -c "SELECT * FROM users WHERE email='user@example.com';"
   ```

2. **Reset user password:**
   ```bash
   # Connect to database and update password hash
   # Or delete user and re-register
   ```

## Text-to-Speech Issues

### Google Cloud TTS Errors

**Symptoms:**
- "Authentication failed" errors
- "Quota exceeded" errors
- "Service unavailable" errors

**Diagnosis:**
```bash
# Check Google credentials
cat google-credentials.json | jq .project_id

# Test TTS endpoint
curl -X POST https://yourdomain.com/api/tts/voices
```

**Solutions:**

1. **Invalid credentials:**
   ```bash
   # Verify service account key
   # Download new key from Google Cloud Console
   # Replace google-credentials.json
   ```

2. **API not enabled:**
   ```bash
   # Enable Text-to-Speech API in Google Cloud Console
   # Check billing is enabled
   ```

3. **Quota exceeded:**
   ```bash
   # Check quota in Google Cloud Console
   # Upgrade billing plan if needed
   ```

## Performance Issues

### Slow Response Times

**Symptoms:**
- Pages load slowly
- API timeouts
- High CPU/memory usage

**Diagnosis:**
```bash
# Check resource usage
docker stats

# Check database performance
docker-compose exec postgres pg_stat_activity

# Test response times
curl -w "@curl-format.txt" -o /dev/null -s https://yourdomain.com/
```

**Solutions:**

1. **Database optimization:**
   ```bash
   # Add database indexes
   # Optimize queries
   # Enable connection pooling
   ```

2. **Application optimization:**
   ```bash
   # Enable caching
   # Optimize images
   # Use CDN
   ```

3. **Infrastructure scaling:**
   ```bash
   # Increase server resources
   # Add more application instances
   # Use load balancer
   ```

### Memory Issues

**Symptoms:**
- Out of memory errors
- Container restarts
- Slow performance

**Diagnosis:**
```bash
# Check memory usage
docker stats --no-stream

# Check application memory
docker-compose exec app node -e "console.log(process.memoryUsage())"
```

**Solutions:**

1. **Increase memory limits:**
   ```yaml
   # In docker-compose.yml
   services:
     app:
       deploy:
         resources:
           limits:
             memory: 2G
   ```

2. **Optimize application:**
   ```bash
   # Enable garbage collection
   # Optimize database queries
   # Reduce image sizes
   ```

## SSL/HTTPS Issues

### Certificate Errors

**Symptoms:**
- "Certificate not valid" errors
- "Connection not secure" warnings
- SSL handshake failures

**Diagnosis:**
```bash
# Check certificate
openssl x509 -in ssl/cert.pem -text -noout

# Test SSL
curl -I https://yourdomain.com

# Check certificate chain
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

**Solutions:**

1. **Expired certificate:**
   ```bash
   # Renew Let's Encrypt certificate
   sudo certbot renew
   
   # Copy new certificates
   sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
   sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem
   ```

2. **Wrong certificate:**
   ```bash
   # Verify certificate matches domain
   openssl x509 -in ssl/cert.pem -noout -subject
   ```

3. **Certificate chain issues:**
   ```bash
   # Use full certificate chain
   # Include intermediate certificates
   ```

## File Upload Issues

### Upload Failures

**Symptoms:**
- "File too large" errors
- "File type not allowed" errors
- Upload timeouts

**Diagnosis:**
```bash
# Check upload directory permissions
ls -la public/uploads/

# Check file size limits
grep MAX_FILE_SIZE .env

# Test upload endpoint
curl -X POST -F "file=@test.jpg" https://yourdomain.com/api/upload
```

**Solutions:**

1. **Permission issues:**
   ```bash
   # Fix permissions
   sudo chown -R $USER:$USER public/uploads/
   chmod -R 755 public/uploads/
   ```

2. **File size limits:**
   ```bash
   # Increase limits in .env
   MAX_FILE_SIZE=10485760
   
   # Update Nginx configuration
   client_max_body_size 10M;
   ```

3. **Storage space:**
   ```bash
   # Check disk space
   df -h
   
   # Clean up old files
   find public/uploads/ -type f -mtime +30 -delete
   ```

## Network Issues

### DNS Problems

**Symptoms:**
- Domain not resolving
- "Server not found" errors
- Intermittent connectivity

**Diagnosis:**
```bash
# Test DNS resolution
nslookup yourdomain.com
dig yourdomain.com

# Check DNS propagation
# Use online tools like whatsmydns.net
```

**Solutions:**

1. **Update DNS records:**
   ```bash
   # Add A record pointing to server IP
   # Add CNAME for www subdomain
   # Wait for propagation (up to 48 hours)
   ```

2. **Check firewall:**
   ```bash
   # Allow HTTP/HTTPS traffic
   sudo ufw allow 80
   sudo ufw allow 443
   ```

### Load Balancer Issues

**Symptoms:**
- Inconsistent responses
- Some requests fail
- Health check failures

**Solutions:**

1. **Check health endpoints:**
   ```bash
   # Ensure /api/health returns 200
   curl https://yourdomain.com/api/health
   ```

2. **Update load balancer configuration:**
   ```bash
   # Configure proper health checks
   # Set appropriate timeouts
   # Balance traffic correctly
   ```

## Monitoring and Logging

### Log Analysis

**Common log patterns to look for:**

```bash
# Error patterns
grep -i error logs/app.log

# Database connection issues
grep -i "connection" logs/app.log

# Authentication failures
grep -i "auth" logs/app.log

# Performance issues
grep -i "timeout\|slow" logs/app.log
```

### Setting Up Monitoring

```bash
# Install monitoring tools
# - Prometheus + Grafana
# - ELK Stack
# - Cloud monitoring services

# Set up alerts for:
# - High error rates
# - Slow response times
# - Resource usage
# - Service downtime
```

## Getting Help

### Before Asking for Help

1. Check this troubleshooting guide
2. Review application logs
3. Test with minimal configuration
4. Document error messages
5. Note recent changes

### Information to Include

When reporting issues, include:

- Error messages (full stack traces)
- Steps to reproduce
- Environment details (OS, Docker version)
- Configuration files (sanitized)
- Log excerpts
- Screenshots if applicable

### Support Channels

1. GitHub Issues (for bugs)
2. Documentation (for setup help)
3. Community forums
4. Stack Overflow (tag: tye-all-in-one)

## Prevention

### Regular Maintenance

```bash
# Weekly tasks
- Check logs for errors
- Monitor resource usage
- Update dependencies
- Backup database

# Monthly tasks
- Security updates
- Certificate renewal
- Performance review
- Capacity planning
```

### Best Practices

1. Monitor application health
2. Set up automated backups
3. Use staging environment
4. Test before deploying
5. Keep documentation updated
6. Monitor security advisories
7. Plan for scaling
8. Regular disaster recovery testing
