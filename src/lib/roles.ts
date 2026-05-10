const ROLE_LEVEL: Record<string, number> = {
  district_admin:    5,
  school_admin:      4,
  athletic_director: 4,
  head_coach:        3,
  assistant_coach:   2,
  student_captain:   1,
  student:           0,
  parent:            0,
}

export function roleLevel(role: string | null | undefined): number {
  return role ? (ROLE_LEVEL[role] ?? 0) : 0
}

export function atLeast(role: string | null | undefined, min: string): boolean {
  return roleLevel(role) >= roleLevel(min)
}
