import { formatDayShort, formatTime } from "@/lib/time/format";
import { checkFile, MAX_FILE_BYTES, STORED_IMAGE_MIME } from "./schemas";
import { UploadError } from "./upload-client";

// Pregătirea pozelor în browser, înainte de încărcare: micșorare, JPEG, miniatură.
// Re-encodarea prin canvas elimină și metadatele EXIF (inclusiv locația GPS).

export const IMAGE_MAX_SIDE = 2000;
export const THUMB_MAX_SIDE = 480;
const IMAGE_QUALITY = 0.85;
const THUMB_QUALITY = 0.8;

/** Dimensiunile finale: latura mare cel mult `max`, proporțiile păstrate, fără mărire. */
export function fitWithin(width: number, height: number, max: number) {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

async function decode(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode(); // browserele moderne aplică singure orientarea EXIF (poza de pe telefon nu iese culcată)
    return img;
  } catch {
    throw new UploadError(`Nu am putut citi „${file.name}”. Folosește o poză JPEG, PNG sau WebP.`);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function render(img: HTMLImageElement, max: number, quality: number) {
  const { width, height } = fitWithin(img.naturalWidth, img.naturalHeight, max);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new UploadError("Browserul nu poate pregăti poza. Încearcă din alt browser.");
  ctx.fillStyle = "white"; // PNG-urile transparente nu devin negre în JPEG
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new UploadError("Nu am putut pregăti poza. Încearcă din nou."))),
      STORED_IMAGE_MIME,
      quality,
    ),
  );
}

export async function prepareImage(file: File) {
  const problem = checkFile(file, "image");
  if (problem) throw new UploadError(problem);
  const img = await decode(file);
  if (!img.naturalWidth || !img.naturalHeight) throw new UploadError(`„${file.name}” pare goală.`);

  const [body, thumb] = await Promise.all([render(img, IMAGE_MAX_SIDE, IMAGE_QUALITY), render(img, THUMB_MAX_SIDE, THUMB_QUALITY)]);
  if (body.size > MAX_FILE_BYTES) throw new UploadError("Poza e prea mare chiar și după micșorare.");

  const now = new Date();
  return { body, contentType: STORED_IMAGE_MIME, title: `Poză · ${formatDayShort(now)}, ${formatTime(now)}`, thumb };
}
