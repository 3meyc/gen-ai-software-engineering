import type { Ticket, TicketCategory, TicketPriority } from "./types.js";

export type ClassificationResult = {
  category: TicketCategory;
  priority: TicketPriority;
  confidence: number;
  reasoning: string;
  keywords_found: string[];
};

/** Category keyword vocabulary (case-insensitive substring match on subject + description). */
export const CATEGORY_KEYWORDS: Record<Exclude<TicketCategory, "other">, readonly string[]> = {
  account_access: [
    "login",
    "log in",
    "sign in",
    "sign-in",
    "password",
    "2fa",
    "two-factor",
    "two factor",
    "access denied",
    "credentials",
    "locked out",
    "account locked",
    "reset password",
    "authentication",
    "unauthorized",
    "can't log in",
    "cannot log in",
  ],
  /** Non-critical / minor problems — glitches, slowness, intermittent errors. */
  technical_issue: [
    "issue",
    "minor issue",
    "glitch",
    "slow",
    "slowness",
    "intermittent",
    "timeout",
    "latency",
    "degraded",
    "malfunction",
    "error message",
    "not working properly",
    "weird behavior",
    "performance problem",
  ],
  /** Process-breaking defects — something broke or stopped working. */
  bug_report: [
    "bug",
    "broke",
    "broken",
    "crash",
    "crashed",
    "stop",
    "stopped",
    "stops working",
    "halt",
    "halted",
    "frozen",
    "cannot proceed",
    "can't proceed",
    "reproduce",
    "steps to reproduce",
    "regression",
    "defect",
    "workflow stopped",
    "completely fails",
    "fail to load",
  ],
  billing_question: [
    "payment",
    "invoice",
    "refund",
    "charge",
    "billing",
    "subscription",
    "receipt",
    "overcharged",
    "credit card",
    "double charged",
  ],
  feature_request: [
    "feature",
    "enhancement",
    "suggestion",
    "would like",
    "add support",
    "improvement",
    "wishlist",
    "new functionality",
    "feature request",
  ],
};

/** Priority phrases — highest matched severity wins. */
export const PRIORITY_KEYWORDS: Record<
  Exclude<TicketPriority, "medium">,
  readonly string[]
> = {
  urgent: ["can't access", "critical", "production down", "security"],
  high: ["important", "blocking", "asap"],
  low: ["minor", "cosmetic", "suggestion"],
};

const CATEGORY_ORDER: Exclude<TicketCategory, "other">[] = [
  "account_access",
  "bug_report",
  "technical_issue",
  "billing_question",
  "feature_request",
];

const PRIORITY_SEVERITY: Record<TicketPriority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

function ticketText(ticket: Pick<Ticket, "subject" | "description" | "tags">): string {
  const tagText = ticket.tags.length > 0 ? ` ${ticket.tags.join(" ")}` : "";
  return `${ticket.subject} ${ticket.description}${tagText}`.toLowerCase();
}

function findKeywords(text: string, phrases: readonly string[]): string[] {
  const found: string[] = [];
  for (const phrase of phrases) {
    if (text.includes(phrase.toLowerCase())) {
      found.push(phrase);
    }
  }
  return found;
}

function scoreCategories(text: string): Map<TicketCategory, string[]> {
  const scores = new Map<TicketCategory, string[]>();
  for (const category of CATEGORY_ORDER) {
    const keywords = findKeywords(text, CATEGORY_KEYWORDS[category]);
    if (keywords.length > 0) {
      scores.set(category, keywords);
    }
  }
  return scores;
}

function pickCategory(scores: Map<TicketCategory, string[]>): {
  category: TicketCategory;
  keywords: string[];
  winnerScore: number;
  secondScore: number;
} {
  if (scores.size === 0) {
    return { category: "other", keywords: [], winnerScore: 0, secondScore: 0 };
  }

  let best: TicketCategory = "other";
  let bestKeywords: string[] = [];
  let bestScore = 0;
  let secondScore = 0;

  for (const category of CATEGORY_ORDER) {
    const keywords = scores.get(category);
    if (!keywords) continue;
    const score = keywords.length;
    if (score > bestScore) {
      secondScore = bestScore;
      bestScore = score;
      best = category;
      bestKeywords = keywords;
    } else if (score > secondScore) {
      secondScore = score;
    }
  }

  return { category: best, keywords: bestKeywords, winnerScore: bestScore, secondScore };
}

function pickPriority(text: string): { priority: TicketPriority; keywords: string[] } {
  let best: TicketPriority = "medium";
  let bestSeverity = PRIORITY_SEVERITY.medium;
  const keywords: string[] = [];

  for (const level of ["urgent", "high", "low"] as const) {
    const matched = findKeywords(text, PRIORITY_KEYWORDS[level]);
    if (matched.length > 0 && PRIORITY_SEVERITY[level] > bestSeverity) {
      best = level;
      bestSeverity = PRIORITY_SEVERITY[level];
      keywords.length = 0;
      keywords.push(...matched);
    }
  }

  return { priority: best, keywords };
}

/**
 * Confidence tiers (documented in spec):
 * - 0.95 — very confident
 * - 0.60 — somewhat confident
 * - 0.30 — low confidence; likely needs human review
 */
export function computeConfidence(
  category: TicketCategory,
  winnerScore: number,
  secondScore: number,
): number {
  if (category === "other") return 0.3;
  if (winnerScore >= 3 || (winnerScore >= 2 && winnerScore - secondScore >= 2)) return 0.95;
  if (winnerScore >= 2 || (winnerScore >= 1 && secondScore === 0)) return 0.6;
  return 0.3;
}

export function classifyTicket(
  ticket: Pick<Ticket, "subject" | "description" | "tags">,
): ClassificationResult {
  const text = ticketText(ticket);
  const categoryScores = scoreCategories(text);
  const { category, keywords: categoryKeywords, winnerScore, secondScore } =
    pickCategory(categoryScores);
  const { priority, keywords: priorityKeywords } = pickPriority(text);

  const keywords_found = [...new Set([...categoryKeywords, ...priorityKeywords])];
  const confidence = computeConfidence(category, winnerScore, secondScore);

  const reasoning =
    category === "other"
      ? "No strong category keyword matches; assigned other with medium priority unless urgency phrases matched."
      : `Matched category "${category}" (${categoryKeywords.join(", ") || "none"})` +
        (priorityKeywords.length > 0
          ? `; priority "${priority}" (${priorityKeywords.join(", ")})`
          : `; priority "${priority}" (default)`);

  return {
    category,
    priority,
    confidence,
    reasoning,
    keywords_found,
  };
}

export function applyClassificationToTicket(
  ticket: Ticket,
  result: ClassificationResult,
): Ticket {
  return {
    ...ticket,
    category: result.category,
    priority: result.priority,
    classification_confidence: result.confidence,
    classification_reasoning: result.reasoning,
    classification_keywords: result.keywords_found,
    updated_at: new Date().toISOString(),
  };
}

export function clearClassificationMetadata(ticket: Ticket): Ticket {
  return {
    ...ticket,
    classification_confidence: null,
    classification_reasoning: null,
    classification_keywords: [],
  };
}
