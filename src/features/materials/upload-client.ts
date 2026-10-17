import { publicEnv } from "@/lib/env";

// Încărcarea în browser, direct în Supabase Storage, prin URL-ul semnat primit de la server.
// XMLHttpRequest (nu fetch) pentru că oferă progresul încărcării.

export class UploadError extends Error {
  constructor(
    message: string,
    readonly aborted = false,
  ) {
    super(message);
  }
}

export function uploadToSignedUrl(
  url: string,
  body: Blob,
  contentType: string,
  { onProgress, signal }: { onProgress?: (fraction: number) => void; signal?: AbortSignal } = {},
) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.setRequestHeader("x-upsert", "false");
    if (publicEnv.supabaseKey) xhr.setRequestHeader("apikey", publicEnv.supabaseKey);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) onProgress?.(Math.min(1, e.loaded / e.total));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(1);
        resolve();
      } else {
        reject(new UploadError(messageForStatus(xhr.status, xhr.responseText)));
      }
    };
    xhr.onerror = () => reject(new UploadError("Conexiunea s-a întrerupt. Verifică internetul și încearcă din nou."));
    xhr.ontimeout = () => reject(new UploadError("Încărcarea durează prea mult. Încearcă din nou."));
    xhr.onabort = () => reject(new UploadError("Încărcare anulată.", true));

    if (signal) {
      if (signal.aborted) return xhr.abort();
      signal.addEventListener("abort", () => xhr.abort(), { once: true });
    }
    xhr.send(body);
  });
}

function messageForStatus(status: number, body: string) {
  if (status === 413 || /too large|maximum allowed size/i.test(body)) return "Fișierul depășește 20 MB.";
  if (/mime type|not supported/i.test(body)) return "Formatul fișierului nu este acceptat.";
  if (status === 400 && /exists|duplicate/i.test(body)) return "Fișierul a fost deja încărcat. Reîncarcă pagina.";
  if (status === 401 || status === 403) return "Sesiunea a expirat. Reîncarcă pagina și încearcă din nou.";
  return "Nu am putut încărca fișierul. Încearcă din nou.";
}

/** Primii octeți ai unui fișier (pentru verificarea semnăturii, fără a-l citi întreg). */
export async function readHead(file: Blob, length = 8) {
  return new Uint8Array(await file.slice(0, length).arrayBuffer());
}
