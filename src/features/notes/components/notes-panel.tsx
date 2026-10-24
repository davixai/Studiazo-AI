"use client";

import { NotebookPen, Plus, Trash2 } from "lucide-react";
import { useActionState, useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Textarea, describedBy } from "@/components/ui/field";
import { SubmitButton } from "@/features/auth/components/form-parts";
import { initialFormState, type FormState } from "@/features/auth/constants";
import { countLabel } from "@/features/subjects/format";
import { cn } from "@/lib/utils";
import { deleteNote, saveNote } from "../actions";
import { formatCount } from "../format";
import { NOTE_CONTENT_MAX, NOTE_TITLE_MAX } from "../constants";
import type { Note } from "../types";

/** Notița, cu data relativă calculată pe server (evită diferențele de randare server/browser). */
export type NoteItem = Note & { updatedLabel: string };

const delay = (i: number) => ({ "--i": i }) as React.CSSProperties;

export function NotesPanel({ subjectId, notes }: { subjectId: string; notes: NoteItem[] }) {
  const [editing, setEditing] = useState<NoteItem | "new" | null>(null);
  const [confirmingClose, setConfirmingClose] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const dirty = useRef(false);

  function open(target: NoteItem | "new") {
    dirty.current = false;
    setConfirmingClose(false);
    setEditing(target);
  }

  function close(message?: string) {
    dirty.current = false;
    setConfirmingClose(false);
    setEditing(null);
    if (message) setAnnouncement(message);
  }

  /** Escape, fundalul sau „×”: cu modificări nesalvate, întrebăm întâi. */
  function requestClose() {
    if (dirty.current) setConfirmingClose(true);
    else close();
  }

  const note = editing === "new" ? null : editing;

  return (
    <div className="flex flex-col gap-4">
      <p role="status" className="sr-only">
        {announcement}
      </p>

      {notes.length > 0 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-ink-muted">
            <span className="tabular font-semibold text-ink-soft">{countLabel(notes.length, "notiță", "notițe")}</span>
            <span aria-hidden="true"> · </span>
            ordonate după ultima modificare
          </p>
          <Button onClick={() => open("new")} className="w-full sm:w-auto">
            <Plus aria-hidden="true" />
            Notiță nouă
          </Button>
        </div>
      ) : null}

      {notes.length === 0 ? (
        <Card>
          <EmptyState
            icon={<NotebookPen />}
            title="Nicio notiță încă"
            description="Scrie ce reții de la curs, întrebări pentru seminar sau formulele de recitit. Le găsești aici, ordonate după ultima modificare."
            action={
              <Button onClick={() => open("new")}>
                <Plus aria-hidden="true" />
                Scrie prima notiță
              </Button>
            }
          />
        </Card>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {notes.map((n, i) => (
            <li key={n.id} className="stagger" style={delay(Math.min(i, 8))}>
              <button
                type="button"
                onClick={() => open(n)}
                className="group block h-full w-full rounded-lg text-left transition-transform active:scale-[0.99]"
              >
                <Card className="lift flex h-full flex-col gap-2.5 p-4 sm:p-5">
                  <h3 className="text-[15px] leading-snug font-semibold break-words text-ink">{n.title}</h3>
                  {n.content ? (
                    <p className="line-clamp-4 text-sm leading-6 break-words whitespace-pre-line text-ink-soft">{n.content}</p>
                  ) : (
                    <p className="text-sm text-ink-faint italic">Fără conținut</p>
                  )}
                  <p className="mt-auto pt-1 text-[12px] font-medium text-ink-muted">Modificată {n.updatedLabel}</p>
                </Card>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={editing !== null}
        onClose={requestClose}
        size="lg"
        title={note ? "Editează notița" : "Notiță nouă"}
        description={note ? `Modificată ${note.updatedLabel}` : undefined}
      >
        {editing !== null ? (
          <NoteEditor
            key={note?.id ?? "new"}
            subjectId={subjectId}
            note={note}
            confirmingClose={confirmingClose}
            onDirtyChange={(value) => (dirty.current = value)}
            onKeepEditing={() => setConfirmingClose(false)}
            onCancel={requestClose}
            onDone={close}
          />
        ) : null}
      </Dialog>
    </div>
  );
}

type NoteEditorProps = {
  subjectId: string;
  note: NoteItem | null;
  confirmingClose: boolean;
  onDirtyChange: (dirty: boolean) => void;
  onKeepEditing: () => void;
  /** „Anulează”: trece prin aceeași verificare a modificărilor nesalvate ca Escape. */
  onCancel: () => void;
  onDone: (message?: string) => void;
};

function NoteEditor({ subjectId, note, confirmingClose, onDirtyChange, onKeepEditing, onCancel, onDone }: NoteEditorProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const [state, action] = useActionState<FormState, FormData>(async (prev, formData) => {
    const next = await saveNote(prev, formData);
    if (next.status === "success") onDone(next.message);
    return next;
  }, initialFormState);

  const [deleteState, deleteAction] = useActionState<FormState, FormData>(async (prev, formData) => {
    const next = await deleteNote(prev, formData);
    if (next.status === "success") onDone(next.message);
    return next;
  }, initialFormState);

  function update(nextTitle: string, nextContent: string) {
    setTitle(nextTitle);
    setContent(nextContent);
    onDirtyChange(nextTitle !== (note?.title ?? "") || nextContent !== (note?.content ?? ""));
  }

  const e = state.fieldErrors ?? {};
  const length = content.length;
  const nearLimit = length >= NOTE_CONTENT_MAX * 0.95;

  if (confirmingClose) {
    return (
      <div className="flex flex-col gap-5 animate-fade-in">
        <Alert tone="warning" title="Ai modificări nesalvate">
          Dacă închizi acum, ce ai scris de la ultima salvare se pierde.
        </Alert>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" size="lg" onClick={() => onDone()}>
            Renunță la modificări
          </Button>
          <Button size="lg" onClick={onKeepEditing}>
            Continuă editarea
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <form ref={formRef} action={action} noValidate className="flex flex-col gap-5">
        {state.status === "error" && state.message ? <Alert tone="danger">{state.message}</Alert> : null}
        <input type="hidden" name="subjectId" value={subjectId} />
        {note ? <input type="hidden" name="id" value={note.id} /> : null}

        <Field id="note-title" label="Titlu" optional hint="Dacă îl lași gol, folosim primul rând al notiței." error={e.title}>
          <Input
            id="note-title"
            name="title"
            value={title}
            onChange={(ev) => update(ev.target.value, content)}
            maxLength={NOTE_TITLE_MAX}
            placeholder="ex. Arbori binari de căutare"
            autoComplete="off"
            aria-invalid={Boolean(e.title) || undefined}
            aria-describedby={describedBy("note-title", { hint: !e.title, error: e.title })}
          />
        </Field>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="note-content" className="text-sm font-medium text-ink">
            Notița
          </label>
          <Textarea
            id="note-content"
            name="content"
            value={content}
            onChange={(ev) => update(title, ev.target.value)}
            onKeyDown={(ev) => {
              if (ev.key === "Enter" && (ev.metaKey || ev.ctrlKey)) {
                ev.preventDefault();
                formRef.current?.requestSubmit();
              }
            }}
            maxLength={NOTE_CONTENT_MAX}
            placeholder="Ce ai reținut de la curs, întrebări, formule…"
            className="min-h-[38dvh] resize-y sm:min-h-72"
            aria-invalid={Boolean(e.content) || undefined}
            aria-describedby={e.content ? "note-content-error note-content-count" : "note-content-count"}
          />
          <div className="flex items-start justify-between gap-3 text-[12px] leading-5">
            {e.content ? (
              <p id="note-content-error" className="font-medium text-danger">
                {e.content}
              </p>
            ) : (
              <p className="hidden text-ink-faint sm:block">Ctrl + Enter salvează</p>
            )}
            <p
              id="note-content-count"
              aria-live={nearLimit ? "polite" : "off"}
              className={cn(
                "tabular ml-auto shrink-0 transition-colors",
                length >= NOTE_CONTENT_MAX ? "font-semibold text-danger" : nearLimit ? "font-medium text-warning" : "text-ink-muted",
              )}
            >
              {formatCount(length)} / {formatCount(NOTE_CONTENT_MAX)}
              <span className="sr-only"> caractere</span>
            </p>
          </div>
        </div>

        {!confirmingDelete ? (
          <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:items-center">
            {note ? (
              <Button variant="quiet-danger" onClick={() => setConfirmingDelete(true)} className="sm:mr-auto">
                <Trash2 aria-hidden="true" />
                Șterge
              </Button>
            ) : null}
            <Button variant="secondary" size="lg" onClick={onCancel} className="sm:ml-auto">
              Anulează
            </Button>
            <SubmitButton className="w-full sm:w-auto">{note ? "Salvează" : "Adaugă notița"}</SubmitButton>
          </div>
        ) : null}
      </form>

      {note && confirmingDelete ? (
        <form action={deleteAction} className="flex flex-col gap-4 border-t border-line pt-4 animate-fade-in">
          <input type="hidden" name="id" value={note.id} />
          <input type="hidden" name="subjectId" value={subjectId} />
          <Alert tone="danger" title={`Ștergi notița „${note.title}”?`}>
            {deleteState.message ?? "Notița se șterge definitiv și nu poate fi recuperată."}
          </Alert>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" size="lg" onClick={() => setConfirmingDelete(false)}>
              Nu, păstreaz-o
            </Button>
            <SubmitButton className="w-full bg-danger hover:bg-danger-hover sm:w-auto">Șterge definitiv</SubmitButton>
          </div>
        </form>
      ) : null}
    </div>
  );
}
