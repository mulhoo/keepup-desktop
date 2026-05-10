import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useBranding } from '@/contexts/BrandingContext'
import ImageUploader from './ImageUploader'

interface Props {
  sportId: number
  sportName: string
  open: boolean
  onClose: () => void
}

export default function SportBrandingEditor({ sportId, sportName, open, onClose }: Props) {
  const { getSportBranding, setSportBranding } = useBranding()
  const saved = getSportBranding(sportId)

  const [iconUrl, setIconUrl]     = useState<string | null>(saved.icon_url ?? null)
  const [bannerUrl, setBannerUrl] = useState<string | null>(saved.banner_url ?? null)

  function handleSave() {
    setSportBranding(sportId, {
      icon_url:   iconUrl   ?? undefined,
      banner_url: bannerUrl ?? undefined,
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Sport Branding</DialogTitle>
          <DialogDescription>
            {sportName} — icon and banner shown in the mobile app.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-1">
          <ImageUploader
            label="Sport Icon"
            hint="Square — appears in the sport switcher rail and channel headers."
            shape="square"
            value={iconUrl}
            onChange={setIconUrl}
          />
          <ImageUploader
            label="Banner"
            hint="Wide image — shown at the top of your sport's channels."
            shape="banner"
            value={bannerUrl}
            onChange={setBannerUrl}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
