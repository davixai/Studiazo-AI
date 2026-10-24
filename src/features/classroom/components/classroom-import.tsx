"use client";

import { BookOpen, CalendarCheck2, Check, CircleAlert, FileText, LogOut, Megaphone, RefreshCw, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconBadge } from "@/components/ui/icon-badge";
import { Spinner } from "@/components/ui/spinner";
import { countLabel } from "@/features/subjects/format";
import { cn } from "@/lib/utils";
import { disconnectClassroom, importCourse, importFile, listCourseFiles, loadCourses, type ClassroomCourse } from "../actions";
import { MAX_FILES_PER_COURSE, type ImportableFile } from "../mapping";

/** Lista de fișiere a unei clase: se încarcă doar când studentul o deschide. */
type FileList = { state: "incarca" } | { state: "gata"; files: ImportableFile[] } | { state: "eroare"; message: string };

const FROM_LABEL: Record<ImportableFile["from"], string> = { curs: "Material", tema: "Temă", anunt: "Anunț" };

const CALLBACK_ERRORS: Record<string, string> = {
  refuzat: "Nu ai permis accesul. Fără el nu putem citi cursurile din Classroom.",
  stare: "Conectarea a expirat sau a fost întreruptă. Încearcă din nou.",
  schimb: "Google nu a confirmat conectarea. Încearcă din nou.",
  config: "Conectarea cu Google Classroom nu este configurată pe acest server.",
};

type Progress = {
  phase: "asteapta" | "lucru" | "gata" | "eroare";
  subjectId?: string;
  tasksAdded: number;
  noteSaved: boolean;
  filesTotal: number;
  filesDone: number;
  filesImported: number;
  skipped: string[];
  error?: string;
};

const EMPTY: Progress = { phase: "asteapta", tasksAdded: 0, noteSaved: false, filesTotal: 0, filesDone: 0, filesImported: 0, skipped: [] };

export function ClassroomImport({ connected: initiallyConnected, error }: { connected: boolean; error: string | null }) {
  const [connected, setConnected] = useState(initiallyConnected);
  const [authMessage, setAuthMessage] = useState<string | null>(error ? (CALLBACK_ERRORS[error] ?? CALLBACK_ERRORS.schimb) : null);
  // Din meniu, fără conexiune și fără o eroare de arătat: mergem direct la Google.
  const [redirecting] = useState(!initiallyConnected && !error);

  useEffect(() => {
    if (redirecting) window.location.replace("/api/classroom/connect");
  }, [redirecting]);

  const needsAuth = useCallback((message: string) => {
    setConnected(false);
    setAuthMessage(message);
  }, []);

  if (!connected && redirecting && !authMessage) {
    return (
      <Card className="flex items-center gap-3 p-6 text-sm text-ink-muted" role="status">
        <Spinner /> Te duc la Google ca să te conectezi cu contul tău…
      </Card>
    );
  }
  if (!connected) return <ConnectCard message={authMessage} />;
  return <CourseImporter onNeedsAuth={needsAuth} />;
}

function ConnectCard({ message }: { message: string | null }) {
  return (
    <div className="flex flex-col gap-4">
      {message ? <Alert tone="warning">{message}</Alert> : null}
      <section className="stagger relative overflow-hidden rounded-xl bg-brand p-6 text-white shadow-accent sm:p-8">
        <span aria-hidden="true" className="pointer-events-none absolute -top-20 -right-16 size-64 rounded-full bg-white/10 blur-2xl" />
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-10 size-56 rounded-full bg-white/[0.07] blur-2xl" />
        <div className="relative max-w-xl">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold tracking-[0.12em] uppercase">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Import automat
          </p>
          <h2 className="mt-4 text-[24px] leading-tight font-bold tracking-[-0.03em] sm:text-[28px]">Adu-ți tot semestrul din Classroom, dintr-un clic.</h2>
          <p className="mt-2 text-[15px] leading-6 text-white/85">
            Te conectezi cu contul Google, alegi cursurile, iar noi le transformăm în materii pe care asistentul AI le poate citi.
          </p>
          <ul className="mt-5 grid gap-2.5 text-sm sm:grid-cols-2">
            {[
              [BookOpen, "Cursurile devin materii"],
              [CalendarCheck2, "Temele cu termen intră în calendar"],
              [FileText, "PDF, Word, PowerPoint, Docs, poze și foldere devin materiale"],
              [Megaphone, "Anunțurile se salvează ca notiță"],
            ].map(([Icon, label]) => {
              const I = Icon as typeof BookOpen;
              return (
                <li key={label as string} className="flex items-center gap-2.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-white/15">
                    <I className="size-4" aria-hidden="true" />
                  </span>
                  {label as string}
                </li>
              );
            })}
          </ul>
          {/* Link simplu (nu <Link>): ruta face redirecționarea către Google. */}
          <a
            href="/api/classroom/connect"
            className="mt-7 inline-flex h-12 items-center gap-3 rounded-md bg-white px-5 text-[15px] font-semibold text-canvas shadow-lg transition-transform hover:-translate-y-0.5 active:scale-[0.97]"
          >
            <GoogleMark />
            Conectează Google Classroom
          </a>
          <p className="mt-3 text-[12px] leading-5 text-white/70">
            Doar citire: nu modificăm nimic în Classroom sau Drive. Accesul expiră singur după o oră.
          </p>
        </div>
      </section>
    </div>
  );
}

function CourseImporter({ onNeedsAuth }: { onNeedsAuth: (message: string) => void }) {
  const [courses, setCourses] = useState<ClassroomCourse[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [fileLists, setFileLists] = useState<Record<string, FileList>>({});
  // Alegerea fișierelor, pe clasă; o clasă fără alegere își importă toate fișierele.
  const [fileChoice, setFileChoice] = useState<Record<string, Set<string>>>({});

  const [attempt, setAttempt] = useState(0);

  async function openFiles(courseId: string) {
    if (fileLists[courseId]?.state === "gata" || fileLists[courseId]?.state === "incarca") return;
    setFileLists((l) => ({ ...l, [courseId]: { state: "incarca" } }));
    const result = await listCourseFiles(courseId);
    if (!result.ok) {
      if (result.reason === "auth") return onNeedsAuth(result.message);
      setFileLists((l) => ({ ...l, [courseId]: { state: "eroare", message: result.message } }));
      return;
    }
    setFileLists((l) => ({ ...l, [courseId]: { state: "gata", files: result.files } }));
    setFileChoice((c) => (c[courseId] ? c : { ...c, [courseId]: new Set(result.files.map((f) => f.id)) }));
  }

  function toggleFile(courseId: string, fileId: string) {
    setFileChoice((c) => {
      const next = new Set(c[courseId]);
      if (next.has(fileId)) next.delete(fileId);
      else next.add(fileId);
      return { ...c, [courseId]: next };
    });
  }

  function setAllFiles(courseId: string, on: boolean) {
    const list = fileLists[courseId];
    if (list?.state !== "gata") return;
    setFileChoice((c) => ({ ...c, [courseId]: new Set(on ? list.files.map((f) => f.id) : []) }));
  }

  useEffect(() => {
    let active = true;
    void loadCourses().then((result) => {
      if (!active) return;
      if (!result.ok) {
        if (result.reason === "auth") onNeedsAuth(result.message);
        else setLoadError(result.message);
        return;
      }
      setCourses(result.courses);
      setSelected(new Set(result.courses.filter((c) => !c.imported).map((c) => c.id)));
    });
    return () => {
      active = false;
    };
  }, [attempt, onNeedsAuth]);

  function retry() {
    setLoadError(null);
    setAttempt((a) => a + 1);
  }

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function run() {
    if (!courses) return;
    setRunning(true);
    setFinished(false);
    const queue = courses.filter((c) => selected.has(c.id));
    setProgress(Object.fromEntries(queue.map((c) => [c.id, { ...EMPTY }])));
    const update = (id: string, patch: Partial<Progress>) => setProgress((p) => ({ ...p, [id]: { ...p[id], ...patch } }));

    for (const [i, course] of queue.entries()) {
      update(course.id, { phase: "lucru" });
      const choice = fileChoice[course.id];
      const result = await importCourse({ courseId: course.id, colorIndex: i, fileIds: choice ? [...choice] : undefined });
      if (!result.ok) {
        if (result.reason === "auth") return onNeedsAuth(result.message);
        update(course.id, { phase: "eroare", error: result.message });
        continue;
      }
      update(course.id, {
        subjectId: result.subjectId,
        tasksAdded: result.tasksAdded,
        noteSaved: result.noteSaved,
        filesTotal: result.files.length,
      });

      let imported = 0;
      const skipped: string[] = [];
      // Coada crește când un fișier e folder: conținutul lui se adaugă la final (fără repetări, cu limită).
      const files = [...result.files];
      const seen = new Set(files.map((f) => f.id));
      let folders = 0;
      for (let n = 0; n < files.length; n++) {
        const file = files[n];
        const r = await importFile({ subjectId: result.subjectId, fileId: file.id, title: file.title });
        if (!r.ok) {
          if (r.reason === "auth") return onNeedsAuth(r.message);
          skipped.push(r.message);
        } else if (r.status === "folder") {
          folders++;
          for (const child of r.files) {
            if (seen.has(child.id) || files.length >= MAX_FILES_PER_COURSE) continue;
            seen.add(child.id);
            files.push(child);
          }
        } else if (r.status === "importat") imported++;
        else if (r.status === "sarit" && r.message) skipped.push(r.message);
        update(course.id, {
          filesDone: n + 1 - folders,
          filesTotal: files.length - folders,
          filesImported: imported,
          skipped: [...skipped],
        });
      }
      update(course.id, { phase: "gata" });
    }
    setRunning(false);
    setFinished(true);
    setCourses((cs) => cs?.map((c) => (selected.has(c.id) ? { ...c, imported: true } : c)) ?? null);
  }

  async function disconnect() {
    await disconnectClassroom();
    onNeedsAuth("Te-ai deconectat de la Google Classroom.");
  }

  if (loadError) {
    return (
      <Alert tone="danger" title="Nu am putut citi cursurile" action={<Button size="sm" variant="secondary" onClick={retry}>Reîncearcă</Button>}>
        {loadError}
      </Alert>
    );
  }

  if (!courses) {
    return (
      <Card className="flex items-center gap-3 p-6 text-sm text-ink-muted">
        <Spinner /> Citesc cursurile din Classroom…
      </Card>
    );
  }

  const totals = Object.values(progress).reduce(
    (t, p) => ({ tasks: t.tasks + p.tasksAdded, files: t.files + p.filesImported, notes: t.notes + (p.noteSaved ? 1 : 0) }),
    { tasks: 0, files: 0, notes: 0 },
  );

  return (
    <div className="flex flex-col gap-5">
      {finished ? (
        <section className="stagger relative overflow-hidden rounded-xl border border-success/25 bg-success-soft p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <span className="flex size-11 shrink-0 animate-pop-in items-center justify-center rounded-full bg-success text-canvas">
              <Check className="size-6" strokeWidth={3} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[17px] font-bold text-ink">Gata! Semestrul tău e în Studiazo.</h2>
              <p className="mt-1 text-sm leading-6 text-ink-soft">
                {countLabel(totals.tasks, "temă nouă", "teme noi")} în calendar, {countLabel(totals.files, "material nou", "materiale noi")}
                {totals.notes > 0 ? ` și ${countLabel(totals.notes, "notiță", "notițe")} cu anunțuri` : ""}. Asistentul le poate citi de acum.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <ButtonLink href="/asistent" size="sm">
                  <Sparkles aria-hidden="true" /> Întreabă asistentul
                </ButtonLink>
                <ButtonLink href="/materii" size="sm" variant="secondary">
                  Vezi materiile
                </ButtonLink>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <Card>
        <header className="flex flex-col gap-3 border-b border-line/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-md bg-white shadow-xs">
              <GoogleMark />
            </span>
            <div>
              <h2 className="text-[15px] font-bold text-ink">Cursurile tale din Classroom</h2>
              <p className="text-[13px] text-ink-muted">
                {courses.length === 0 ? "Niciun curs activ" : `${countLabel(courses.length, "curs activ", "cursuri active")} · ${selected.size} selectate`}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => void disconnect()} disabled={running}>
              <LogOut aria-hidden="true" /> Deconectează
            </Button>
            <Button size="sm" onClick={() => void run()} loading={running} disabled={running || selected.size === 0}>
              {running ? "Import în curs…" : finished ? <><RefreshCw aria-hidden="true" /> Importă din nou</> : `Importă ${selected.size || ""}`.trim()}
            </Button>
          </div>
        </header>

        {courses.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-ink-muted sm:px-6">
            Contul acesta nu are cursuri active în Classroom. Dacă folosești alt cont (ex. cel al facultății), deconectează-te și alege-l pe acela.
          </p>
        ) : (
          <ul className="divide-y divide-line/60">
            {courses.map((course, i) => (
              <CourseRow
                key={course.id}
                course={course}
                index={i}
                checked={selected.has(course.id)}
                disabled={running}
                onToggle={() => toggle(course.id)}
                progress={progress[course.id]}
                files={fileLists[course.id]}
                chosen={fileChoice[course.id]}
                onOpenFiles={() => void openFiles(course.id)}
                onToggleFile={(fileId) => toggleFile(course.id, fileId)}
                onSetAllFiles={(on) => setAllFiles(course.id, on)}
              />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

const ROW_COLORS = ["blue", "teal", "green", "amber", "rose", "violet", "slate"] as const;

function CourseRow({
  course,
  index,
  checked,
  disabled,
  onToggle,
  progress,
  files,
  chosen,
  onOpenFiles,
  onToggleFile,
  onSetAllFiles,
}: {
  course: ClassroomCourse;
  index: number;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
  progress?: Progress;
  files?: FileList;
  chosen?: Set<string>;
  onOpenFiles: () => void;
  onToggleFile: (fileId: string) => void;
  onSetAllFiles: (on: boolean) => void;
}) {
  const inputId = `curs-${course.id}`;
  const [open, setOpen] = useState(false);
  const showPicker = open && checked && (!progress || progress.phase === "asteapta");

  function toggleOpen() {
    if (!open) onOpenFiles();
    setOpen((o) => !o);
  }
  const pct = progress && progress.filesTotal > 0 ? Math.round((progress.filesDone / progress.filesTotal) * 100) : progress?.phase === "gata" ? 100 : 0;

  return (
    <li className="px-5 py-4 sm:px-6">
      <div className="flex items-center gap-3">
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={onToggle}
          className="size-[18px] shrink-0 cursor-pointer rounded accent-accent disabled:cursor-default"
        />
        <IconBadge icon={BookOpen} color={ROW_COLORS[index % ROW_COLORS.length]} size="sm" />
        <label htmlFor={inputId} className="min-w-0 flex-1 cursor-pointer">
          <span className="block truncate text-[14px] font-semibold text-ink">{course.name}</span>
          {course.section ? <span className="block truncate text-[12px] text-ink-muted">{course.section}</span> : null}
        </label>
        <StatusBadge course={course} progress={progress} />
      </div>

      {checked && !disabled && (!progress || progress.phase === "asteapta") ? (
        <div className="mt-2 pl-[30px] sm:pl-[74px]">
          <button
            type="button"
            onClick={toggleOpen}
            aria-expanded={open}
            className="inline-flex items-center gap-1.5 rounded-sm text-[13px] font-semibold text-accent hover:underline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <FileText className="size-4" aria-hidden="true" />
            {open ? "Ascunde fișierele" : chosen && files?.state === "gata" ? `Fișiere alese: ${chosen.size} din ${files.files.length}` : "Alege fișierele"}
          </button>
          {showPicker ? <FilePicker files={files} chosen={chosen} onToggleFile={onToggleFile} onSetAll={onSetAllFiles} /> : null}
        </div>
      ) : null}

      {progress && progress.phase !== "asteapta" ? (
        <div className="mt-3 pl-[30px] sm:pl-[74px]">
          {progress.phase === "eroare" ? (
            <p className="flex items-center gap-1.5 text-[13px] text-danger">
              <CircleAlert className="size-4" aria-hidden="true" /> {progress.error}
            </p>
          ) : (
            <>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-sunken">
                <div className="h-full rounded-full bg-brand transition-[width] duration-500 ease-out" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-2 text-[12px] text-ink-muted">
                {countLabel(progress.tasksAdded, "temă", "teme")} · {progress.filesImported}/{progress.filesTotal} materiale
                {progress.noteSaved ? " · notiță cu anunțuri" : ""}
              </p>
              {progress.skipped.length > 0 ? (
                <details className="mt-1.5 text-[12px] text-ink-muted">
                  <summary className="cursor-pointer text-warning">{countLabel(progress.skipped.length, "fișier sărit", "fișiere sărite")}</summary>
                  <ul className="mt-1.5 list-disc space-y-1 pl-4">
                    {progress.skipped.map((s, k) => (
                      <li key={k}>{s}</li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </li>
  );
}

function FilePicker({
  files,
  chosen,
  onToggleFile,
  onSetAll,
}: {
  files?: FileList;
  chosen?: Set<string>;
  onToggleFile: (fileId: string) => void;
  onSetAll: (on: boolean) => void;
}) {
  if (!files || files.state === "incarca") {
    return (
      <p className="mt-2 flex items-center gap-2 text-[13px] text-ink-muted">
        <Spinner className="size-3.5" /> Citesc fișierele clasei…
      </p>
    );
  }
  if (files.state === "eroare") return <p className="mt-2 text-[13px] text-danger">{files.message}</p>;
  if (files.files.length === 0) {
    return <p className="mt-2 text-[13px] text-ink-muted">Clasa nu are fișiere atașate. Se importă temele și anunțurile.</p>;
  }

  const all = chosen?.size === files.files.length;
  return (
    <div className="mt-2 rounded-md border border-line bg-surface-sunken/50 p-3">
      <div className="mb-2 flex items-center justify-between gap-2 text-[12px] text-ink-muted">
        <span>
          {chosen?.size ?? 0} din {files.files.length} alese · folderele se importă cu tot conținutul
        </span>
        <button type="button" onClick={() => onSetAll(!all)} className="font-semibold text-accent hover:underline">
          {all ? "Debifează tot" : "Bifează tot"}
        </button>
      </div>
      <ul className="max-h-64 space-y-1 overflow-y-auto">
        {files.files.map((f) => {
          const id = `fisier-${f.id}`;
          return (
            <li key={f.id} className="flex items-center gap-2.5 rounded-sm px-1 py-1 hover:bg-surface">
              <input
                id={id}
                type="checkbox"
                checked={chosen?.has(f.id) ?? false}
                onChange={() => onToggleFile(f.id)}
                className="size-4 shrink-0 cursor-pointer rounded accent-accent"
              />
              <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer truncate text-[13px] text-ink">
                {f.title}
              </label>
              <span className="shrink-0 text-[11px] text-ink-muted">{FROM_LABEL[f.from]}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function StatusBadge({ course, progress }: { course: ClassroomCourse; progress?: Progress }) {
  if (progress?.phase === "lucru") {
    return (
      <Badge tone="accent">
        <Spinner className="size-3" /> Import
      </Badge>
    );
  }
  if (progress?.phase === "gata") {
    return (
      <Badge tone="success">
        <Check className="size-3" aria-hidden="true" /> Importat
      </Badge>
    );
  }
  if (progress?.phase === "eroare") return <Badge tone="danger">Eroare</Badge>;
  if (course.imported) return <Badge>Deja în Studiazo</Badge>;
  return course.link ? (
    <a href={course.link} target="_blank" rel="noreferrer" className={cn(buttonStyles({ variant: "ghost", size: "sm" }), "hidden sm:inline-flex")}>
      Deschide
    </a>
  ) : null;
}

/** Sigla Google (cele patru culori oficiale). */
export function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
