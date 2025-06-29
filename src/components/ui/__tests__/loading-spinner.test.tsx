import { render, screen } from '@testing-library/react'
import LoadingSpinner from '../loading-spinner'

describe('LoadingSpinner Component', () => {
  it('renders correctly with default props', () => {
    render(<LoadingSpinner />)
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument()
  })

  it('displays text when provided', () => {
    render(<LoadingSpinner text="Loading data..." />)
    expect(screen.getByText('Loading data...')).toBeInTheDocument()
  })

  it('applies correct size classes', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />)
    expect(document.querySelector('.w-4')).toBeInTheDocument()

    rerender(<LoadingSpinner size="lg" />)
    expect(document.querySelector('.w-8')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<LoadingSpinner className="custom-class" />)
    expect(document.querySelector('.custom-class')).toBeInTheDocument()
  })

  it('has spinning animation', () => {
    render(<LoadingSpinner />)
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })
})
