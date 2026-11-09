import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="mx-auto max-w-md p-8 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-muted">This page does not exist.</p>
      <Link className="mt-4 inline-block text-primary underline" to="/forms">
        Go to your forms
      </Link>
    </main>
  );
}
