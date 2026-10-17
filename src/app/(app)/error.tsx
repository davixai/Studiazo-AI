"use client";

import { RotateCw } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="rounded-lg border border-line bg-surface">
      <EmptyState
        icon={<RotateCw />}
        title="Nu am putut încărca pagina"
        description="Poate fi o problemă temporară de conexiune. Datele tale nu au fost afectate."
        action={
          <>
            <Button onClick={reset}>Încearcă din nou</Button>
            <ButtonLink href="/azi" variant="secondary">
              Mergi la Azi
            </ButtonLink>
          </>
        }
      />
    </div>
  );
}
