import { render, screen } from '@testing-library/react';
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

/** All live-region text (our announcer + dnd-kit's own), so tests do not depend on which one spoke. */
export function liveText() {
  return screen
    .getAllByRole('status')
    .map((el) => el.textContent ?? '')
    .join(' ');
}
