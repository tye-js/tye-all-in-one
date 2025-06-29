#!/bin/bash

# TYE All-in-One Deployment Script
# This script helps deploy the application using Docker Compose

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p uploads
    mkdir -p ssl
    mkdir -p logs
    
    print_success "Directories created"
}

# Function to generate SSL certificates (self-signed for development)
generate_ssl_certs() {
    if [ ! -f "ssl/cert.pem" ] || [ ! -f "ssl/key.pem" ]; then
        print_status "Generating self-signed SSL certificates..."
        
        openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
        
        print_success "SSL certificates generated"
    else
        print_status "SSL certificates already exist"
    fi
}

# Function to create .env file if it doesn't exist
create_env_file() {
    if [ ! -f ".env" ]; then
        print_status "Creating .env file..."
        
        cat > .env << EOF
# Database
POSTGRES_PASSWORD=postgres123

# NextAuth.js
NEXTAUTH_URL=https://localhost
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Google Cloud (replace with your values)
GOOGLE_CLOUD_PROJECT_ID=your-project-id

# Admin Configuration
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123

# Application Settings
APP_NAME=TYE All-in-One
APP_DESCRIPTION=Comprehensive web application with information sharing, TTS utility, and content management
EOF
        
        print_success ".env file created"
        print_warning "Please update the .env file with your actual configuration values"
    else
        print_status ".env file already exists"
    fi
}

# Function to create Google credentials file placeholder
create_google_credentials() {
    if [ ! -f "google-credentials.json" ]; then
        print_status "Creating Google credentials placeholder..."
        
        cat > google-credentials.json << EOF
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "your-private-key-id",
  "private_key": "your-private-key",
  "client_email": "your-service-account@your-project.iam.gserviceaccount.com",
  "client_id": "your-client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project.iam.gserviceaccount.com"
}
EOF
        
        print_success "Google credentials placeholder created"
        print_warning "Please replace google-credentials.json with your actual Google Cloud service account key"
    else
        print_status "Google credentials file already exists"
    fi
}

# Function to build and start services
deploy() {
    print_status "Building and starting services..."
    
    # Build the application
    docker-compose build --no-cache
    
    # Start services
    docker-compose up -d
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 30
    
    # Run database migrations
    print_status "Running database migrations..."
    docker-compose exec app npm run db:push
    
    # Seed the database
    print_status "Seeding database..."
    docker-compose exec app npm run db:seed
    
    print_success "Deployment completed successfully!"
}

# Function to show status
show_status() {
    print_status "Service status:"
    docker-compose ps
    
    echo ""
    print_status "Application URLs:"
    echo "  - HTTP:  http://localhost"
    echo "  - HTTPS: https://localhost"
    echo "  - Admin: https://localhost/admin"
    
    echo ""
    print_status "Database connection:"
    echo "  - Host: localhost"
    echo "  - Port: 5432"
    echo "  - Database: tye_all_in_one"
    echo "  - Username: postgres"
}

# Function to stop services
stop() {
    print_status "Stopping services..."
    docker-compose down
    print_success "Services stopped"
}

# Function to clean up
cleanup() {
    print_status "Cleaning up..."
    docker-compose down -v --remove-orphans
    docker system prune -f
    print_success "Cleanup completed"
}

# Function to show logs
logs() {
    if [ -n "$1" ]; then
        docker-compose logs -f "$1"
    else
        docker-compose logs -f
    fi
}

# Function to backup database
backup() {
    print_status "Creating database backup..."
    
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    docker-compose exec postgres pg_dump -U postgres tye_all_in_one > "$BACKUP_FILE"
    
    print_success "Database backup created: $BACKUP_FILE"
}

# Function to restore database
restore() {
    if [ -z "$1" ]; then
        print_error "Please provide backup file path"
        exit 1
    fi
    
    print_status "Restoring database from $1..."
    docker-compose exec -T postgres psql -U postgres tye_all_in_one < "$1"
    print_success "Database restored successfully"
}

# Main script logic
case "$1" in
    "init")
        check_prerequisites
        create_directories
        generate_ssl_certs
        create_env_file
        create_google_credentials
        print_success "Initialization completed"
        print_warning "Please update .env and google-credentials.json files before deploying"
        ;;
    "deploy")
        check_prerequisites
        deploy
        show_status
        ;;
    "start")
        docker-compose up -d
        show_status
        ;;
    "stop")
        stop
        ;;
    "restart")
        stop
        sleep 5
        docker-compose up -d
        show_status
        ;;
    "status")
        show_status
        ;;
    "logs")
        logs "$2"
        ;;
    "backup")
        backup
        ;;
    "restore")
        restore "$2"
        ;;
    "cleanup")
        cleanup
        ;;
    *)
        echo "Usage: $0 {init|deploy|start|stop|restart|status|logs [service]|backup|restore [file]|cleanup}"
        echo ""
        echo "Commands:"
        echo "  init     - Initialize the project (create directories, SSL certs, config files)"
        echo "  deploy   - Build and deploy the application"
        echo "  start    - Start the services"
        echo "  stop     - Stop the services"
        echo "  restart  - Restart the services"
        echo "  status   - Show service status and URLs"
        echo "  logs     - Show logs (optionally for specific service)"
        echo "  backup   - Create database backup"
        echo "  restore  - Restore database from backup file"
        echo "  cleanup  - Stop services and clean up Docker resources"
        exit 1
        ;;
esac
