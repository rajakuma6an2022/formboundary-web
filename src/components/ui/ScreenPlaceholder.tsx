import type { ReactNode } from 'react';

type Props = {
  title: string;
  description: string;
  plannedDay: string;
  children?: ReactNode;
};

/** Route skeleton only. Real screens replace these on the day shown in `plannedDay`. */
export function ScreenPlaceholder({ title, description, plannedDay, children }: Props) {
  return (
    <section className="rounded-card border border-line bg-surface p-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-muted">{description}</p>
      <p className="mt-4 inline-block rounded-control bg-page px-2 py-1 text-xs text-muted">
        Planned: {plannedDay}
      </p>
      {children}
    </section>
  );
}
