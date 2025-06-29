# TYE All-in-One

A comprehensive web application built with Next.js that combines information sharing, text-to-speech conversion, and content management capabilities.

## Features

- 📝 **Article Management**: Create, edit, and publish articles with rich markdown support
- 🔊 **Text-to-Speech**: Convert text to natural-sounding speech with multiple language support
- 👥 **User Management**: Role-based authentication and user administration
- 🏷️ **Content Organization**: Categories and tags for organizing content
- 📱 **Responsive Design**: Mobile-friendly interface with modern UI components
- 🔒 **Security**: Comprehensive authentication, authorization, and security measures
- 🐳 **Docker Ready**: Complete Docker setup for easy deployment

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes, NextAuth.js
- **Database**: PostgreSQL with Drizzle ORM
- **UI Components**: shadcn/ui, Radix UI
- **Text-to-Speech**: Google Cloud Text-to-Speech API
- **Deployment**: Docker, Docker Compose, Nginx

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Google Cloud account (for TTS functionality)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd tye-all-in-one
```

### 2. Initialize the Project

```bash
./deploy.sh init
```

This will:
- Create necessary directories
- Generate SSL certificates
- Create configuration files

### 3. Configure Environment

1. Update `.env` file with your configuration:
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

2. Add your Google Cloud service account key:
   ```bash
   # Replace google-credentials.json with your actual service account key
   ```

### 4. Deploy

```bash
./deploy.sh deploy
```

This will:
- Build the Docker images
- Start all services
- Run database migrations
- Seed initial data

### 5. Access the Application

- **Main Site**: https://localhost
- **Admin Panel**: https://localhost/admin
- **API Health**: https://localhost/api/health

Default admin credentials:
- Email: admin@example.com
- Password: admin123

## Documentation

- [API Documentation](API.md) - Complete API reference
- [Deployment Guide](DEPLOYMENT.md) - Production deployment instructions
- [Testing Guide](TESTING.md) - Testing strategy and procedures
- [Troubleshooting Guide](TROUBLESHOOTING.md) - Common issues and solutions

## Project Structure

```
tye-all-in-one/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes
│   │   ├── admin/             # Admin panel pages
│   │   ├── auth/              # Authentication pages
│   │   └── ...                # Other pages
│   ├── components/            # React components
│   │   ├── ui/                # UI components
│   │   └── layout/            # Layout components
│   ├── lib/                   # Utility libraries
│   │   ├── db/                # Database configuration
│   │   └── ...                # Other utilities
│   └── hooks/                 # Custom React hooks
├── tests/                     # Test files
│   ├── e2e/                   # End-to-end tests
│   └── api/                   # API integration tests
├── public/                    # Static assets
├── docker-compose.yml         # Docker services
├── Dockerfile                 # Application container
├── deploy.sh                  # Deployment script
└── ...                        # Configuration files
```
