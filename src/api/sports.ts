export type MemberRole = 'head_coach' | 'assistant_coach' | 'student_captain' | 'student'

export interface ParentContact {
  name: string
  email: string
  phone?: string
  relationship?: string
}

export interface SportMember {
  user_id: number      // consistent user identity across all sports
  first_name: string
  last_name: string
  role: MemberRole     // sport-membership-specific, not a universal user attribute
  jersey_number?: string
  grade?: string
  graduated?: boolean
  email?: string
  phone?: string
  level?: 'varsity' | 'jv'
  position?: string
  parents?: ParentContact[]
}

export interface SportCoach {
  id: number
  first_name: string
  last_name: string
  role: 'head_coach' | 'assistant_coach'
}

export interface Sport {
  id: number
  name: string
  school_id: number
  school_name: string
  season: 'fall' | 'winter' | 'spring'
  school_year: string
  status: 'active' | 'completed' | 'pending'
  athlete_count: number
  coaches: SportCoach[]
}

export interface SportDetail extends Sport {
  members: SportMember[]
}

// ── User IDs are consistent across sports ─────────────────────────────────────
// 101  Chris Nguyen   — head coach, Girls Swimming AHS  (coach.swim@ahs.edu)
// 102  Dana Patel     — asst coach, Girls Swimming AHS  (asst.swim@ahs.edu)
// 103  Alex Rivera    — student captain, swim           (captain@ahs.student.edu)
// 104  Jordan Lee     — student, swim                   (student1@ahs.student.edu)
// 105  Taylor Brooks  — student, swim                   (student2@bhs.student.edu)
// 201  Sam Rivera     — head coach, Boys Water Polo AHS (coach.polo@ahs.edu)
// 202  Casey Lee      — student captain, polo           (student3@ahs.student.edu)

const MOCK_SPORTS: SportDetail[] = [
  // ── Alfred High School — Girls Swimming ───────────────────────────────────────
  {
    id: 1,
    name: 'Girls Swimming',
    school_id: 1,
    school_name: 'Alfred High School',
    season: 'winter',
    school_year: '2025-26',
    status: 'active',
    athlete_count: 0,
    coaches: [
      { id: 101, first_name: 'Chris', last_name: 'Nguyen', role: 'head_coach' },
      { id: 102, first_name: 'Dana',  last_name: 'Patel',  role: 'assistant_coach' },
    ],
    members: [
      { user_id: 101, first_name: 'Chris',  last_name: 'Nguyen',  role: 'head_coach' },
      { user_id: 102, first_name: 'Dana',   last_name: 'Patel',   role: 'assistant_coach' },
      { user_id: 103, first_name: 'Alex',   last_name: 'Rivera',  role: 'student_captain', jersey_number: '1',  grade: '12', level: 'varsity', email: 'captain@ahs.student.edu',        phone: '(650) 555-0103', position: 'Freestyle', parents: [{ name: 'Maria Rivera',   email: 'maria.rivera@email.com',   phone: '(650) 555-0193', relationship: 'Mother' }, { name: 'Carlos Rivera', email: 'carlos.rivera@email.com', phone: '(650) 555-0194', relationship: 'Father' }] },
      { user_id: 104, first_name: 'Jordan', last_name: 'Lee',     role: 'student',         jersey_number: '4',  grade: '11', level: 'varsity', email: 'student1@ahs.student.edu',       phone: '(650) 555-0104', position: 'Backstroke', parents: [{ name: 'Susan Lee',      email: 'susan.lee@email.com',      phone: '(650) 555-0195', relationship: 'Mother' }] },
      { user_id: 105, first_name: 'Taylor', last_name: 'Brooks',  role: 'student',         jersey_number: '7',  grade: '12', level: 'varsity', email: 'student2@bhs.student.edu',       phone: '(650) 555-0105', position: 'Butterfly',  parents: [{ name: 'David Brooks',   email: 'david.brooks@email.com',   phone: '(650) 555-0196', relationship: 'Father' }, { name: 'Linda Brooks',  email: 'linda.brooks@email.com',  phone: '(650) 555-0197', relationship: 'Mother' }] },
      { user_id: 106, first_name: 'Mia',    last_name: 'Santos',  role: 'student',         jersey_number: '9',  grade: '10', level: 'jv',      email: 'mia.santos@ahs.student.edu',     phone: '(650) 555-0106', position: 'Freestyle', parents: [{ name: 'Rosa Santos',    email: 'rosa.santos@email.com',    phone: '(650) 555-0198', relationship: 'Mother' }] },
      { user_id: 107, first_name: 'Ethan',  last_name: 'Park',    role: 'student',         jersey_number: '12', grade: '11', level: 'jv',      email: 'ethan.park@ahs.student.edu',     phone: '(650) 555-0107', position: 'Breaststroke', parents: [{ name: 'James Park',    email: 'james.park@email.com',     phone: '(650) 555-0199', relationship: 'Father' }, { name: 'Anne Park',     email: 'anne.park@email.com',     phone: '(650) 555-0200', relationship: 'Mother' }] },
      { user_id: 108, first_name: 'Zoe',    last_name: 'Kim',     role: 'student',         jersey_number: '15', grade: '9',  level: 'jv',      email: 'zoe.kim@ahs.student.edu',        phone: '(650) 555-0108', position: 'IM',        parents: [{ name: 'Paul Kim',      email: 'paul.kim@email.com',       phone: '(650) 555-0201', relationship: 'Father' }] },
    ],
  },
  // ── Girls Swimming — past seasons ─────────────────────────────────────────────
  {
    id: 2,
    name: 'Girls Swimming',
    school_id: 1,
    school_name: 'Alfred High School',
    season: 'winter',
    school_year: '2024-25',
    status: 'completed',
    athlete_count: 0,
    coaches: [
      { id: 101, first_name: 'Chris', last_name: 'Nguyen', role: 'head_coach' },
      { id: 102, first_name: 'Dana',  last_name: 'Patel',  role: 'assistant_coach' },
    ],
    members: [
      { user_id: 101, first_name: 'Chris',   last_name: 'Nguyen',  role: 'head_coach' },
      { user_id: 102, first_name: 'Dana',    last_name: 'Patel',   role: 'assistant_coach' },
      { user_id: 110, first_name: 'Leila',   last_name: 'Adams',   role: 'student_captain', jersey_number: '1',  grade: '12', level: 'varsity', graduated: true },
      { user_id: 111, first_name: 'Omar',    last_name: 'Diaz',    role: 'student',         jersey_number: '3',  grade: '11', level: 'varsity' },
      { user_id: 112, first_name: 'Nadia',   last_name: 'Petrov',  role: 'student',         jersey_number: '6',  grade: '10', level: 'varsity' },
      { user_id: 113, first_name: 'Caleb',   last_name: 'Ross',    role: 'student',         jersey_number: '8',  grade: '12', level: 'varsity', graduated: true },
      { user_id: 114, first_name: 'Imani',   last_name: 'Walker',  role: 'student',         jersey_number: '11', grade: '11', level: 'jv' },
      { user_id: 115, first_name: 'Soren',   last_name: 'Berg',    role: 'student',         jersey_number: '14', grade: '9',  level: 'jv' },
      { user_id: 116, first_name: 'Valeria', last_name: 'Cruz',    role: 'student',         jersey_number: '16', grade: '10', level: 'jv' },
    ],
  },
  {
    id: 3,
    name: 'Girls Swimming',
    school_id: 1,
    school_name: 'Alfred High School',
    season: 'winter',
    school_year: '2023-24',
    status: 'completed',
    athlete_count: 0,
    coaches: [
      { id: 101, first_name: 'Chris', last_name: 'Nguyen', role: 'head_coach' },
    ],
    members: [
      { user_id: 101, first_name: 'Chris',  last_name: 'Nguyen',  role: 'head_coach' },
      { user_id: 120, first_name: 'Priya',  last_name: 'Sharma',  role: 'student_captain', jersey_number: '1',  grade: '12', level: 'varsity', graduated: true },
      { user_id: 121, first_name: 'Ben',    last_name: 'Carter',  role: 'student',         jersey_number: '5',  grade: '11', level: 'varsity' },
      { user_id: 122, first_name: 'Yemi',   last_name: 'Adeyemi', role: 'student',         jersey_number: '9',  grade: '10', level: 'varsity' },
      { user_id: 123, first_name: 'Hana',   last_name: 'Kuroda',  role: 'student',         jersey_number: '12', grade: '12', level: 'jv',      graduated: true },
      { user_id: 124, first_name: 'Marcus', last_name: 'Webb',    role: 'student',         jersey_number: '17', grade: '9',  level: 'jv' },
      { user_id: 125, first_name: 'Taylor', last_name: 'Jordan',  role: 'student',         jersey_number: '21', grade: '10', level: 'jv' },
    ],
  },
  // ── Alfred High School — Boys Water Polo ─────────────────────────────────────
  {
    id: 4,
    name: 'Boys Water Polo',
    school_id: 1,
    school_name: 'Alfred High School',
    season: 'fall',
    school_year: '2025-26',
    status: 'completed',
    athlete_count: 0,
    coaches: [
      { id: 201, first_name: 'Sam', last_name: 'Rivera', role: 'head_coach' },
    ],
    members: [
      { user_id: 201, first_name: 'Sam',    last_name: 'Rivera',  role: 'head_coach' },
      { user_id: 202, first_name: 'Casey',  last_name: 'Lee',     role: 'student_captain', jersey_number: '1',  grade: '10', level: 'varsity', email: 'student3@ahs.student.edu' },
      { user_id: 203, first_name: 'Marcus', last_name: 'Hill',    role: 'student',         jersey_number: '5',  grade: '12', level: 'varsity' },
      { user_id: 204, first_name: 'Dion',   last_name: 'Carter',  role: 'student',         jersey_number: '8',  grade: '11', level: 'varsity' },
      { user_id: 205, first_name: 'Owen',   last_name: 'Clark',   role: 'student',         jersey_number: '11', grade: '10', level: 'jv' },
      { user_id: 206, first_name: 'Fatima', last_name: 'Hassan',  role: 'student',         jersey_number: '14', grade: '9',  level: 'jv' },
    ],
  },
  // ── Baldwin High School ───────────────────────────────────────────────────────
  // Sport 9: Boys Swimming BHS — Chris Nguyen is assistant coach here (same Hajos district)
  {
    id: 9,
    name: 'Boys Swimming',
    school_id: 2,
    school_name: 'Baldwin High School',
    season: 'winter',
    school_year: '2025-26',
    status: 'active',
    athlete_count: 0,
    coaches: [
      { id: 610, first_name: 'Tony',  last_name: 'Kim',    role: 'head_coach'      },
      { id: 101, first_name: 'Chris', last_name: 'Nguyen', role: 'assistant_coach' },
    ],
    members: [
      { user_id: 610, first_name: 'Tony',    last_name: 'Kim',      role: 'head_coach' },
      { user_id: 101, first_name: 'Chris',   last_name: 'Nguyen',   role: 'assistant_coach' },
      { user_id: 611, first_name: 'Marcus',  last_name: 'Tran',     role: 'student_captain', jersey_number: '1',  grade: '12', level: 'varsity', email: 'marcus.tran@bhs.student.edu',    phone: '(510) 555-0611', position: 'Freestyle',    parents: [{ name: 'Linh Tran',      email: 'linh.tran@email.com',      phone: '(510) 555-0711', relationship: 'Mother' }, { name: 'Duc Tran',       email: 'duc.tran@email.com',       phone: '(510) 555-0712', relationship: 'Father' }] },
      { user_id: 612, first_name: 'Leo',     last_name: 'Svensson', role: 'student',         jersey_number: '4',  grade: '11', level: 'varsity', email: 'leo.svensson@bhs.student.edu',   phone: '(510) 555-0612', position: 'Backstroke',   parents: [{ name: 'Erik Svensson',  email: 'erik.svensson@email.com',  phone: '(510) 555-0713', relationship: 'Father' }] },
      { user_id: 613, first_name: 'Aiden',   last_name: 'Mbeki',    role: 'student',         jersey_number: '7',  grade: '10', level: 'varsity', email: 'aiden.mbeki@bhs.student.edu',    phone: '(510) 555-0613', position: 'Butterfly',    parents: [{ name: 'Amina Mbeki',    email: 'amina.mbeki@email.com',    phone: '(510) 555-0714', relationship: 'Mother' }, { name: 'Kofi Mbeki',     email: 'kofi.mbeki@email.com',     phone: '(510) 555-0715', relationship: 'Father' }] },
      { user_id: 614, first_name: 'Carlos',  last_name: 'Reyes',    role: 'student',         jersey_number: '11', grade: '9',  level: 'jv',      email: 'carlos.reyes@bhs.student.edu',   phone: '(510) 555-0614', position: 'Breaststroke', parents: [{ name: 'Elena Reyes',    email: 'elena.reyes@email.com',    phone: '(510) 555-0716', relationship: 'Mother' }] },
      { user_id: 615, first_name: 'Patrick', last_name: 'Osei',     role: 'student',         jersey_number: '14', grade: '10', level: 'jv',      email: 'patrick.osei@bhs.student.edu',   phone: '(510) 555-0615', position: 'IM',           parents: [{ name: 'Kwame Osei',     email: 'kwame.osei@email.com',     phone: '(510) 555-0717', relationship: 'Father' }, { name: 'Abena Osei',     email: 'abena.osei@email.com',     phone: '(510) 555-0718', relationship: 'Mother' }] },
    ],
  },
  {
    id: 5,
    name: 'Girls Swimming',
    school_id: 2,
    school_name: 'Baldwin High School',
    season: 'winter',
    school_year: '2025-26',
    status: 'active',
    athlete_count: 0,
    coaches: [
      { id: 501, first_name: 'Rachel', last_name: 'Park', role: 'head_coach' },
    ],
    members: [
      { user_id: 501, first_name: 'Rachel', last_name: 'Park',    role: 'head_coach' },
      { user_id: 502, first_name: 'Alex',   last_name: 'Turner',  role: 'student_captain', jersey_number: '1', grade: '12', level: 'varsity' },
      { user_id: 503, first_name: 'Grace',  last_name: 'Okafor',  role: 'student',         jersey_number: '6', grade: '11', level: 'varsity' },
      { user_id: 504, first_name: 'Sofia',  last_name: 'Reyes',   role: 'student',         jersey_number: '9', grade: '10', level: 'jv' },
    ],
  },
  {
    id: 6,
    name: 'Boys Basketball',
    school_id: 2,
    school_name: 'Baldwin High School',
    season: 'winter',
    school_year: '2025-26',
    status: 'active',
    athlete_count: 0,
    coaches: [
      { id: 601, first_name: 'Tony', last_name: 'Rivera', role: 'head_coach' },
    ],
    members: [
      { user_id: 601, first_name: 'Tony',   last_name: 'Rivera',   role: 'head_coach' },
      { user_id: 602, first_name: 'Jade',   last_name: 'Brown',    role: 'student_captain', jersey_number: '4',  grade: '10' },
      { user_id: 603, first_name: 'Sam',    last_name: 'Mitchell', role: 'student',         jersey_number: '11', grade: '9'  },
      { user_id: 604, first_name: 'Devon',  last_name: 'Ellis',    role: 'student',         jersey_number: '23', grade: '11' },
    ],
  },
  // ── Crest High School ─────────────────────────────────────────────────────────
  {
    id: 7,
    name: 'Boys Soccer',
    school_id: 3,
    school_name: 'Crest High School',
    season: 'fall',
    school_year: '2025-26',
    status: 'completed',
    athlete_count: 0,
    coaches: [
      { id: 701, first_name: 'Luis', last_name: 'Castillo', role: 'head_coach' },
    ],
    members: [
      { user_id: 701, first_name: 'Luis',  last_name: 'Castillo', role: 'head_coach' },
      { user_id: 702, first_name: 'Theo',  last_name: 'Grant',    role: 'student_captain', jersey_number: '10', grade: '12' },
      { user_id: 703, first_name: 'Maya',  last_name: 'Osei',     role: 'student',         jersey_number: '7',  grade: '11' },
      { user_id: 704, first_name: 'Nina',  last_name: 'Flores',   role: 'student',         jersey_number: '3',  grade: '10' },
    ],
  },
  {
    id: 8,
    name: 'Track & Field',
    school_id: 3,
    school_name: 'Crest High School',
    season: 'spring',
    school_year: '2025-26',
    status: 'pending',
    athlete_count: 0,
    coaches: [
      { id: 801, first_name: 'Amara', last_name: 'Diallo', role: 'head_coach' },
      { id: 802, first_name: 'Scott', last_name: 'Hines',  role: 'assistant_coach' },
    ],
    members: [
      { user_id: 801, first_name: 'Amara', last_name: 'Diallo',  role: 'head_coach' },
      { user_id: 802, first_name: 'Scott', last_name: 'Hines',   role: 'assistant_coach' },
      { user_id: 803, first_name: 'Tanya', last_name: 'Bowers',  role: 'student_captain', jersey_number: '1',  grade: '12' },
      { user_id: 804, first_name: 'Ray',   last_name: 'Suarez',  role: 'student',         jersey_number: '14', grade: '10' },
      { user_id: 805, first_name: 'Kenji', last_name: 'Watanabe',role: 'student',         jersey_number: '22', grade: '11' },
    ],
  },
]

// Demo coach identity map — keyed by demoRole, then sportId → role held in that sport.
// head_coach  demo = Chris Nguyen  (coach.swim@ahs.edu):
//   - HC of Girls Swimming, AHS  (sport 1)
//   - Asst Coach of Boys Swimming, BHS (sport 9) — same Hajos district
// assistant_coach demo = Dana Patel (asst.swim@ahs.edu):
//   - Asst of Girls Swimming, AHS (sport 1)
export const DEMO_COACH_SPORTS: Partial<Record<string, Record<number, 'head_coach' | 'assistant_coach'>>> = {
  head_coach:      { 1: 'head_coach', 9: 'assistant_coach' },
  assistant_coach: { 1: 'assistant_coach' },
}

function countAthletes(members: SportMember[]) {
  return members.filter(m => m.role === 'student' || m.role === 'student_captain').length
}

export async function fetchSports(schoolId?: number): Promise<Sport[]> {
  await new Promise(r => setTimeout(r, 200))
  const filtered = schoolId ? MOCK_SPORTS.filter(s => s.school_id === schoolId) : MOCK_SPORTS
  return filtered.map(({ members, ...s }) => ({ ...s, athlete_count: countAthletes(members) }))
}

export async function fetchSportDetail(sportId: number): Promise<SportDetail> {
  await new Promise(r => setTimeout(r, 150))
  const sport = MOCK_SPORTS.find(s => s.id === sportId)
  if (!sport) throw new Error(`Sport ${sportId} not found`)
  return { ...sport, athlete_count: countAthletes(sport.members) }
}
