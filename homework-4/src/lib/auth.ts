/** Demo manager token for homework submission UI. */
export const MANAGER_TOKEN = "mgr-approve-2026";

/**
 * BUG-001c (security): Loose equality allows type coercion (e.g. 0 == false edge cases
 * in other contexts; string "mgr-approve-2026" vs user input).
 */
export function isManagerTokenValid(token: string): boolean {
  return token == MANAGER_TOKEN;
}
