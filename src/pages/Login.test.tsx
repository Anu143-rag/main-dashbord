/// <reference types="vitest" />
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Login } from './Login';
import { vi } from 'vitest';
import { describe, it, expect, beforeEach } from 'vitest';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual as any,
    useNavigate: () => mockNavigate,
  };
});

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    Storage.prototype.setItem = vi.fn();
  });

  it('renders login form with default values', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Voltava/i })).toBeInTheDocument();

    const emailInput = screen.getByLabelText(/Email Address/i);
    expect(emailInput).toHaveValue('superadmin@voltava.com');

    const passwordInput = screen.getByLabelText(/Password/i);
    expect(passwordInput).toHaveValue('password123');

    expect(screen.getByRole('button', { name: /Access Dashboard/i })).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    const mockToken = 'test-token';
    const mockUser = { id: 1, email: 'superadmin@voltava.com' };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: mockToken, user: mockUser }),
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const button = screen.getByRole('button', { name: /Access Dashboard/i });
    fireEvent.click(button);

    expect(button).toHaveTextContent(/Authenticating/i);
    expect(button).toBeDisabled();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'superadmin@voltava.com',
          password: 'password123',
        }),
      });
    });

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith('token', mockToken);
      expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('handles login error', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const button = screen.getByRole('button', { name: /Access Dashboard/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
    });

    expect(button).toHaveTextContent(/Access Dashboard/i);
    expect(button).not.toBeDisabled();
    expect(localStorage.setItem).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('updates input values', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);

    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'newpassword' } });

    expect(emailInput).toHaveValue('test@test.com');
    expect(passwordInput).toHaveValue('newpassword');
  });
});
