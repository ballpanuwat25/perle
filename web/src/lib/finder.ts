import { RANGE, type Product } from "./range";

// The routine finder: three questions about how skin feels and what the visitor likes, never
// about conditions. Each answer leans toward a texture; the answers pick 1-3 products, in the
// order they go on.
type Lean = Partial<Record<Product["id"], number>>;
export type Question = { id: string; ask: string; answers: { label: string; lean: Lean; count?: number }[] };

export const QUESTIONS: Question[] = [
  {
    id: "after-wash",
    ask: "An hour after washing, your skin feels…",
    answers: [
      { label: "Tight", lean: { oil: 2, serum: 1 } },
      { label: "Comfortable", lean: { serum: 2, gel: 1 } },
      { label: "Shiny", lean: { gel: 2 } },
    ],
  },
  {
    id: "texture",
    ask: "On your skin, you like…",
    answers: [
      { label: "Barely there", lean: { gel: 2 } },
      { label: "Silky", lean: { serum: 2 } },
      { label: "A little slip", lean: { oil: 2 } },
    ],
  },
  {
    id: "steps",
    ask: "How many steps do you want?",
    answers: [
      { label: "Just one", lean: {}, count: 1 },
      { label: "Two", lean: {}, count: 2 },
      { label: "All three", lean: {}, count: 3 },
    ],
  },
];

export function pick(answers: number[]): Product[] {
  const score: Record<string, number> = { gel: 0, serum: 0, oil: 0 };
  let count = 1;
  answers.forEach((a, q) => {
    const answer = QUESTIONS[q].answers[a];
    for (const [id, n] of Object.entries(answer.lean)) score[id] += n ?? 0;
    if (answer.count) count = answer.count;
  });
  // the strongest leans win; ties go to the thinner texture
  const chosen = [...RANGE].sort((a, b) => score[b.id] - score[a.id]).slice(0, count);
  return RANGE.filter((p) => chosen.includes(p));
}
