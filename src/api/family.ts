import { api } from './client'

export interface ChildCoach {
  name: string
  role: 'head_coach' | 'assistant_coach'
}

export interface ChildAnnouncement {
  id: number
  content: string
  sender_name: string
  sent_at: string
}

export interface ChildSport {
  season_id: number
  sport_name: string
  level: string
  school_name: string
  season_name: string
  athletic_season: 'fall' | 'winter' | 'spring'
  coaches: ChildCoach[]
  recent_announcements: ChildAnnouncement[]
}

export interface Child {
  id: number
  first_name: string
  last_name: string
  sports: ChildSport[]
}

const MOCK_FAMILY: Child[] = [
  {
    id: 1,
    first_name: 'Jordan',
    last_name: 'Lee',
    sports: [
      {
        season_id: 1,
        sport_name: 'Girls Swimming',
        level: 'Varsity',
        school_name: 'Alfred High School',
        season_name: 'Swimming 2025-26',
        athletic_season: 'fall',
        coaches: [
          { name: 'Chris Nguyen', role: 'head_coach' },
          { name: 'Dana Patel',   role: 'assistant_coach' },
        ],
        recent_announcements: [
          {
            id: 1,
            content: 'Welcome to the 2025-26 swim season! First practice is Monday at 6am. Bring your own cap and goggles.',
            sender_name: 'Chris Nguyen',
            sent_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 2,
            content: 'Reminder: all athletes need updated physical forms submitted to the front office before Friday.',
            sender_name: 'Chris Nguyen',
            sent_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 3,
            content: 'Meet schedule for November is posted on the school athletics page. First away meet is Nov 14 @ Baldwin — bus departs at 3:30pm sharp.',
            sender_name: 'Dana Patel',
            sent_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ],
      },
    ],
  },
  {
    id: 2,
    first_name: 'Casey',
    last_name: 'Lee',
    sports: [
      {
        season_id: 2,
        sport_name: 'Boys Water Polo',
        level: 'Varsity',
        school_name: 'Alfred High School',
        season_name: 'Water Polo 2025-26',
        athletic_season: 'spring',
        coaches: [
          { name: 'Sam Rivera', role: 'head_coach' },
        ],
        recent_announcements: [
          {
            id: 4,
            content: 'Welcome to the water polo season! Cap fittings are Tuesday after school in the pool office.',
            sender_name: 'Sam Rivera',
            sent_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 5,
            content: 'First scrimmage is March 14th at home. Parents are welcome to attend.',
            sender_name: 'Sam Rivera',
            sent_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ],
      },
    ],
  },
]

export async function fetchFamily(): Promise<Child[]> {
  await new Promise(r => setTimeout(r, 150))
  return MOCK_FAMILY
}

export const fetchFamilyFromApi = () =>
  api.get<Child[]>('/family')
