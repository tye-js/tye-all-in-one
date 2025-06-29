# API Documentation

This document provides comprehensive documentation for the TYE All-in-One API endpoints.

## Base URL

```
Production: https://yourdomain.com/api
Development: http://localhost:3000/api
```

## Authentication

The API uses NextAuth.js for authentication. Most endpoints require authentication via session cookies.

### Authentication Endpoints

#### Sign In
```http
POST /api/auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Sign Up
```http
POST /api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

#### Sign Out
```http
POST /api/auth/signout
```

## Articles API

### List Articles
```http
GET /api/articles?page=1&limit=10&status=published&category=general&q=search
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 50)
- `status` (optional): Article status (`published`, `draft`, `archived`)
- `category` (optional): Category filter (`server_deals`, `ai_tools`, `general`)
- `q` (optional): Search query
- `sortBy` (optional): Sort field (`publishedAt`, `title`, `viewCount`)
- `sortOrder` (optional): Sort order (`asc`, `desc`)

**Response:**
```json
{
  "articles": [
    {
      "id": "uuid",
      "title": "Article Title",
      "slug": "article-slug",
      "excerpt": "Article excerpt...",
      "featuredImage": "/uploads/image.jpg",
      "status": "published",
      "category": "general",
      "publishedAt": "2023-12-01T10:00:00Z",
      "viewCount": 150,
      "createdAt": "2023-12-01T09:00:00Z",
      "updatedAt": "2023-12-01T10:00:00Z",
      "author": {
        "id": "uuid",
        "name": "Author Name",
        "email": "author@example.com",
        "avatar": "/uploads/avatar.jpg"
      },
      "categoryInfo": {
        "id": "uuid",
        "name": "General",
        "slug": "general",
        "color": "#3B82F6"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Get Article
```http
GET /api/articles/{slug}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Article Title",
  "slug": "article-slug",
  "excerpt": "Article excerpt...",
  "content": "Full article content in markdown...",
  "featuredImage": "/uploads/image.jpg",
  "status": "published",
  "category": "general",
  "publishedAt": "2023-12-01T10:00:00Z",
  "viewCount": 150,
  "metadata": {},
  "createdAt": "2023-12-01T09:00:00Z",
  "updatedAt": "2023-12-01T10:00:00Z",
  "author": {
    "id": "uuid",
    "name": "Author Name",
    "email": "author@example.com",
    "avatar": "/uploads/avatar.jpg"
  },
  "categoryInfo": {
    "id": "uuid",
    "name": "General",
    "slug": "general",
    "color": "#3B82F6"
  },
  "tags": [
    {
      "id": "uuid",
      "name": "Tag Name",
      "slug": "tag-slug"
    }
  ]
}
```

### Create Article
```http
POST /api/articles
Authorization: Required (Admin/Author)
Content-Type: application/json

{
  "title": "New Article",
  "slug": "new-article",
  "excerpt": "Article excerpt...",
  "content": "Article content in markdown...",
  "featuredImage": "/uploads/image.jpg",
  "status": "draft",
  "category": "general",
  "categoryId": "uuid",
  "tags": ["tag1", "tag2"]
}
```

### Update Article
```http
PUT /api/articles/{slug}
Authorization: Required (Admin/Author)
Content-Type: application/json

{
  "title": "Updated Article",
  "excerpt": "Updated excerpt...",
  "content": "Updated content...",
  "status": "published"
}
```

### Delete Article
```http
DELETE /api/articles/{slug}
Authorization: Required (Admin/Author)
```

## Text-to-Speech API

### Synthesize Speech
```http
POST /api/tts/synthesize
Authorization: Required
Content-Type: application/json

{
  "text": "Text to convert to speech",
  "language": "en-US",
  "voice": "en-US-Standard-A",
  "speakingRate": 1.0,
  "pitch": 0.0
}
```

**Response:**
```json
{
  "id": "uuid",
  "audioUrl": "/uploads/tts/audio.mp3",
  "fileSize": 1024000,
  "duration": 30,
  "status": "completed"
}
```

### Get Available Voices
```http
GET /api/tts/voices
```

**Response:**
```json
{
  "languages": [
    {
      "code": "en-US",
      "name": "English (US)",
      "voices": [
        "en-US-Standard-A",
        "en-US-Standard-B",
        "en-US-Wavenet-A"
      ]
    }
  ]
}
```

### Get TTS History
```http
GET /api/tts/synthesize?page=1&limit=10
Authorization: Required
```

### Delete TTS Request
```http
DELETE /api/tts/requests/{id}
Authorization: Required
```

## Categories API

### List Categories
```http
GET /api/categories?includeCount=true
```

**Response:**
```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "General",
      "slug": "general",
      "description": "General articles",
      "color": "#3B82F6",
      "createdAt": "2023-12-01T09:00:00Z",
      "updatedAt": "2023-12-01T09:00:00Z",
      "articleCount": 25
    }
  ]
}
```

### Create Category
```http
POST /api/categories
Authorization: Required (Admin)
Content-Type: application/json

{
  "name": "New Category",
  "slug": "new-category",
  "description": "Category description",
  "color": "#3B82F6"
}
```

## Tags API

### List Tags
```http
GET /api/tags?search=query&includeCount=true&limit=50
```

### Create Tag
```http
POST /api/tags
Authorization: Required (Admin)
Content-Type: application/json

{
  "name": "New Tag",
  "slug": "new-tag"
}
```

## Search API

### Search Content
```http
GET /api/search?q=query&category=general&status=published&page=1&limit=10
```

**Response:**
```json
{
  "query": "search query",
  "results": [
    {
      "id": "uuid",
      "title": "Article Title",
      "slug": "article-slug",
      "excerpt": "Article excerpt...",
      "category": "general",
      "publishedAt": "2023-12-01T10:00:00Z"
    }
  ],
  "relatedTags": [
    {
      "id": "uuid",
      "name": "Related Tag",
      "slug": "related-tag",
      "count": 5
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  },
  "suggestions": {
    "categories": ["server_deals", "ai_tools"],
    "tags": ["related", "tags"]
  }
}
```

## File Upload API

### Upload File
```http
POST /api/upload
Authorization: Required
Content-Type: multipart/form-data

file: [binary data]
```

**Response:**
```json
{
  "id": "uuid",
  "url": "/uploads/images/filename.jpg",
  "filename": "unique-filename.jpg",
  "originalName": "original-name.jpg",
  "size": 1024000,
  "mimeType": "image/jpeg"
}
```

## Admin API

### Get Dashboard Stats
```http
GET /api/admin/stats
Authorization: Required (Admin)
```

**Response:**
```json
{
  "totalArticles": 100,
  "publishedArticles": 80,
  "draftArticles": 20,
  "totalUsers": 50,
  "totalTTSRequests": 500,
  "totalViews": 10000
}
```

### Get Recent Activity
```http
GET /api/admin/activity
Authorization: Required (Admin)
```

## Health Check API

### Health Status
```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2023-12-01T10:00:00Z",
  "uptime": 3600,
  "responseTime": 50,
  "version": "1.0.0",
  "environment": "production",
  "checks": {
    "database": {
      "status": "healthy",
      "responseTime": 10
    },
    "environment": {
      "status": "healthy",
      "missingVars": []
    },
    "memory": {
      "used": 128,
      "total": 512,
      "external": 64
    }
  }
}
```

## Error Responses

All API endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  }
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `429` - Rate Limited
- `500` - Internal Server Error

## Rate Limiting

API endpoints are rate limited:
- General API: 100 requests per 15 minutes
- Authentication: 5 requests per minute
- File Upload: 10 requests per minute

Rate limit headers are included in responses:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

## Pagination

List endpoints support pagination with consistent parameters:
- `page`: Page number (1-based)
- `limit`: Items per page (max 50)

Pagination info is included in responses:
```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```
