import { BookOpen, CalendarCheck2, FileText, Megaphone, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { IconBadge } from "@/components/ui/icon-badge";
import { countLabel } from "@/features/subjects/format";
import { formatDayShort, formatRelativeDay } from "@/lib/time/format";
import { fromLocal, shiftDateKey, toDateKey } from "@/lib/time/zone";
import { GoogleMark } from "./classroom-import";

// Cum arată Classroom-ul după conectare, când serverul nu are încă cheile Google.
// Datele sunt un exemplu (etichetat ca atare); termenele se calculează față de azi, ca să nu se învechească.

const COURSES = [
  { name: "Fizică 2", section: "AIA · anul 2", tasks: 3, files: 9, color: "blue" },
  { name: "Programare orientată pe obiecte", section: "AIA · anul 2", tasks: 4, files: 12, color: "violet" },
  { name: "Sisteme cu microprocesoare", section: "AIA · anul 2", tasks: 2, files: 7, color: "teal" },
  { name: "Circuite electronice liniare I", section: "AIA · anul 2", tasks: 3, files: 8, color: "green" },
  { name: "Teoria sistemelor 1", section: "AIA · anul 2", tasks: 1, files: 6, color: "amber" },
  { name: "Pedagogie 2", section: "DSPP · anul 2", tasks: 2, files: 5, color: "rose" },
] as const;

const DEADLINES = [
  { title: "Laborator 4: moștenire și polimorfism", course: "Programare orientată pe obiecte", inDays: 2, time: "23:59" },
  { title: "Referat: oscilații amortizate", course: "Fizică 2", inDays: 4, time: "20:00" },
  { title: "Tema 2: amplificatorul diferențial", course: "Circuite electronice liniare I", inDays: 6, time: "23:59" },
  { title: "Program în asamblare: întreruperi", course: "Sisteme cu microprocesoare", inDays: 9, time: "12:00" },
] as const;

export function ClassroomPreview() {
  const today = toDateKey(new Date());
  const totals = COURSES.reduce((t, c) => ({ tasks: t.tasks + c.tasks, files: t.files + c.files }), { tasks: 0, files: 0 });

  return (
    <div className="grid gap-5 lg:grid-cols-12">
      <Card className="stagger overflow-hidden lg:col-span-8 lg:self-start">
        <header className="flex flex-col gap-3 border-b border-line/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-md bg-white shadow-xs">
              <GoogleMark />
            </span>
            <div>
              <h2 className="text-[15px] font-bold text-ink">Cursurile tale din Classroom</h2>
              <p className="text-[13px] text-ink-muted">
                {countLabel(COURSES.length, "curs activ", "cursuri active")} · {countLabel(totals.tasks, "temă", "teme")} ·{" "}
                {countLabel(totals.files, "material", "materiale")}
              </p>
            </div>
          </div>
          <Badge className="self-start sm:self-center">Exemplu</Badge>
        </header>

        <ul className="divide-y divide-line/60">
          {COURSES.map((course) => (
            <li key={course.name} className="flex items-center gap-3 px-5 py-4 sm:px-6">
              <IconBadge icon={BookOpen} color={course.color} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-ink">{course.name}</p>
                <p className="truncate text-[12px] text-ink-muted">
                  {course.section} · {countLabel(course.tasks, "temă", "teme")} · {countLabel(course.files, "material", "materiale")}
                </p>
              </div>
              <Badge tone="success" className="hidden sm:inline-flex">
                Gata de import
              </Badge>
            </li>
          ))}
        </ul>
      </Card>

      <div className="flex flex-col gap-5 lg:col-span-4">
        <Card className="stagger pb-2" style={{ "--i": 1 } as React.CSSProperties}>
          <CardHeader title="Următoarele termene" description="Intră singure în calendar, cu ora de predare." />
          <ul className="mt-3 flex flex-col">
            {DEADLINES.map((d) => {
              const due = fromLocal(shiftDateKey(today, d.inDays), d.time);
              return (
                <li key={d.title} className="flex items-start gap-3 px-5 py-2.5 sm:px-6">
                  <IconBadge icon={CalendarCheck2} color="violet" size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] leading-5 font-semibold text-ink">{d.title}</p>
                    <p className="truncate text-[12px] text-ink-muted">{d.course}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="tabular text-[12px] font-semibold text-ink-soft">{formatDayShort(due)}</p>
                    <p className={d.inDays <= 2 ? "text-[11px] font-semibold text-warning" : "text-[11px] text-ink-muted"}>
                      {formatRelativeDay(due)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="stagger p-5 sm:p-6" style={{ "--i": 2 } as React.CSSProperties}>
          <div className="flex items-center gap-2 text-[12px] font-semibold tracking-[0.1em] text-ink-muted uppercase">
            <Megaphone className="size-4" aria-hidden="true" /> Ultimul anunț
          </div>
          <p className="mt-2 text-[14px] leading-6 text-ink-soft">
            „Laboratorul de joi se mută în sala C204. Aduceți rezolvările de la tema 3.”
          </p>
          <p className="mt-1 text-[12px] text-ink-muted">Programare orientată pe obiecte · se salvează ca notiță</p>
        </Card>

        <Card className="stagger p-5 sm:p-6" style={{ "--i": 3 } as React.CSSProperties}>
          <div className="flex items-start gap-3">
            <IconBadge icon={FileText} color="blue" size="sm" />
            <p className="text-[13px] leading-5 text-ink-soft">
              PDF-urile și documentele Google devin materiale.{" "}
              <span className="inline-flex items-center gap-1 font-semibold text-accent-ink">
                <Sparkles className="size-3.5" aria-hidden="true" /> Asistentul AI le citește
              </span>{" "}
              și îți explică materia din ele.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
