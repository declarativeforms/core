/**
 * A best-effort progress hint for the current step.
 *
 * `position` is the 1-based index of the current section along the path taken
 * so far. `total` is the count of declared sections, an upper bound only:
 * conditional navigation may visit fewer, so it can overestimate.
 */
export type IRenderableProgress = {
  position: number;
  total?: number;
};
