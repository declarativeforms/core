export type IOrganizationRole = 'admin' | 'member';

export type IOrganizationMember = {
  email: string;
  role: IOrganizationRole;
};

export type IOrganization = {
  id: string;
  name: string;
  slug: string;
  members: Array<IOrganizationMember>;
  tags: Array<string>;
  created_at: Date;
  created_by: string;
  updated_at: Date;
};
