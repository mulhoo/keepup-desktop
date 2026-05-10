export interface AuditEntry {
  id: number
  accessor_name: string
  accessor_role: string
  accessed_user_name: string
  resource_type: string
  reason: string
  school_name: string
  school_id: number
  sport_name?: string
  occurred_at: string
  anomaly_flagged: boolean
  anomaly_score?: number
  anomaly_reason?: string
}

const d = (daysAgo: number) =>
  new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString()

const MOCK_ENTRIES: AuditEntry[] = [
  // ── Alfred High School ──
  {
    id: 1,
    accessor_name:      'Chris Nguyen',
    accessor_role:      'head_coach',
    accessed_user_name: 'Jordan Lee',
    resource_type:      'DM History',
    reason:             'Conduct concern',
    school_name:        'Alfred High School',
    school_id:          1,
    sport_name:         'Girls Swimming',
    occurred_at:        d(1),
    anomaly_flagged:    true,
    anomaly_score:      0.81,
    anomaly_reason:     'Accessor has accessed this student\'s DM history 3 times in 72 hours with escalating stated reasons. Pattern suggests monitoring behaviour warranting review.',
  },
  {
    id: 2,
    accessor_name:      'Chris Nguyen',
    accessor_role:      'head_coach',
    accessed_user_name: 'Jordan Lee',
    resource_type:      'DM History',
    reason:             'Safety issue',
    school_name:        'Alfred High School',
    school_id:          1,
    sport_name:         'Girls Swimming',
    occurred_at:        d(2),
    anomaly_flagged:    false,
  },
  {
    id: 3,
    accessor_name:      'Chris Nguyen',
    accessor_role:      'head_coach',
    accessed_user_name: 'Jordan Lee',
    resource_type:      'DM History',
    reason:             'Conduct concern',
    school_name:        'Alfred High School',
    school_id:          1,
    sport_name:         'Girls Swimming',
    occurred_at:        d(3),
    anomaly_flagged:    false,
  },
  {
    id: 4,
    accessor_name:      'Mike Torres',
    accessor_role:      'athletic_director',
    accessed_user_name: 'Jordan Lee',
    resource_type:      'Student Profile',
    reason:             'Administrative review',
    school_name:        'Alfred High School',
    school_id:          1,
    sport_name:         'Girls Swimming',
    occurred_at:        d(4),
    anomaly_flagged:    false,
  },
  {
    id: 5,
    accessor_name:      'Dana Patel',
    accessor_role:      'assistant_coach',
    accessed_user_name: 'Taylor Brooks',
    resource_type:      'Channel Messages',
    reason:             'Conduct concern',
    school_name:        'Alfred High School',
    school_id:          1,
    sport_name:         'Girls Swimming',
    occurred_at:        d(6),
    anomaly_flagged:    false,
  },
  // ── Baldwin High School (district admin sees these) ──
  {
    id: 6,
    accessor_name:      'Rachel Kim',
    accessor_role:      'athletic_director',
    accessed_user_name: 'Sam Mitchell',
    resource_type:      'DM History',
    reason:             'Parent request',
    school_name:        'Baldwin High School',
    school_id:          2,
    sport_name:         'Boys Basketball',
    occurred_at:        d(2),
    anomaly_flagged:    false,
  },
  {
    id: 7,
    accessor_name:      'Tony Rivera',
    accessor_role:      'head_coach',
    accessed_user_name: 'Jade Brown',
    resource_type:      'Channel Messages',
    reason:             'Safety issue',
    school_name:        'Baldwin High School',
    school_id:          2,
    sport_name:         'Boys Basketball',
    occurred_at:        d(5),
    anomaly_flagged:    false,
  },
  // ── Crest High School (district admin sees these) ──
  {
    id: 8,
    accessor_name:      'Luis Castillo',
    accessor_role:      'head_coach',
    accessed_user_name: 'Nina Flores',
    resource_type:      'DM History',
    reason:             'Conduct concern',
    school_name:        'Crest High School',
    school_id:          3,
    sport_name:         'Boys Soccer',
    occurred_at:        d(1),
    anomaly_flagged:    false,
  },
]

const SCHOOL_ID_FOR_ROLE: Record<string, number> = {
  athletic_director: 1,
  school_admin:      1,
}

export async function fetchAuditLog(demoRole: string): Promise<AuditEntry[]> {
  await new Promise(r => setTimeout(r, 180))
  if (demoRole === 'district_admin') return MOCK_ENTRIES
  const schoolId = SCHOOL_ID_FOR_ROLE[demoRole]
  return MOCK_ENTRIES.filter(e => e.school_id === schoolId)
}
