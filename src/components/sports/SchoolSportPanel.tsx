import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Trophy, Paintbrush, Loader2, Pencil, Check, MapPin, FileText } from 'lucide-react'
import { fetchSportDetail, sportDisplayName } from '@/api/sports'
import { Sheet, SheetContent, SheetBody } from '@/components/ui/sheet'
import { useBranding } from '@/contexts/BrandingContext'
import SportBrandingEditor from '@/components/branding/SportBrandingEditor'
import { MemberGroup, ROLE_ORDER, SEASON_LABEL } from './SportBadges'

interface SchoolSportPanelProps {
  sportId:         number
  pastYears:       string[]
  canEditBranding: boolean
  canEdit:         boolean
  onClose:         () => void
}

export function SchoolSportPanel({ sportId, pastYears, canEditBranding, canEdit, onClose }: SchoolSportPanelProps) {
  const [brandingOpen, setBrandingOpen] = useState(false)
  const [editing, setEditing]           = useState(false)
  const [saved, setSaved]               = useState(false)
  const [venue, setVenue]               = useState('')
  const [notes, setNotes]               = useState('')

  const { getSportBranding } = useBranding()
  const branding = getSportBranding(sportId)

  const { data, isLoading } = useQuery({
    queryKey: ['sport', sportId],
    queryFn:  () => fetchSportDetail(sportId),
  })

  useEffect(() => {
    if (data) {
      setVenue(data.home_venue ?? '')
      setNotes(data.notes ?? '')
    }
  }, [data])

  function handleSave() {
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const record = data?.record

  return (
    <>
      <Sheet open onOpenChange={v => { if (!v) onClose() }}>
        <SheetContent className="p-0 flex flex-col">
          <div className="relative w-full h-28 bg-primary/10 flex-none overflow-hidden">
            {branding.banner_url ? (
              <img src={branding.banner_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Trophy className="w-8 h-8 text-primary/30" />
              </div>
            )}
            <div className="absolute bottom-3 left-4 w-12 h-12 rounded-xl border-2 border-background bg-card shadow-sm overflow-hidden flex items-center justify-center">
              {branding.icon_url ? (
                <img src={branding.icon_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <Trophy className="w-5 h-5 text-primary" />
              )}
            </div>
            {canEditBranding && (
              <button
                onClick={() => setBrandingOpen(true)}
                className="absolute top-2 right-2 flex items-center gap-1.5 text-xs bg-background/80 backdrop-blur-sm px-2.5 py-1.5 rounded-md hover:bg-background transition-colors text-foreground"
              >
                <Paintbrush className="w-3 h-3" />
                Edit branding
              </button>
            )}
          </div>

          {/* Header info */}
          <div className="px-6 pt-5 pb-3 border-b">
            <h2 className="text-base font-semibold">{data ? sportDisplayName(data) : 'Loading…'}</h2>
            {data && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {SEASON_LABEL[data.season]} · {data.school_year} · {data.athlete_count} athletes
                {pastYears.length > 0 && ` · Also in: ${pastYears.join(', ')}`}
              </p>
            )}

            {/* Season record */}
            {record && (
              <div className="flex items-center gap-4 mt-3">
                {[
                  { val: record.wins,   label: 'W' },
                  { val: record.losses, label: 'L' },
                  ...(record.ties ? [{ val: record.ties, label: 'T' }] : []),
                ].map(({ val, label }) => (
                  <div key={label} className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold tabular-nums leading-none">{val}</span>
                    <span className="text-[11px] font-semibold text-muted-foreground">{label}</span>
                  </div>
                ))}
                <span className="text-xs text-muted-foreground ml-1">this season</span>
              </div>
            )}
          </div>

          <SheetBody className="px-6 space-y-6">
            {isLoading && (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            )}

            {data && (
              <>
                {/* Editable sport details (AD only) */}
                {canEdit && (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sport Details</h3>
                      {!editing ? (
                        <button
                          onClick={() => setEditing(true)}
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <Pencil className="w-3 h-3" />
                          Edit
                        </button>
                      ) : (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => { setEditing(false); setVenue(data.home_venue ?? ''); setNotes(data.notes ?? '') }}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSave}
                            className="flex items-center gap-1 text-xs font-semibold text-primary"
                          >
                            <Check className="w-3 h-3" />
                            Save
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                          <MapPin className="w-3 h-3" />
                          Home Venue
                        </label>
                        {editing ? (
                          <input
                            value={venue}
                            onChange={e => setVenue(e.target.value)}
                            placeholder="e.g. AHS Aquatic Center"
                            className="w-full text-sm border rounded-md px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        ) : (
                          <p className="text-sm">{venue || <span className="text-muted-foreground italic">Not set</span>}</p>
                        )}
                      </div>

                      <div>
                        <label className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                          <FileText className="w-3 h-3" />
                          Notes
                        </label>
                        {editing ? (
                          <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            rows={3}
                            placeholder="Internal notes visible to staff only…"
                            className="w-full text-sm border rounded-md px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                          />
                        ) : (
                          <p className="text-sm">{notes || <span className="text-muted-foreground italic">No notes</span>}</p>
                        )}
                      </div>
                    </div>

                    {saved && (
                      <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Changes saved
                      </p>
                    )}

                    <div className="border-t" />
                  </div>
                )}

                {/* Roster */}
                <div className="space-y-5">
                  {ROLE_ORDER.map(role => (
                    <MemberGroup key={role} role={role} members={data.members} />
                  ))}
                </div>
              </>
            )}
          </SheetBody>
        </SheetContent>
      </Sheet>

      {data && brandingOpen && (
        <SportBrandingEditor
          sportId={sportId}
          sportName={sportDisplayName(data)}
          open={brandingOpen}
          onClose={() => setBrandingOpen(false)}
        />
      )}
    </>
  )
}
