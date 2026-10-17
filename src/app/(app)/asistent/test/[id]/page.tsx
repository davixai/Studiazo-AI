import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { QuizRunner } from "@/features/quizzes/components/quiz-runner";
import { getQuiz } from "@/features/quizzes/queries";
import { listSubjects } from "@/features/subjects/queries";

export const metadata: Metadata = { title: "Test grilă" };

export default async function QuizPage({ params }: PageProps<"/asistent/test/[id]">) {
  const { id } = await params;
  const [stored, subjects] = await Promise.all([getQuiz(id), listSubjects()]);
  if (!stored) notFound();
  const subject = subjects.find((s) => s.id === stored.subjectId);

  return (
    <QuizRunner
      quizId={stored.id}
      quiz={stored.quiz}
      subject={{ id: stored.subjectId, name: subject?.name ?? "Materie" }}
    />
  );
}
