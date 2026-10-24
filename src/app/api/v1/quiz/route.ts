// src/app/api/v1/quiz/route.ts
// GET /api/v1/quiz?theme=entretiens|droit_du_travail : questions d'un quiz,
// dans l'ordre. Repli sur les questions d'origine du site si la base est vide.

import { NextRequest } from "next/server";
import { apiError, apiJson, apiOptions, handleGet, textParam } from "@/lib/api/http";
import { readCollection } from "@/lib/api/server-data";
import { toApiQuiz } from "@/lib/api/serializers";
import { INITIAL_QUIZ } from "@/lib/quiz-content";
import { QUIZ_THEME_LABELS } from "@/types/quiz";

export const runtime = "nodejs";

export function GET(req: NextRequest) {
  return handleGet(req, async () => {
    const theme = textParam(req, "theme", 40);
    if (!(theme in QUIZ_THEME_LABELS)) return apiError(400, "Paramètre « theme » requis : entretiens ou droit_du_travail.");
    const docs = await readCollection("quiz");
    let data = docs.map(toApiQuiz).filter((q) => q.theme === theme && q.options.length >= 2);
    if (data.length === 0) data = INITIAL_QUIZ.filter((q) => q.theme === theme).map((q) => toApiQuiz({ ...q }));
    data.sort((a, b) => a.order - b.order);
    return apiJson({ data }, 3600);
  });
}

export const OPTIONS = apiOptions;
