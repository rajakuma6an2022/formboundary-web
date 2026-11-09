import { Outlet } from 'react-router-dom';

/** For screens without app chrome: login and public form. */
export function CenteredLayout() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center justify-center p-4">
      <div className="w-full">
        <Outlet />
      </div>
    </main>
  );
}
