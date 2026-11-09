import { Link } from 'react-router-dom';
import { ScreenPlaceholder } from '@/components/ui/ScreenPlaceholder';

export function FormsDashboardPage() {
  return (
    <ScreenPlaceholder
      title="Your forms"
      description="Forms dashboard: list, create, rename, delete (Prompt 3)."
      plannedDay="Day 12 (forms API) + dashboard UI"
    >
      <p className="mt-4 text-sm">
        Route check:{' '}
        <Link className="text-primary underline" to="/forms/demo-id/edit">
          open builder placeholder
        </Link>
      </p>
    </ScreenPlaceholder>
  );
}
