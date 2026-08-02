import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Devices } from './Devices'

// Mock the lucide-react icons so they don't cause issues
vi.mock('lucide-react', () => ({
  Cpu: () => <div data-testid="cpu-icon" />,
  Search: () => <div data-testid="search-icon" />,
  Filter: () => <div data-testid="filter-icon" />,
  MoreVertical: () => <div data-testid="more-vertical-icon" />,
  Plus: () => <div data-testid="plus-icon" />
}))

describe('Devices Component', () => {
  beforeEach(() => {
    // Setup fetch mock
    global.fetch = vi.fn()

    // Setup localStorage mock
    const localStorageMock = {
      getItem: vi.fn(() => 'fake-token'),
      setItem: vi.fn(),
      clear: vi.fn()
    }
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    })

    // Silence console.error for expected errors
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('handles array responses correctly', async () => {
    const mockDevices = [
      { id: '1', deviceId: 'DEV001', serialNumber: 'SN001', status: 'ONLINE', school: { name: 'School 1' } },
      { id: '2', deviceId: 'DEV002', serialNumber: 'SN002', status: 'OFFLINE', school: { name: 'School 2' } }
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDevices
    })

    render(<Devices />)

    // Initial loading state
    expect(screen.getByText('Loading devices...')).toBeInTheDocument()

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('DEV001')).toBeInTheDocument()
      expect(screen.getByText('DEV002')).toBeInTheDocument()
    })

    // Check if fetch was called correctly
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/devices?page=1&limit=50&search=',
      expect.objectContaining({
        headers: { 'Authorization': 'Bearer fake-token' }
      })
    )
    expect(screen.getAllByText('2', { exact: false })[0]).toBeInTheDocument()
    expect(screen.getByText('50% ACTIVE')).toBeInTheDocument()

    // Stats calculation based on mock data


  })

  it('handles paginated object responses correctly', async () => {
    const mockResponse = {
      data: [
        { id: '3', deviceId: 'DEV003', status: 'ONLINE', school: { name: 'School 3' } }
      ],
      total: 100
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    })

    render(<Devices />)

    await waitFor(() => {
      expect(screen.getByText('DEV003')).toBeInTheDocument()
    })

    expect(screen.getByText('Showing page 1 of 2')).toBeInTheDocument()
  })

  it('handles empty responses correctly', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => []
    })

    render(<Devices />)

    await waitFor(() => {
      expect(screen.getByText('No devices found.')).toBeInTheDocument()
    })
  })

  it('handles fetch errors correctly', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

    render(<Devices />)

    await waitFor(() => {
      expect(screen.getByText('No devices found.')).toBeInTheDocument()
    })

    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith('Error fetching devices', expect.any(Error))
  })
})
