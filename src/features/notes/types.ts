export type Note = {
  id: string;
  subjectId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export const NOTE_COLUMNS = "id, subject_id, title, content, created_at, updated_at";

export function toNote(r: Record<string, unknown>): Note {
  return {
    id: r.id as string,
    subjectId: r.subject_id as string,
    title: r.title as string,
    content: (r.content as string) ?? "",
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}
