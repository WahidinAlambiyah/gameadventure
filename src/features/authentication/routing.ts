export type AuthenticatedProfile = {
  roles?: string[];
  permissions?: string[];
  onboardingComplete?: boolean;
  activeChildCount?: number;
};

export function resolvePostLoginPath(profile: AuthenticatedProfile) {
  const roles = profile.roles ?? [];
  const permissions = profile.permissions ?? [];

  if (
    roles.includes("SUPER_ADMIN") ||
    roles.includes("ADMIN") ||
    permissions.includes("admin:access")
  ) {
    return "/admin";
  }

  if (roles.length === 0 || roles.includes("PARENT")) {
    if (!profile.onboardingComplete || (profile.activeChildCount ?? 0) === 0) {
      return "/parent/children/new";
    }
    return "/parent";
  }

  return "/";
}
