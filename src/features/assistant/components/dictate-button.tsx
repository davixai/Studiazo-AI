"use client";

import { Mic, Square } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

// Dictare: studentul vorbește, iar textul apare în câmpul de mesaj pe măsură ce vorbește.
// Folosește recunoașterea vocală a browserului (Chrome, Edge, Safari pe iPhone, Chrome pe Android), în română.
// Unde browserul nu o are (ex. Firefox), butonul nu apare. Nu trimite nimic la serverul nostru.

type Alternative = { transcript: string };
type Result = { isFinal: boolean; 0: Alternative; length: number };
type ResultEvent = { resultIndex: number; results: { length: number; [i: number]: Result } };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: ResultEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type RecognitionCtor = new () => Recognition;

function getRecognition(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const noopSubscribe = () => () => {};

const ERRORS: Record<string, string> = {
  "not-allowed": "Permite accesul la microfon din browser (iconița de lângă adresă), apoi încearcă din nou.",
  "service-not-allowed": "Browserul nu permite dictarea aici. Încearcă în Chrome sau Edge.",
  "audio-capture": "Nu găsesc niciun microfon. Verifică dacă e conectat.",
  network: "Dictarea are nevoie de internet. Verifică conexiunea și încearcă din nou.",
};

type Props = {
  /** Textul din câmpul de mesaj. */
  value: string;
  onChange: (text: string) => void;
  onError: (message: string | null) => void;
  disabled?: boolean;
  className?: string;
};

export function DictateButton({ value, onChange, onError, disabled, className }: Props) {
  const supported = useSyncExternalStore(noopSubscribe, () => getRecognition() !== null, () => false);
  const [listening, setListening] = useState(false);
  const recognition = useRef<Recognition | null>(null);
  /** Ultimul text scris de dictare; dacă valoarea se schimbă altfel (trimitere, editare), oprim dictarea. */
  const written = useRef<string | null>(null);

  useEffect(() => {
    if (!listening || written.current === null || value === written.current) return;
    // Mesajul a fost trimis sau editat: oprim dictarea și ignorăm rezultatele care mai sosesc.
    const rec = recognition.current;
    recognition.current = null;
    written.current = null;
    rec?.abort();
  }, [value, listening]);

  useEffect(() => () => recognition.current?.abort(), []);

  if (!supported) return null;

  function start() {
    const Ctor = getRecognition();
    if (!Ctor) return;
    onError(null);
    const base = value.trimEnd();
    const prefix = base ? `${base} ` : "";
    const rec = new Ctor();
    rec.lang = "ro-RO";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      if (recognition.current !== rec) return;
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      const next = (prefix + text.trim()).slice(0, 4000);
      written.current = next;
      onChange(next);
    };
    rec.onerror = (e) => {
      if (recognition.current !== rec) return;
      if (e.error !== "no-speech" && e.error !== "aborted") onError(ERRORS[e.error] ?? "Dictarea nu a mers. Încearcă din nou.");
    };
    rec.onend = () => {
      if (recognition.current === rec) {
        recognition.current = null;
        written.current = null;
      }
      setListening(false);
    };
    recognition.current = rec;
    written.current = value;
    try {
      rec.start();
      setListening(true);
    } catch {
      recognition.current = null;
      onError("Dictarea nu a putut porni. Încearcă din nou.");
    }
  }

  return (
    <button
      type="button"
      onClick={() => (listening ? recognition.current?.stop() : start())}
      disabled={disabled && !listening}
      aria-pressed={listening}
      aria-label={listening ? "Oprește dictarea" : "Dictează mesajul (vorbește în română)"}
      title={listening ? "Oprește dictarea" : "Dictează"}
      className={cn(
        "relative flex size-10 shrink-0 items-center justify-center text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink disabled:opacity-40",
        listening && "bg-danger/12 text-danger hover:bg-danger/18 hover:text-danger",
        className,
      )}
    >
      {listening ? (
        <>
          <span className="absolute inset-0 animate-ping rounded-[inherit] bg-danger/15 motion-reduce:animate-none" aria-hidden="true" />
          <Square className="relative size-4 fill-current" strokeWidth={2} />
        </>
      ) : (
        <Mic className="size-5" strokeWidth={1.8} />
      )}
      {listening ? (
        <span className="sr-only" role="status">
          Ascult…
        </span>
      ) : null}
    </button>
  );
}
