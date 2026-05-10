import type { Sport } from './sports'

export interface LinkedAccountSport extends Sport {
  coach_role: 'head_coach' | 'assistant_coach'
}

export interface LinkedAccount {
  id: number
  first_name: string
  last_name: string
  email: string
  school_name: string
  school_id: number
  district_name: string
  role: 'head_coach' | 'assistant_coach'
  status: 'pending' | 'accepted'
  linked_at?: string
  active_sports: LinkedAccountSport[]
}

export interface PendingInvitation {
  id: number
  email: string
  sent_at: string
}

// Base account info for each demo role (the account they authenticated with).
// Not a hierarchy marker — just the starting point before any district switch.
export const DEMO_BASE: Record<string, { school_name: string; district_name: string; email: string; role: string }> = {
  head_coach:      { school_name: 'Alfred High School', district_name: 'Hajos School District', email: 'coach.swim@ahs.edu',  role: 'head_coach'      },
  assistant_coach: { school_name: 'Alfred High School', district_name: 'Hajos School District', email: 'asst.swim@ahs.edu',   role: 'assistant_coach' },
}

const MOCK_LINKED: Record<string, LinkedAccount[]> = {
  head_coach: [
    // Head coach role at a different school in a different district
    {
      id: 1,
      first_name: 'Chris',
      last_name: 'Nguyen',
      email: 'cng@westfield.edu',
      school_name: 'Westfield High School',
      school_id: 10,
      district_name: 'Westfield Unified',
      role: 'head_coach',
      status: 'accepted',
      linked_at: '2025-09-01T00:00:00Z',
      active_sports: [
        {
          id: 10,
          name: 'Boys Swimming',
          school_id: 10,
          school_name: 'Westfield High School',
          season: 'winter',
          school_year: '2025-26',
          status: 'active',
          athlete_count: 9,
          coaches: [{ id: 101, first_name: 'Chris', last_name: 'Nguyen', role: 'head_coach' }],
          coach_role: 'head_coach',
        },
      ],
    },
    // Assistant coach role at yet another school in a third district
    {
      id: 2,
      first_name: 'Chris',
      last_name: 'Nguyen',
      email: 'c.nguyen@jeffersonacademy.org',
      school_name: 'Jefferson Academy',
      school_id: 20,
      district_name: 'Metro Independent Schools',
      role: 'assistant_coach',
      status: 'accepted',
      linked_at: '2025-10-15T00:00:00Z',
      active_sports: [
        {
          id: 20,
          name: 'Girls Swimming',
          school_id: 20,
          school_name: 'Jefferson Academy',
          season: 'winter',
          school_year: '2025-26',
          status: 'active',
          athlete_count: 11,
          coaches: [
            { id: 901, first_name: 'Priya', last_name: 'Mehta',  role: 'head_coach' },
            { id: 101, first_name: 'Chris', last_name: 'Nguyen', role: 'assistant_coach' },
          ],
          coach_role: 'assistant_coach',
        },
      ],
    },
  ],
}

const MOCK_PENDING: Record<string, PendingInvitation[]> = {
  head_coach: [],
}

export async function fetchLinkedAccounts(demoRole: string): Promise<LinkedAccount[]> {
  await new Promise(r => setTimeout(r, 150))
  return MOCK_LINKED[demoRole] ?? []
}

export async function fetchPendingInvitations(demoRole: string): Promise<PendingInvitation[]> {
  await new Promise(r => setTimeout(r, 100))
  return MOCK_PENDING[demoRole] ?? []
}
