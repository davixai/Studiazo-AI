"use client";

import { Archive } from "lucide-react";
import { useActionState, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SubmitButton } from "@/features/auth/components/form-parts";
import { initialFormState } from "@/features/auth/constants";
import type { Subject } from "@/lib/contracts/domain";
import { archiveSubject } from "../actions";

export function ArchiveSubject({ subject }: { subject: Subject }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="ghost" onClick={() => setOpen(true)}>
        <Archive aria-hidden="true" />
        Arhivează
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        size="sm"
        title={`Arhivezi „${subject.name}”?`}
        description="Materia dispare din listă. Notițele și materialele rămân păstrate, iar din Materii o poți restaura oricând."
      >
        <ArchiveForm subjectId={subject.id} onCancel={() => setOpen(false)} />
      </Dialog>
    </>
  );
}

function ArchiveForm({ subjectId, onCancel }: { subjectId: string; onCancel: () => void }) {
  // La succes, acțiunea redirecționează către /materii.
  const [state, action] = useActionState(archiveSubject, initialFormState);

  return (
    <form action={action} className="flex flex-col gap-5">
      {state.message ? <Alert tone="danger">{state.message}</Alert> : null}
      <input type="hidden" name="id" value={subjectId} />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" size="lg" onClick={onCancel}>
          Anulează
        </Button>
        <SubmitButton className="w-full sm:w-auto">Arhivează</SubmitButton>
      </div>
    </form>
  );
}
