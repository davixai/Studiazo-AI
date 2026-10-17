import { BriefcaseBusiness, Flame, GraduationCap, Quote, Sparkles, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { MarqueeFollow } from "./marquee-follow";

// Panoul din paginile de autentificare: două benzi de „previzualizări” ale aplicației care alunecă în sens opus.
// Doar ilustrații (fără date reale). La hover se opresc și urmăresc cursorul (MarqueeFollow); stau pe loc cu prefers-reduced-motion.

function MiniCard({ title, icon, children, className }: { title: string; icon: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("marquee-card w-64 shrink-0 rounded-xl border border-line bg-surface p-5 shadow-md", className)}>
      <div className="mb-4 flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-md bg-accent-soft text-accent-ink [&_svg]:size-4">{icon}</span>
        <span className="text-[13px] font-semibold text-ink">{title}</span>
      </div>
      {children}
    </div>
  );
}

const AGENDA = [
  { time: "08:00", title: "Curs", width: "w-28", tone: "bg-cat-blue" },
  { time: "10:00", title: "Seminar", width: "w-20", tone: "bg-cat-teal" },
  { time: "14:00", title: "Studiu", width: "w-32", tone: "bg-accent" },
];

const TOP_ROW = [
  <MiniCard key="azi" title="Azi" icon={<GraduationCap />}>
    <ul className="space-y-3">
      {AGENDA.map((row) => (
        <li key={row.time} className="flex items-center gap-3">
          <span className="w-10 text-[11px] text-ink-muted tabular">{row.time}</span>
          <span className={`h-7 w-0.5 rounded-full ${row.tone}`} />
          <span className="flex flex-col gap-1">
            <span className="text-[12px] font-medium">{row.title}</span>
            <span className={`h-1.5 rounded-full bg-surface-sunken ${row.width}`} />
          </span>
        </li>
      ))}
    </ul>
  </MiniCard>,
  <MiniCard key="asistent" title="Asistent AI" icon={<Sparkles />}>
    <div className="flex flex-col gap-2 text-[12px] leading-4">
      <p className="self-end rounded-lg rounded-br-sm bg-accent px-3 py-2 text-white">Explică-mi derivatele pe scurt</p>
      <p className="self-start rounded-lg rounded-bl-sm bg-surface-sunken px-3 py-2 text-ink-soft">
        Derivata arată cât de repede se schimbă o funcție… <span className="text-accent-ink">(Curs 3, p. 12)</span>
      </p>
    </div>
  </MiniCard>,
  <MiniCard key="test" title="Test grilă" icon={<GraduationCap />}>
    <p className="text-[12px] text-ink-soft">Structuri de date · 10 întrebări</p>
    <div className="mt-3 flex gap-1.5">
      {[1, 1, 1, 0, 1, 1, 1, 1, 2, 2].map((s, i) => (
        <span key={i} className={cn("h-2 flex-1 rounded-full", s === 1 ? "bg-success" : s === 0 ? "bg-danger" : "bg-surface-sunken")} />
      ))}
    </div>
    <p className="mt-3 text-[22px] leading-none font-bold tracking-[-0.03em] text-ink">
      7/8 <span className="text-[12px] font-medium text-ink-muted">corecte</span>
    </p>
  </MiniCard>,
  <MiniCard key="streak" title="Streak" icon={<Flame />} className="bg-brand text-white [&_.bg-accent-soft]:bg-white/15 [&_.text-accent-ink]:text-white [&_.text-ink]:text-white">
    <p className="text-[40px] leading-none font-extrabold tracking-[-0.04em]">12</p>
    <p className="mt-1 text-[12px] text-white/80">zile la rând de învățat</p>
    <div className="mt-3 flex gap-1">
      {Array.from({ length: 7 }, (_, i) => (
        <span key={i} className="h-1.5 flex-1 rounded-full bg-white/70" />
      ))}
    </div>
  </MiniCard>,
];

const BOTTOM_ROW = [
  <MiniCard key="gand" title="Gândul zilei" icon={<Quote />}>
    <p className="font-quote text-[15px] leading-5 text-ink italic">„Secretul progresului este să începi.”</p>
    <p className="mt-2 text-[11px] font-semibold tracking-[0.14em] text-ink-muted uppercase">Mark Twain</p>
  </MiniCard>,
  <MiniCard key="buget" title="Buget" icon={<Wallet />}>
    <div className="flex items-end gap-2" style={{ height: 56 }}>
      {[
        [70, 60],
        [70, 78],
        [72, 55],
        [74, 64],
      ].map(([inc, exp], i) => (
        <span key={i} className="flex h-full flex-1 items-end justify-center gap-0.5">
          <span className="w-2.5 rounded-t-[3px] bg-viz-income" style={{ height: `${inc}%` }} />
          <span className="w-2.5 rounded-t-[3px] bg-viz-expense" style={{ height: `${exp}%` }} />
        </span>
      ))}
    </div>
    <p className="mt-3 text-[12px] text-ink-soft">
      Economisești <span className="font-semibold text-success">18%</span> · sfaturi AI
    </p>
  </MiniCard>,
  <MiniCard key="joburi" title="Joburi" icon={<BriefcaseBusiness />}>
    <p className="text-[13px] font-semibold text-ink">☕ Barista part-time</p>
    <p className="mt-1 text-[12px] text-ink-soft tabular">1.800–2.800 lei/lună</p>
    <div className="mt-3 flex flex-wrap gap-1.5">
      <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent-ink">Ture flexibile</span>
      <span className="rounded-full bg-surface-sunken px-2 py-0.5 text-[11px] font-medium text-ink-soft">Fără experiență</span>
    </div>
  </MiniCard>,
  <MiniCard key="classroom" title="Google Classroom" icon={<GraduationCap />}>
    <ul className="space-y-2 text-[12px] text-ink-soft">
      <li className="flex items-center justify-between">
        Algebră liniară <span className="text-success">✓</span>
      </li>
      <li className="flex items-center justify-between">
        Programare OOP <span className="text-success">✓</span>
      </li>
      <li className="flex items-center justify-between">
        Fizică
        <span className="h-1.5 w-12 overflow-hidden rounded-full bg-surface-sunken">
          <span className="block h-full w-2/3 rounded-full bg-brand" />
        </span>
      </li>
    </ul>
  </MiniCard>,
];

function Track({ items, reverse = false }: { items: ReactNode[]; reverse?: boolean }) {
  return (
    <div className="marquee">
      {/* Conținutul e dublat ca bucla să fie continuă (animația mută banda cu exact o jumătate). */}
      <MarqueeFollow>
        <div className={cn("marquee-track", reverse && "marquee-reverse")}>
          {items}
          {items.map((item, i) => (
            <div key={`copie-${i}`} className="contents">
              {item}
            </div>
          ))}
        </div>
      </MarqueeFollow>
    </div>
  );
}

/** Două benzi pe ecranele mari; pe telefon, o singură bandă cu toate cardurile, sub formular. */
export function FeatureMarquee({ single = false }: { single?: boolean }) {
  if (single) return <Track items={[...TOP_ROW, ...BOTTOM_ROW]} />;
  return (
    <div className="flex flex-col gap-5">
      <Track items={TOP_ROW} />
      <Track items={BOTTOM_ROW} reverse />
    </div>
  );
}
