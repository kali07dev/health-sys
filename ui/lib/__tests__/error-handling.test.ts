// lib/__tests__/error-handling.test.ts

import { getErrorContext, ErrorType } from '../error-handling'

describe('Error Handling System', () => {
  test('should return correct context for known error codes', () => {
    const context = getErrorContext('VALIDATION_ERROR')
    
    expect(context.type).toBe(ErrorType.USER_INPUT)
    expect(context.title).toBe('Please check your input')
    expect(context.suggestedAction).toContain('Check required fields')
  })

  test('should handle authentication errors', () => {
    const context = getErrorContext('AUTH_EXPIRED')
    
    expect(context.type).toBe(ErrorType.AUTH_ERROR)
    expect(context.title).toBe('Session expired')
    expect(context.suggestedAction).toContain('sign in again')
  })

  test('should infer error type from message patterns', () => {
    const context = getErrorContext(undefined, 'Network connection failed')
    
    expect(context.type).toBe(ErrorType.USER_ACTIONABLE)
    expect(context.title).toBe('Connection issue')
    expect(context.retryable).toBe(true)
  })

  test('should handle custom messages with known error codes', () => {
    const context = getErrorContext('VALIDATION_ERROR', 'Custom validation message')
    
    expect(context.type).toBe(ErrorType.USER_INPUT)
    expect(context.message).toBe('Custom validation message')
    expect(context.title).toBe('Please check your input')
  })

  test('should fall back to default error for unknown cases', () => {
    const context = getErrorContext('UNKNOWN_CODE', 'Some random error')
    
    expect(context.type).toBe(ErrorType.SYSTEM_ERROR)
    expect(context.message).toBe('Some random error')
    expect(context.title).toBe('Something went wrong')
  })
})