import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { routes } from './routes';

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}

describe('route skeleton', () => {
  it('redirects / to the forms dashboard', () => {
    const router = renderAt('/');
    expect(router.state.location.pathname).toBe('/forms');
    expect(screen.getByRole('heading', { name: 'Your forms' })).toBeInTheDocument();
  });

  it('renders the login placeholder', () => {
    renderAt('/login');
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('renders the builder with the form id from the URL', () => {
    renderAt('/forms/abc123/edit');
    expect(screen.getByRole('heading', { name: 'Form builder' })).toBeInTheDocument();
    expect(screen.getByText(/abc123/)).toBeInTheDocument();
  });

  it('renders the public form route without app navigation', () => {
    renderAt('/f/contact-us');
    expect(screen.getByRole('heading', { name: 'Public form' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Main' })).not.toBeInTheDocument();
  });

  it('shows the app navigation on dashboard routes', () => {
    renderAt('/forms');
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
  });

  it('renders not found for unknown paths', () => {
    renderAt('/does-not-exist');
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });
});
