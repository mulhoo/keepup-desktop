import { useRef, useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { Camera, X, ZoomIn, ZoomOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useUserPhoto } from '@/contexts/UserPhotoContext'
import { useProfile } from '@/contexts/ProfileContext'
import { DEMO_BASE } from '@/api/linkedAccounts'
import { useTranslationHelpers } from '@/lib/i18n'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

type Area = { x: number; y: number; width: number; height: number }

async function cropImageToDataUrl(imageSrc: string, pixelCrop: Area): Promise<string> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = imageSrc
  })
  const canvas = document.createElement('canvas')
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height)
  return canvas.toDataURL('image/jpeg', 0.92)
}

export default function UserProfile() {
  const { user, demoRole } = useAuth()
  const { photoUrl, setPhoto } = useUserPhoto()
  const { activeProfile } = useProfile()
  const { t } = useTranslationHelpers()
  const inputRef = useRef<HTMLInputElement>(null)

  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const base = DEMO_BASE[demoRole ?? '']
  const currentSchool   = activeProfile?.school_name   ?? base?.school_name   ?? '—'
  const currentDistrict = activeProfile?.district_name ?? base?.district_name ?? '—'
  const currentEmail    = activeProfile?.email         ?? user?.email         ?? '—'
  const roleLabel       = t(`roles.${demoRole}` as any) || demoRole?.replace(/_/g, ' ') || '—'
  const initials        = `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setCropSrc(ev.target?.result as string)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  async function handleSaveCrop() {
    if (!cropSrc || !croppedAreaPixels) return
    const cropped = await cropImageToDataUrl(cropSrc, croppedAreaPixels)
    setPhoto(cropped)
    setCropSrc(null)
  }

  return (
    <div className="p-8 max-w-lg mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account details.</p>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center ring-2 ring-border">
            {photoUrl
              ? <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
              : <span className="text-2xl font-bold text-primary select-none">{initials}</span>
            }
          </div>
          <label className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
            <Camera className="w-6 h-6 text-white" />
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => inputRef.current?.click()}
            className="text-xs text-primary hover:underline transition-colors"
          >
            {photoUrl ? 'Change photo' : 'Upload photo'}
          </button>
          {photoUrl && (
            <>
              <span className="text-muted-foreground/40 text-xs">·</span>
              <button
                onClick={() => setPhoto(null)}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Remove
              </button>
            </>
          )}
        </div>
      </div>

      {/* Info fields */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">First name</label>
            <div className="px-3 py-2 rounded-md border bg-muted/30 text-sm">{user?.first_name ?? '—'}</div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Last name</label>
            <div className="px-3 py-2 rounded-md border bg-muted/30 text-sm">{user?.last_name ?? '—'}</div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Email</label>
          <div className="px-3 py-2 rounded-md border bg-muted/30 text-sm">{currentEmail}</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Role</label>
            <div className="px-3 py-2 rounded-md border bg-muted/30 text-sm capitalize">{roleLabel}</div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">School</label>
            <div className="px-3 py-2 rounded-md border bg-muted/30 text-sm truncate">{currentSchool}</div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">District</label>
          <div className="px-3 py-2 rounded-md border bg-muted/30 text-sm">{currentDistrict}</div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Contact your administrator to update your name, email, or role.
      </p>

      {/* Crop modal */}
      <Dialog open={!!cropSrc} onOpenChange={v => { if (!v) setCropSrc(null) }}>
        <DialogContent className="w-[680px] max-w-[92vw] gap-0 p-0">
          <DialogHeader className="px-5 py-4 border-b">
            <DialogTitle>Adjust photo</DialogTitle>
          </DialogHeader>

          {/* Crop area — fixed height so landscape photos have room */}
          <div className="relative w-full" style={{ height: 500 }}>
            {cropSrc && (
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                cropSize={{ width: 440, height: 440 }}
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>

          {/* Zoom slider */}
          <div className="px-5 py-4 border-t flex items-center gap-3">
            <ZoomOut className="w-4 h-4 text-muted-foreground flex-none" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={e => setZoom(Number(e.target.value))}
              className="flex-1 accent-primary"
            />
            <ZoomIn className="w-4 h-4 text-muted-foreground flex-none" />
          </div>

          {/* Actions */}
          <div className="px-5 py-4 border-t flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCropSrc(null)}>Cancel</Button>
            <Button onClick={handleSaveCrop}>Save photo</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
