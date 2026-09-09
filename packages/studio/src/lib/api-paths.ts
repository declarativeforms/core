export function organizationPath(organizationId: string): string {
  return `organizations/${encodeURIComponent(organizationId)}`;
}

export function formsPath(organizationId: string): string {
  return `${organizationPath(organizationId)}/forms`;
}

export function generatePath(organizationId: string): string {
  return `${formsPath(organizationId)}/generate`;
}

export function formPath(organizationId: string, formId: string): string {
  return `${formsPath(organizationId)}/${encodeURIComponent(formId)}`;
}

export function branchesPath(organizationId: string, formId: string): string {
  return `${formPath(organizationId, formId)}/branches`;
}

export function branchPath(
  organizationId: string,
  formId: string,
  branch: string,
): string {
  return `${branchesPath(organizationId, formId)}/${encodeURIComponent(branch)}`;
}

export function branchYamlPath(
  organizationId: string,
  formId: string,
  branch: string,
): string {
  return `${branchPath(organizationId, formId, branch)}/yaml`;
}

export function publishPath(
  organizationId: string,
  formId: string,
  branch: string,
): string {
  return `${branchPath(organizationId, formId, branch)}/publish`;
}

export function messagesPath(
  organizationId: string,
  formId: string,
  branch: string,
): string {
  return `${branchPath(organizationId, formId, branch)}/messages`;
}

export function messagesPageQuery(
  limit: number,
  cursor: string | null,
): string {
  const query = new URLSearchParams();
  query.set('limit', String(limit));

  if (cursor !== null) {
    query.set('cursor', cursor);
  }

  return query.toString();
}

export function membersPath(organizationId: string): string {
  return `${organizationPath(organizationId)}/members`;
}

export function memberPath(organizationId: string, email: string): string {
  return `${membersPath(organizationId)}/${encodeURIComponent(email)}`;
}

export function authorizePath(redirectUri: string): string {
  const query = new URLSearchParams();
  query.set('redirect_uri', redirectUri);

  return `auth/github/authorize?${query.toString()}`;
}
