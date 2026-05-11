import { createContext, useContext, useState, useCallback } from 'react'

const STORAGE_KEY = 'keepup_user_photo'

type UserPhotoContextType = {
  photoUrl: string | null
  setPhoto: (url: string | null) => void
  resetPhoto: () => void
}

const UserPhotoContext = createContext<UserPhotoContextType>({ photoUrl: null, setPhoto: () => {}, resetPhoto: () => {} })

export function UserPhotoProvider({ children }: { children: React.ReactNode }) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY)
  )

  function setPhoto(url: string | null) {
    setPhotoUrl(url)
    if (url) localStorage.setItem(STORAGE_KEY, url)
    else localStorage.removeItem(STORAGE_KEY)
  }

  const resetPhoto = useCallback(() => {
    setPhotoUrl(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return (
    <UserPhotoContext.Provider value={{ photoUrl, setPhoto, resetPhoto }}>
      {children}
    </UserPhotoContext.Provider>
  )
}

export function useUserPhoto() {
  return useContext(UserPhotoContext)
}
