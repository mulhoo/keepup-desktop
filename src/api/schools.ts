interface StaffMember { first_name: string; last_name: string; email: string }

export interface School {
  id: number
  name: string
  district_id: number
  district_name: string
  sport_count: number
  member_count: number
  principal?: StaffMember
  athletic_director?: StaffMember
}

const MOCK_SCHOOLS: School[] = [
  {
    id: 1,
    name: 'Alfred High School',
    district_id: 1,
    district_name: 'Hajos School District',
    sport_count: 2,
    member_count: 14,
    principal:         { first_name: 'Patricia', last_name: 'Hill',    email: 'phill@ahs.edu'    },
    athletic_director: { first_name: 'Mike',      last_name: 'Torres',  email: 'ad@ahs.edu'       },
  },
  {
    id: 2,
    name: 'Baldwin High School',
    district_id: 1,
    district_name: 'Hajos School District',
    sport_count: 2,
    member_count: 20,
    principal:         { first_name: 'James',  last_name: 'Crawford', email: 'jcrawford@bhs.edu' },
    athletic_director: { first_name: 'Rachel', last_name: 'Kim',      email: 'ad@bhs.edu'        },
  },
  {
    id: 3,
    name: 'Crest High School',
    district_id: 1,
    district_name: 'Hajos School District',
    sport_count: 2,
    member_count: 17,
    principal:         { first_name: 'Yuki', last_name: 'Nakano',  email: 'ynakano@chs.edu'  },
    athletic_director: { first_name: 'Luis', last_name: 'Ortega',  email: 'lortega@chs.edu'  },
  },
]

export async function fetchSchools(): Promise<School[]> {
  await new Promise(r => setTimeout(r, 200))
  return MOCK_SCHOOLS
}

export async function fetchSchool(schoolId: number): Promise<School> {
  await new Promise(r => setTimeout(r, 150))
  const school = MOCK_SCHOOLS.find(s => s.id === schoolId)
  if (!school) throw new Error(`School ${schoolId} not found`)
  return school
}
