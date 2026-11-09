import { Link, useParams } from 'react-router-dom';
import { ScreenPlaceholder } from '@/components/ui/ScreenPlaceholder';

export function BuilderPage() {
  const { formId } = useParams();
  return (
    <div className="mx-auto max-w-3xl p-4">
      <Link className="text-sm text-primary underline" to="/forms">
        Back to Forms
      </Link>
      <div className="mt-4">
        <ScreenPlaceholder
          title="Form builder"
          description={`Palette, canvas and inspector for form "${formId ?? ''}" (Prompt 4).`}
          plannedDay="Day 04 to Day 07"
        />
      </div>
    </div>
  );
}
