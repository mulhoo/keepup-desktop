import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useBranding } from '@/contexts/BrandingContext'
import ImageUploader from './ImageUploader'

interface Props {
  schoolId: number
  open: boolean
  onClose: () => void
}

export default function SchoolBrandingEditor({ schoolId, open, onClose }: Props) {
  const { schoolBranding, setSchoolBranding } = useBranding()

  const [iconUrl, setIconUrl]     = useState<string | null>(schoolBranding.icon_url ?? null)
  const [bannerUrl, setBannerUrl] = useState<string | null>(schoolBranding.banner_url ?? null)

  function handleSave() {
    setSchoolBranding({
      icon_url:   iconUrl   ?? undefined,
      banner_url: bannerUrl ?? undefined,
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>School Branding</DialogTitle>
          <DialogDescription>
            School icon and banner shown across the mobile app.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-1">
          <ImageUploader
            label="School Icon"
            hint="Square — shown in app headers and the district school list."
            shape="square"
            value={iconUrl}
            onChange={setIconUrl}
            resourceType="school_icon"
            resourceId={schoolId}
          />
          <ImageUploader
            label="Banner"
            hint="Wide image — shown at the top of the school's home screen."
            shape="banner"
            value={bannerUrl}
            onChange={setBannerUrl}
            resourceType="school_banner"
            resourceId={schoolId}
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
