export type IGitHubFile = {
  file: string;
  id: string;
  owner: string;
  private?: boolean;
  ref?: string;
  repository: string;
};
