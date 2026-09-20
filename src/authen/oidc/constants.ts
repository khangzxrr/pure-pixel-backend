export const META_UNPROTECTED = 'unprotected';
export const META_SKIP_AUTH = 'skip-auth';
export const META_ROLES = 'roles';

export enum RoleMatchingMode {
  ALL = 'all',
  ANY = 'any',
}

//metadata attached by the @Roles decorator
export type RoleMetadata = {
  roles: string[];
  mode?: RoleMatchingMode;
};
