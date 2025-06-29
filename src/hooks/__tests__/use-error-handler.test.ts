import { renderHook } from '@testing-library/react'
import { useErrorHandler } from '../use-error-handler'

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
  },
}))

describe('useErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    console.error = jest.fn()
  })

  it('handles Error objects correctly', () => {
    const { result } = renderHook(() => useErrorHandler())
    const error = new Error('Test error message')
    
    const errorDetails = result.current.handleError(error)
    
    expect(errorDetails.message).toBe('Test error message')
    expect(errorDetails.details).toBe(error.stack)
  })

  it('handles string errors correctly', () => {
    const { result } = renderHook(() => useErrorHandler())
    
    const errorDetails = result.current.handleError('String error message')
    
    expect(errorDetails.message).toBe('String error message')
  })

  it('handles object errors correctly', () => {
    const { result } = renderHook(() => useErrorHandler())
    const errorObj = {
      message: 'Object error message',
      code: 'ERR_001',
      statusCode: 400,
    }
    
    const errorDetails = result.current.handleError(errorObj)
    
    expect(errorDetails.message).toBe('Object error message')
    expect(errorDetails.code).toBe('ERR_001')
    expect(errorDetails.statusCode).toBe(400)
  })

  it('uses fallback message for unknown error types', () => {
    const { result } = renderHook(() => useErrorHandler())
    
    const errorDetails = result.current.handleError(null, {
      fallbackMessage: 'Custom fallback',
    })
    
    expect(errorDetails.message).toBe('Custom fallback')
  })

  it('respects showToast option', () => {
    const { result } = renderHook(() => useErrorHandler())
    
    result.current.handleError('Test error', { showToast: false })
    
    const { toast } = require('sonner')
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('respects logError option', () => {
    const { result } = renderHook(() => useErrorHandler())
    
    result.current.handleError('Test error', { logError: false })
    
    expect(console.error).not.toHaveBeenCalled()
  })

  it('handles API errors correctly', async () => {
    const { result } = renderHook(() => useErrorHandler())
    
    const mockResponse = {
      status: 400,
      statusText: 'Bad Request',
      json: jest.fn().mockResolvedValue({
        message: 'API error message',
        details: { field: 'validation error' },
      }),
    } as any
    
    const errorDetails = await result.current.handleApiError(mockResponse)
    
    expect(errorDetails.message).toBe('API error message')
    expect(errorDetails.statusCode).toBe(400)
    expect(errorDetails.details).toEqual({ field: 'validation error' })
  })

  it('handles API errors with non-JSON response', async () => {
    const { result } = renderHook(() => useErrorHandler())
    
    const mockResponse = {
      status: 500,
      statusText: 'Internal Server Error',
      json: jest.fn().mockRejectedValue(new Error('Not JSON')),
    } as any
    
    const errorDetails = await result.current.handleApiError(mockResponse)
    
    expect(errorDetails.message).toBe('Internal Server Error')
    expect(errorDetails.statusCode).toBe(500)
  })

  it('wraps async functions correctly', async () => {
    const { result } = renderHook(() => useErrorHandler())
    
    const asyncFn = jest.fn().mockRejectedValue(new Error('Async error'))
    const wrappedFn = result.current.handleAsyncError(asyncFn)
    
    const resultValue = await wrappedFn()
    
    expect(resultValue).toBeNull()
    expect(asyncFn).toHaveBeenCalled()
  })

  it('returns result from successful async function', async () => {
    const { result } = renderHook(() => useErrorHandler())
    
    const asyncFn = jest.fn().mockResolvedValue('success')
    const wrappedFn = result.current.handleAsyncError(asyncFn)
    
    const resultValue = await wrappedFn()
    
    expect(resultValue).toBe('success')
  })
})
