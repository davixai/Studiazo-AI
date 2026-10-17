"use client";

import { ChevronRight } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { ColorDot } from "@/components/ui/category";
import { initialFormState } from "@/features/auth/schemas";
import type { Subject } from "@/lib/contracts/domain";
import { restoreSubject } from "../actions";

/** Lista restrânsă a materiilor arhivate, fiecare cu „Restaurează”. */
export function ArchivedSubjects({ subjects }: { subjects: Subject[] }) {
  if (subjects.length === 0) return null;

  return (
    <details className="group rounded-lg border border-line/70 bg-surface">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-5 py-4 text-sm font-medium text-ink-soft hover:text-ink sm:px-6 [&::-webkit-details-marker]:hidden">
        <ChevronRight className="size-4 transition-transform group-open:rotate-90" aria-hidden="true" />
        Materii arhivate ({subjects.length})
      </summary>
      <ul className="divide-y divide-line border-t border-line">
        {subjects.map((subject) => (
          <ArchivedRow key={subject.id} subject={subject} />
        ))}
      </ul>
    </details>
  );
}

function ArchivedRow({ subject }: { subject: Subject }) {
  const [state, action] = useActionState(restoreSubject, initialFormState);

  return (
    <li className="px-5 py-3 sm:px-6">
      <form action={action} className="flex items-center gap-3">
        <input type="hidden" name="id" value={subject.id} />
        <ColorDot color={subject.color} />
        <span className="min-w-0 flex-1 truncate text-sm text-ink">{subject.name}</span>
        <RestoreButton name={subject.name} />
      </form>
      {state.status === "error" && state.message ? (
        <p role="alert" className="mt-1.5 text-[13px] leading-5 font-medium text-danger">
          {state.message}
        </p>
      ) : null}
    </li>
  );
}

function RestoreButton({ name }: { name: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" size="sm" loading={pending} aria-label={`Restaurează „${name}”`}>
      Restaurează
    </Button>
  );
}
