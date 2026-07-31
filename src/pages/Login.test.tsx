import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Login } from './Login';
import { vi } from 'vitest';

describe('Login', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('displays error message on login failure', async () => {
    // Mock fetch to return a failed response
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Invalid credentials' }),
    } as any);

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const user = userEvent.setup();

    // The default values are already in the form, so we can just submit
    const submitButton = screen.getByRole('button', { name: /Access Dashboard/i });
    await user.click(submitButton);

    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({
      method: 'POST',
    }));
  });
});
