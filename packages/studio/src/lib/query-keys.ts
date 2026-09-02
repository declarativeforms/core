export function sessionQueryKey(): Array<string> {
  return ['session'];
}

export function configQueryKey(): Array<string> {
  return ['config'];
}

export function formsQueryKey(organizationId: string): Array<string> {
  return ['forms', organizationId];
}

export function branchesQueryKey(
  organizationId: string,
  formId: string,
): Array<string> {
  return ['branches', organizationId, formId];
}

export function branchYamlQueryKey(
  organizationId: string,
  formId: string,
  branch: string,
  revision: number,
): Array<string> {
  return ['branch-yaml', organizationId, formId, branch, String(revision)];
}

export function messagesQueryKey(
  organizationId: string,
  formId: string,
  branch: string,
): Array<string> {
  return ['messages', organizationId, formId, branch];
}
