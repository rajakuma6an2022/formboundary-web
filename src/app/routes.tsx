import { Navigate } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { AppShell } from './AppShell';
import { CenteredLayout } from './CenteredLayout';
import { NotFoundPage } from './NotFoundPage';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { FormsDashboardPage } from '@/features/forms/pages/FormsDashboardPage';
import { BuilderPage } from '@/features/builder/pages/BuilderPage';
import { SubmissionsPage } from '@/features/submissions/pages/SubmissionsPage';
import { PublicFormPage } from '@/features/public-form/pages/PublicFormPage';

// Route guards (redirect to /login when signed out) are added on Day 13. Not faked here.
export const routes: RouteObject[] = [
  { path: '/', element: <Navigate to="/forms" replace /> },
  {
    element: <CenteredLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/f/:slug', element: <PublicFormPage /> },
    ],
  },
  {
    element: <AppShell />,
    children: [
      { path: '/forms', element: <FormsDashboardPage /> },
      { path: '/forms/:formId/submissions', element: <SubmissionsPage /> },
    ],
  },
  { path: '/forms/:formId/edit', element: <BuilderPage /> },
  { path: '*', element: <NotFoundPage /> },
];
