export type FormSource = 'github' | 'studio';

export type IFormRecord = {
  id: string;
  source: FormSource;
  owner?: string;
  repository?: string;
  file?: string;
  connection_id?: string;
};
