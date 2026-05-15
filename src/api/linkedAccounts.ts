import { api } from './client'
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

export interface DemoBase {
  school_name: string
  district_name: string
  email: string
  role: string
  managed_sport_names?: string[]
}

// Base account info for each demo role (the account they authenticated with).
// Not a hierarchy marker — just the starting point before any district switch.
export const DEMO_BASE: Record<string, DemoBase> = {
  head_coach:          { school_name: 'Alfred High School', district_name: 'Hajos School District', email: 'coach.swim@ahs.edu',      role: 'head_coach'        },
  assistant_coach:     { school_name: 'Alfred High School', district_name: 'Hajos School District', email: 'asst.swim@ahs.edu',       role: 'assistant_coach'   },
  athletic_director:   { school_name: 'Alfred High School', district_name: 'Hajos School District', email: 'ad@ahs.edu',              role: 'athletic_director' },
  school_admin:        { school_name: 'Alfred High School', district_name: 'Hajos School District', email: 'admin@ahs.edu',           role: 'school_admin'      },
  district_admin:      { school_name: '',                   district_name: 'Hajos School District', email: 'admin@hajos.edu',         role: 'district_admin'    },
  super_admin:         { school_name: '',                   district_name: 'Hajos School District', email: 'super@keepup.app',        role: 'super_admin'       },
  sports_commissioner: { school_name: '',                   district_name: 'Hajos School District', email: 'jeff.swim@kingcounty.gov', role: 'sports_commissioner', managed_sport_names: ['Swimming'] },
}

export async function fetchLinkedAccounts(): Promise<LinkedAccount[]> {
  return api.get<LinkedAccount[]>('/demo/linked-accounts')
}

export async function fetchPendingInvitations(): Promise<PendingInvitation[]> {
  return api.get<PendingInvitation[]>('/demo/linked-accounts/pending')
}
