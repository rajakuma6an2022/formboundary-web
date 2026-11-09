import { useParams } from 'react-router-dom';
import { ScreenPlaceholder } from '@/components/ui/ScreenPlaceholder';

export function SubmissionsPage() {
  const { formId } = useParams();
  return (
    <ScreenPlaceholder
      title="Submissions"
      description={`Owner-only submissions list for form "${formId ?? ''}" (Prompt 10).`}
      plannedDay="Day 15"
    />
  );
}
