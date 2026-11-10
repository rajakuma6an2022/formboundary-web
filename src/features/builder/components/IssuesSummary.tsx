import { Button } from '@/components/ui/Button';
import type { FormField } from '../types';
import type { ValidationIssue } from '../schema';

type Props = {
  issues: ValidationIssue[];
  fields: FormField[];
  onGoToField: (id: string) => void;
};

/** Everything that blocks publishing, with a way to jump to the field. */
export function IssuesSummary({ issues, fields, onGoToField }: Props) {
  if (issues.length === 0) return null;

  return (
    <section aria-labelledby="issues-heading" className="rounded-card border border-danger bg-surface p-4">
      <h2 id="issues-heading" className="text-base font-semibold text-danger">
        Fix {issues.length} {issues.length === 1 ? 'issue' : 'issues'} before publishing
      </h2>
      <ul className="mt-2 space-y-2">
        {issues.map((issue, index) => {
          const field = issue.fieldId ? fields.find((f) => f.id === issue.fieldId) : undefined;
          const where = field ? (field.label.trim() === '' ? field.name : field.label) : 'Form';
          return (
            <li key={index} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>
                {where}: {issue.message}
              </span>
              {field && (
                <Button variant="secondary" onClick={() => onGoToField(field.id)} aria-label={`Go to ${where}`}>
                  Go to field
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
