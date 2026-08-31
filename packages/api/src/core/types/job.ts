export type IJob<T = unknown> = {
  id: string;
  event: string;
  data: T;
  run_at: Date;
};
