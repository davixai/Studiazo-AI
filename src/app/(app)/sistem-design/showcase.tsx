"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ColorDot } from "@/components/ui/category";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { SUBJECT_COLORS } from "@/lib/contracts/domain";

export function Showcase() {
  const [view, setView] = useState<"zi" | "saptamana" | "agenda">("agenda");
  const [open, setOpen] = useState(false);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader title="Butoane" description="Un singur buton principal pe ecran." />
        <CardBody className="flex flex-wrap gap-2">
          <Button>
            <Plus aria-hidden="true" /> Principal
          </Button>
          <Button variant="secondary">Secundar</Button>
          <Button variant="ghost">Discret</Button>
          <Button variant="danger">Periculos</Button>
          <Button loading>Se salvează</Button>
          <Button disabled>Dezactivat</Button>
          <Button size="sm" variant="secondary">
            Mic
          </Button>
          <Button size="lg">Mare</Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Etichete și categorii" />
        <CardBody className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Badge>Neutru</Badge>
            <Badge tone="accent">Accent</Badge>
            <Badge tone="success">Gata</Badge>
            <Badge tone="warning">În 3 zile</Badge>
            <Badge tone="danger">Mâine</Badge>
          </div>
          <div className="flex flex-wrap gap-4">
            {SUBJECT_COLORS.map((c) => (
              <span key={c} className="inline-flex items-center gap-2 text-[13px] text-ink-soft">
                <ColorDot color={c} /> {c}
              </span>
            ))}
          </div>
          <Segmented
            label="Vizualizare"
            value={view}
            onChange={setView}
            options={[
              { value: "zi", label: "Zi" },
              { value: "saptamana", label: "Săptămână" },
              { value: "agenda", label: "Agendă" },
            ]}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Formulare" description="Etichetă deasupra, ajutor dedesubt, eroare explicită." />
        <CardBody className="flex flex-col gap-5">
          <Field id="demo-title" label="Titlu" hint="Ex. Tema 3 — liste înlănțuite">
            <Input id="demo-title" placeholder="Ce ai de făcut?" aria-describedby="demo-title-hint" />
          </Field>
          <Field id="demo-error" label="Data" error="Alege o dată din viitor.">
            <Input id="demo-error" defaultValue="12.10.2026" aria-invalid aria-describedby="demo-error-error" />
          </Field>
          <Field id="demo-select" label="Tip">
            <Select id="demo-select" defaultValue="examen">
              <option value="tema">Temă</option>
              <option value="examen">Examen</option>
            </Select>
          </Field>
          <Field id="demo-disabled" label="Dezactivat">
            <Input id="demo-disabled" disabled defaultValue="Nu poate fi modificat" />
          </Field>
          <Field id="demo-notes" label="Notițe" optional>
            <Textarea id="demo-notes" placeholder="Opțional" />
          </Field>
        </CardBody>
      </Card>

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader title="Mesaje" />
          <CardBody className="flex flex-col gap-3">
            <Alert tone="info">Propunerea nu se salvează până nu apeși Confirmă.</Alert>
            <Alert tone="success" title="Salvat">3 sesiuni au fost adăugate în calendar.</Alert>
            <Alert tone="warning" title="Nu încape realist">Ai nevoie de ~6 ore, dar până vineri ai 4 ore libere.</Alert>
            <Alert tone="danger" title="Nu am putut salva">Una dintre sesiuni se suprapune cu laboratorul de joi.</Alert>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Încărcare și dialog" />
          <CardBody className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <Button variant="secondary" onClick={() => setOpen(true)} className="self-start">
              Deschide dialogul
            </Button>
          </CardBody>
        </Card>
      </div>

      <Card className="lg:col-span-2">
        <EmptyState
          icon={<Plus />}
          title="Stare goală"
          description="Spune ce lipsește și oferă pasul următor, fără vină și fără jargon."
          action={<Button size="sm">Acțiunea evidentă</Button>}
        />
      </Card>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Adaugă un examen"
        description="Pe telefon apare ca foaie de jos; butoanele rămân deasupra tastaturii."
        footer={
          <>
            <Button variant="secondary" size="lg" onClick={() => setOpen(false)}>
              Anulează
            </Button>
            <Button size="lg" onClick={() => setOpen(false)}>
              Salvează
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <Field id="dlg-title" label="Materie">
            <Input id="dlg-title" defaultValue="Probabilități și statistică" />
          </Field>
          <Field id="dlg-date" label="Data și ora">
            <Input id="dlg-date" type="datetime-local" />
          </Field>
        </div>
      </Dialog>
    </div>
  );
}
