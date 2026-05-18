interface Props {
  colors: Record<string, string>
}

export default function ThemePreview({ colors }: Props) {
  const c = colors

  return (
    <div
      className="rounded-xl border overflow-hidden flex flex-col text-[13px] select-none"
      style={{ background: c.color_background }}
    >
      {/* App header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ background: c.color_primary }}
      >
        <span className="font-bold tracking-tight" style={{ color: c.color_text_on_primary }}>KeepUp</span>
        <div className="flex gap-1.5">
          {['', '', ''].map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: c.color_text_on_primary, opacity: 0.6 }} />
          ))}
        </div>
      </div>

      <div className="p-3 space-y-2 flex-1">
        {/* Channel message card */}
        <div
          className="rounded-lg p-3 space-y-1"
          style={{ background: c.color_surface, border: `1px solid ${c.color_border}` }}
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold" style={{ color: c.color_text_primary }}>Varsity Swimming</span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: c.color_accent, color: c.color_text_on_accent }}
            >
              Live
            </span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: c.color_text_secondary }}>
            Practice today at 4:30pm — bring race suit for time trials.
          </p>
        </div>

        {/* Surface variant message */}
        <div
          className="rounded-lg p-3 space-y-1"
          style={{ background: c.color_surface_variant, border: `1px solid ${c.color_border}` }}
        >
          <span className="font-medium text-xs" style={{ color: c.color_text_primary }}>Coach Anderson</span>
          <p className="text-xs" style={{ color: c.color_text_secondary }}>
            Meet results are posted — great work everyone.
          </p>
        </div>

        {/* DM row */}
        <div
          className="rounded-lg px-3 py-2.5 flex items-center gap-3"
          style={{ background: c.color_surface, border: `1px solid ${c.color_border}` }}
        >
          <div
            className="w-7 h-7 rounded-full flex-none flex items-center justify-center text-xs font-bold"
            style={{ background: c.color_primary, color: c.color_text_on_primary }}
          >
            JD
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-xs truncate" style={{ color: c.color_text_primary }}>Jamie D.</p>
            <p className="text-xs truncate" style={{ color: c.color_text_secondary }}>Are you going to the meet Friday?</p>
          </div>
        </div>

        {/* Tag chips */}
        <div className="flex gap-1.5 flex-wrap pt-1">
          <span
            className="text-xs px-2.5 py-1 rounded-full font-medium"
            style={{ background: c.color_primary, color: c.color_text_on_primary }}
          >
            Swimming
          </span>
          <span
            className="text-xs px-2.5 py-1 rounded-full font-medium"
            style={{ background: c.color_accent, color: c.color_text_on_accent }}
          >
            Meet Day
          </span>
          <span
            className="text-xs px-2.5 py-1 rounded-full"
            style={{ background: c.color_surface_variant, color: c.color_text_secondary, border: `1px solid ${c.color_border}` }}
          >
            Varsity
          </span>
        </div>
      </div>

      {/* Nav bar */}
      <div
        className="px-4 py-2 flex justify-around"
        style={{ background: c.color_surface, borderTop: `1px solid ${c.color_border}` }}
      >
        {['Channels', 'DMs', 'Alerts'].map((tab, i) => (
          <span
            key={tab}
            className="text-xs font-medium"
            style={{ color: i === 0 ? c.color_primary : c.color_text_secondary }}
          >
            {tab}
          </span>
        ))}
      </div>
    </div>
  )
}
