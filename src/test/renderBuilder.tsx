import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { BuilderPage } from '@/features/builder/pages/BuilderPage';

export function renderBuilder(formId = 'test-form') {
  return render(
    <MemoryRouter initialEntries={[`/forms/${formId}/edit`]}>
      <Routes>
        <Route path="/forms/:formId/edit" element={<BuilderPage />} />
      </Routes>
    </MemoryRouter>,
  );
}
