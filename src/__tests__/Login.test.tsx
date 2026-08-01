import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Login } from '../pages/Login';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

// Mock useNavigate from react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Login Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
    Storage.prototype.setItem = vi.fn();
  });

  it('renders login form with default credentials', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    expect(screen.getByText('Voltava')).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toHaveValue('superadmin@voltava.com');
    expect(screen.getByLabelText(/Password/i)).toHaveValue('password123');
    expect(screen.getByRole('button', { name: /Access Dashboard/i })).toBeInTheDocument();
  });

  it('handles successful authentication flow', async () => {
    const mockResponse = {
      token: 'fake-jwt-token',
      user: { id: 1, email: 'superadmin@voltava.com' },
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitButton = screen.getByRole('button', { name: /Access Dashboard/i });

    // Clear default values and enter new ones (optional, since default is already there, but good practice)
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.clear(passwordInput);
    await userEvent.type(passwordInput, 'testpassword');

    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent(/Authenticating.../i);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'testpassword' }),
      });
      expect(localStorage.setItem).toHaveBeenCalledWith('token', 'fake-jwt-token');
      expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockResponse.user));
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('displays error message when invalid credentials are provided (401)', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const submitButton = screen.getByRole('button', { name: /Access Dashboard/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    // Ensure button is re-enabled
    expect(submitButton).not.toBeDisabled();
    expect(submitButton).toHaveTextContent(/Access Dashboard/i);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('handles network errors/API server down scenario gracefully', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Failed to fetch'));

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const submitButton = screen.getByRole('button', { name: /Access Dashboard/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    });

    expect(submitButton).not.toBeDisabled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
