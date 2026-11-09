import { useParams } from 'react-router-dom';
import { ScreenPlaceholder } from '@/components/ui/ScreenPlaceholder';

export function PublicFormPage() {
  const { slug } = useParams();
  return (
    <ScreenPlaceholder
      title="Public form"
      description={`Published form "${slug ?? ''}" renders here (Prompt 9).`}
      plannedDay="Day 15"
    />
  );
}
