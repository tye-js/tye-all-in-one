import { createMocks } from 'node-mocks-http'
import { GET } from '@/app/api/health/route'

// Mock the database
jest.mock('@/lib/db', () => ({
  db: {
    execute: jest.fn(),
  },
}))

describe('/api/health', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset environment variables
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
    process.env.NEXTAUTH_SECRET = 'test-secret'
    process.env.NEXTAUTH_URL = 'http://localhost:3000'
  })

  it('returns healthy status when all checks pass', async () => {
    const { db } = require('@/lib/db')
    db.execute.mockResolvedValue([])

    const { req } = createMocks({ method: 'GET' })
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('healthy')
    expect(data.checks.database.status).toBe('healthy')
    expect(data.checks.environment.status).toBe('healthy')
    expect(data.timestamp).toBeDefined()
    expect(data.uptime).toBeDefined()
    expect(data.responseTime).toBeDefined()
  })

  it('returns warning status when environment variables are missing', async () => {
    const { db } = require('@/lib/db')
    db.execute.mockResolvedValue([])
    
    // Remove required environment variable
    delete process.env.NEXTAUTH_SECRET

    const { req } = createMocks({ method: 'GET' })
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(207) // Multi-Status for warnings
    expect(data.status).toBe('warning')
    expect(data.checks.environment.status).toBe('warning')
    expect(data.checks.environment.missingVars).toContain('NEXTAUTH_SECRET')
  })

  it('returns unhealthy status when database check fails', async () => {
    const { db } = require('@/lib/db')
    db.execute.mockRejectedValue(new Error('Database connection failed'))

    const { req } = createMocks({ method: 'GET' })
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data.status).toBe('unhealthy')
    expect(data.checks.database.status).toBe('unhealthy')
    expect(data.error).toBe('Database connection failed')
  })

  it('includes memory usage information', async () => {
    const { db } = require('@/lib/db')
    db.execute.mockResolvedValue([])

    const { req } = createMocks({ method: 'GET' })
    const response = await GET(req)
    const data = await response.json()

    expect(data.checks.memory).toBeDefined()
    expect(data.checks.memory.used).toBeGreaterThan(0)
    expect(data.checks.memory.total).toBeGreaterThan(0)
    expect(data.checks.memory.external).toBeGreaterThanOrEqual(0)
  })

  it('includes version and environment information', async () => {
    const { db } = require('@/lib/db')
    db.execute.mockResolvedValue([])

    const { req } = createMocks({ method: 'GET' })
    const response = await GET(req)
    const data = await response.json()

    expect(data.version).toBeDefined()
    expect(data.environment).toBeDefined()
  })
})
