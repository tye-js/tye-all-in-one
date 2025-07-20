# Testing Guide

This document outlines the testing strategy and procedures for the TYE All-in-One application.

## Testing Strategy

Our testing approach follows the testing pyramid:

1. **Unit Tests** (70%) - Fast, isolated tests for individual components and functions
2. **Integration Tests** (20%) - Tests for API endpoints and component interactions
3. **End-to-End Tests** (10%) - Full user journey tests

## Test Types

### Unit Tests

Unit tests are located in `__tests__` directories next to the code they test.

**Running Unit Tests:**
```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI
npm run test:ci
```

**Writing Unit Tests:**
- Use Jest and React Testing Library
- Test components in isolation
- Mock external dependencies
- Focus on behavior, not implementation

Example:
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../button'

describe('Button Component', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })
})
```

### Integration Tests

Integration tests are located in the `tests/api` directory.

**Running Integration Tests:**
```bash
# Integration tests are included in the main test suite
npm run test
```

**Writing Integration Tests:**
- Test API endpoints with mocked dependencies
- Test component interactions
- Use `node-mocks-http` for API testing

Example:
```typescript
import { createMocks } from 'node-mocks-http'
import { GET } from '@/app/api/health/route'

describe('/api/health', () => {
  it('returns healthy status', async () => {
    const { req } = createMocks({ method: 'GET' })
    const response = await GET(req)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.status).toBe('healthy')
  })
})
```

### End-to-End Tests

E2E tests are located in the `tests/e2e` directory and use Playwright.

**Running E2E Tests:**
```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode
npm run test:e2e:headed
```

**Writing E2E Tests:**
- Test complete user workflows
- Test across different browsers
- Test responsive design

Example:
```typescript
import { test, expect } from '@playwright/test'

test('should load the home page', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'TYE All-in-One' })).toBeVisible()
})
```

## Test Coverage

We aim for:
- **Unit Tests**: 80% code coverage
- **Integration Tests**: All API endpoints covered
- **E2E Tests**: All critical user journeys covered

**Checking Coverage:**
```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory.

## Testing Best Practices

### General Guidelines

1. **Write tests first** (TDD approach when possible)
2. **Test behavior, not implementation**
3. **Keep tests simple and focused**
4. **Use descriptive test names**
5. **Arrange, Act, Assert pattern**

### Component Testing

1. **Test user interactions**
2. **Test different props and states**
3. **Test accessibility**
4. **Mock external dependencies**

### API Testing

1. **Test all HTTP methods**
2. **Test error scenarios**
3. **Test authentication and authorization**
4. **Test input validation**

### E2E Testing

1. **Test critical user paths**
2. **Test across different devices**
3. **Test error handling**
4. **Keep tests independent**

## Continuous Integration

Tests run automatically on:
- Every push to main/develop branches
- Every pull request
- Before deployment

**CI Pipeline:**
1. Unit and integration tests
2. Type checking
3. Linting
4. Build verification
5. E2E tests
6. Security scanning

## Manual Testing Checklist

### Before Release

- [ ] All automated tests pass
- [ ] Manual smoke testing on staging
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Mobile responsiveness testing
- [ ] Accessibility testing
- [ ] Performance testing
- [ ] Security testing

### Feature Testing

When adding new features:

- [ ] Unit tests for new components/functions
- [ ] Integration tests for new API endpoints
- [ ] E2E tests for new user workflows
- [ ] Update existing tests if needed
- [ ] Test error scenarios
- [ ] Test edge cases

### Bug Fix Testing

When fixing bugs:

- [ ] Write test that reproduces the bug
- [ ] Fix the bug
- [ ] Verify test passes
- [ ] Add regression tests
- [ ] Test related functionality

## Test Data Management

### Test Database

- Use separate test database
- Reset database state between tests
- Use factories for test data creation
- Mock external services

### Test Users

Create test users with different roles:
- Regular user
- Admin user
- User with no permissions

## Performance Testing

### Load Testing

Use tools like:
- Artillery
- k6
- Apache Bench

Test scenarios:
- Normal load
- Peak load
- Stress testing
- Spike testing

### Monitoring

Monitor in production:
- Response times
- Error rates
- Database performance
- Memory usage

## Security Testing

### Automated Security Testing

- Dependency vulnerability scanning
- Static code analysis
- OWASP ZAP scanning

### Manual Security Testing

- Authentication testing
- Authorization testing
- Input validation testing
- SQL injection testing
- XSS testing
- CSRF testing

## Accessibility Testing

### Automated Testing

- axe-core integration
- Lighthouse accessibility audit

### Manual Testing

- Keyboard navigation
- Screen reader testing
- Color contrast verification
- Focus management

## Debugging Tests

### Common Issues

1. **Flaky tests**: Use proper waits, avoid hardcoded delays
2. **Slow tests**: Mock heavy operations, optimize queries
3. **Test isolation**: Clean up after tests, avoid shared state

### Debugging Tools

- Jest debugger
- Playwright trace viewer
- Browser dev tools
- Test logs and screenshots

## Test Maintenance

### Regular Tasks

- Update test dependencies
- Remove obsolete tests
- Refactor test code
- Update test documentation

### Code Reviews

Include in test reviews:
- Test coverage
- Test quality
- Test maintainability
- Performance impact

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
