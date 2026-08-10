/**
 * A conditional navigation rule for a section's `next`.
 *
 * `{ when, go }` jumps to section `go` when the expression `when` is truthy;
 * `{ else }` is the fallback target when no earlier rule matched.
 */
export type IDeclarativeFormNextRule =
  | { when: string; go: string }
  | { else: string };
