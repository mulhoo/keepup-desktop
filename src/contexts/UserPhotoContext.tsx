import { createContext, useContext, useState } from 'react'

const STORAGE_KEY = 'keepup_user_photo'

type UserPhotoContextType = {
  photoUrl: string | null
  setPhoto: (url: string | null) => void
}

const UserPhotoContext = createContext<UserPhotoContextType>({ photoUrl: null, setPhoto: () => {} })

export function UserPhotoProvider({ children }: { children: React.ReactNode }) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY)
  )

  function setPhoto(url: string | null) {
    setPhotoUrl(url)
    if (url) localStorage.setItem(STORAGE_KEY, url)
    else localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <UserPhotoContext.Provider value={{ photoUrl, setPhoto }}>
      {children}
    </UserPhotoContext.Provider>
  )
}

export function useUserPhoto() {
  return useContext(UserPhotoContext)
}
