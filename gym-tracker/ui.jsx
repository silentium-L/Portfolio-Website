/* ui.jsx – Shared UI components & Icons */

const ICON_PATHS = {
  home: <><path d="M3 10.5L12 3l9 7.5V21a1.5 1.5 0 01-1.5 1.5h-4.125a.75.75 0 01-.75-.75V16.5a2.625 2.625 0 00-5.25 0v5.25a.75.75 0 01-.75.75H4.5A1.5 1.5 0 013 21V10.5z"/></>,
  dumbbell: <><path d="M6.5 6.5h11M4 9V6a1 1 0 011-1h1.5v8H5a1 1 0 01-1-1V9zM2.5 10.5v-3a.5.5 0 01.5-.5h1v4h-1a.5.5 0 01-.5-.5zM20 9V6a1 1 0 00-1-1h-1.5v8H19a1 1 0 001-1V9zM21.5 10.5v-3a.5.5 0 00-.5-.5h-1v4h1a.5.5 0 00.5-.5z" transform="translate(0 3)"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></>,
  chart: <><rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="5" width="4" height="16" rx="1"/><rect x="17" y="8" width="4" height="13" rx="1"/></>,
  radar: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/><line x1="12" y1="3" x2="12" y2="7"/><line x1="12" y1="17" x2="12" y2="21"/><line x1="3" y1="12" x2="7" y2="12"/><line x1="17" y1="12" x2="21" y2="12"/></>,
  sparkles: <><path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z"/><path d="M19 14l.75 2.25L22 17l-2.25.75L19 20l-.75-2.25L16 17l2.25-.75L19 14z" opacity=".7"/><path d="M5 16l.5 1.5L7 18l-1.5.5L5 20l-.5-1.5L3 18l1.5-.5L5 16z" opacity=".5"/></>,
  user: <><circle cx="12" cy="8" r="4.5"/><path d="M4 21v-1.5A5.5 5.5 0 019.5 14h5A5.5 5.5 0 0120 19.5V21"/></>,
  plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  search: <><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></>,
  check: <><polyline points="4 12 9 17 20 6"/></>,
  x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  chevronRight: <><polyline points="9 6 15 12 9 18"/></>,
  chevronDown: <><polyline points="6 9 12 15 18 9"/></>,
  arrowLeft: <><line x1="20" y1="12" x2="4" y2="12"/><polyline points="10 18 4 12 10 6"/></>,
  trophy: <><path d="M8 21h8M12 17v4M6 3h12v4a6 6 0 11-12 0V3zM6 5H3v2a3 3 0 003 3M18 5h3v2a3 3 0 01-3 3"/></>,
  flame: <><path d="M12 22c-4-2.5-6-6-6-9a8.5 8.5 0 015-8c.5 3 2 4 3.5 4.5A5.5 5.5 0 0118 13c0 3-2 6.5-6 9z"/></>,
  trendUp: <><polyline points="3 17 8 12 13 15 21 7"/><polyline points="16 7 21 7 21 12"/></>,
  trendDown: <><polyline points="3 7 8 12 13 9 21 17"/><polyline points="16 17 21 17 21 12"/></>,
  alertTriangle: <><path d="M10.3 3.9L1.8 18.5a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/><line x1="12" y1="9" x2="12" y2="13"/><circle cx="12" cy="16.5" r=".5"/></>,
  play: <><polygon points="6 3 20 12 6 21"/></>,
  pause: <><rect x="5" y="4" width="4" height="16" rx="1"/><rect x="15" y="4" width="4" height="16" rx="1"/></>,
  moon: <><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></>,
  sun: <><circle cx="12" cy="12" r="4.5"/><line x1="12" y1="2" x2="12" y2="4.5"/><line x1="12" y1="19.5" x2="12" y2="22"/><line x1="2" y1="12" x2="4.5" y2="12"/><line x1="19.5" y1="12" x2="22" y2="12"/><line x1="4.93" y1="4.93" x2="6.64" y2="6.64"/><line x1="17.36" y1="17.36" x2="19.07" y2="19.07"/><line x1="4.93" y1="19.07" x2="6.64" y2="17.36"/><line x1="17.36" y1="6.64" x2="19.07" y2="4.93"/></>,
  heart: <><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"/></>,
  timer: <><circle cx="12" cy="13" r="8"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="1" x2="12" y2="4"/><line x1="9" y1="1" x2="15" y2="1"/></>,
  zap: <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
  scale: <><path d="M12 3v18M5 8l7-5 7 5M5 8a3 3 0 006 0M13 8a3 3 0 006 0"/></>,
  trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></>,
  edit: <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
  minus: <><line x1="5" y1="12" x2="19" y2="12"/></>,
  save: <><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>,
};

function Icon({ name, size = 20, color, style, className, strokeWidth = 1.8 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke={color || 'currentColor'}
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }} className={className}>
      {ICON_PATHS[name] || null}
    </svg>
  );
}

/* ---- Shared UI Components ---- */

const uiBase = {
  card: {
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
    padding: '20px',
    transition: 'var(--transition-base)',
  },
  cardHover: {
    background: 'var(--bg-card-hover)',
    borderColor: 'var(--border-strong)',
    boxShadow: 'var(--shadow-card)',
  },
  btn: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14,
    borderRadius: 'var(--radius-md)', cursor: 'pointer',
    transition: 'var(--transition-fast)',
    whiteSpace: 'nowrap',
  },
  input: {
    width: '100%', padding: '12px 16px',
    background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
    fontSize: 15, transition: 'var(--transition-fast)',
  },
};

function Button({ children, variant = 'primary', size = 'md', icon, onClick, style, disabled }) {
  const variants = {
    primary: { background: 'var(--accent)', color: '#fff', padding: size === 'sm' ? '8px 16px' : '12px 24px' },
    secondary: { background: 'var(--bg-elevated)', color: 'var(--text-primary)', padding: size === 'sm' ? '8px 16px' : '12px 24px', border: '1px solid var(--border)' },
    ghost: { background: 'transparent', color: 'var(--text-secondary)', padding: size === 'sm' ? '6px 12px' : '10px 16px' },
    danger: { background: 'var(--danger-bg)', color: 'var(--danger)', padding: size === 'sm' ? '8px 16px' : '12px 24px', border: '1px solid rgba(248,113,113,0.2)' },
  };
  const [hovered, setHovered] = React.useState(false);
  return (
    <button style={{ ...uiBase.btn, ...variants[variant], opacity: disabled ? 0.5 : hovered ? 0.85 : 1, ...style }}
      onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {icon && <Icon name={icon} size={size === 'sm' ? 16 : 18} />}
      {children}
    </button>
  );
}

function Card({ children, style, onClick, hover = false }) {
  const [h, setH] = React.useState(false);
  return (
    <div style={{ ...uiBase.card, ...(hover && h ? uiBase.cardHover : {}), cursor: onClick ? 'pointer' : 'default', ...style }}
      onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}>
      {children}
    </div>
  );
}

function Input({ label, type = 'text', value, onChange, placeholder, icon, style }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      {label && <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>{label}</label>}
      <div style={{ position: 'relative' }}>
        {icon && <Icon name={icon} size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: focused ? 'var(--accent)' : 'var(--text-tertiary)' }} />}
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          style={{ ...uiBase.input, paddingLeft: icon ? 42 : 16, borderColor: focused ? 'var(--accent)' : 'var(--border)', boxShadow: focused ? 'var(--shadow-glow)' : 'none' }}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
      </div>
    </div>
  );
}

function Badge({ children, color = 'var(--accent)', bg, style }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '4px 10px', borderRadius: 'var(--radius-full)',
      fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-display)',
      color, background: bg || color + '18',
      ...style
    }}>{children}</span>
  );
}

function StatValue({ label, value, unit, sub, icon, color, trend }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 13 }}>
        {icon && <Icon name={icon} size={15} color={color} />}
        <span>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-display)', color: color || 'var(--text-primary)', letterSpacing: '-0.03em' }}>{value}</span>
        {unit && <span style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>{unit}</span>}
      </div>
      {(sub || trend != null) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
          {trend != null && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: trend >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              <Icon name={trend >= 0 ? 'trendUp' : 'trendDown'} size={13} />
              {trend >= 0 ? '+' : ''}{trend}%
            </span>
          )}
          {sub && <span style={{ color: 'var(--text-tertiary)' }}>{sub}</span>}
        </div>
      )}
    </div>
  );
}

function TabBar({ tabs, active, onChange, style }) {
  return (
    <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', ...style }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          flex: 1, padding: '8px 16px', borderRadius: 'var(--radius-sm)',
          fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-display)',
          background: active === t.id ? 'var(--accent)' : 'transparent',
          color: active === t.id ? '#fff' : 'var(--text-secondary)',
          transition: 'var(--transition-fast)',
        }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

function Avatar({ name, size = 40, src }) {
  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';
  return (
    <div style={{
      width: size, height: size, borderRadius: 'var(--radius-full)',
      background: 'linear-gradient(135deg, var(--accent-dark), var(--accent-light))',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, fontFamily: 'var(--font-display)',
      color: '#fff', flexShrink: 0,
    }}>
      {src ? <img src={src} alt="" style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'cover' }} /> : initials}
    </div>
  );
}

function EmptyState({ icon, title, subtitle }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48, gap: 12, color: 'var(--text-tertiary)', textAlign: 'center' }}>
      <Icon name={icon} size={40} strokeWidth={1.2} />
      <h4 style={{ fontSize: 16, color: 'var(--text-secondary)' }}>{title}</h4>
      {subtitle && <p style={{ fontSize: 14 }}>{subtitle}</p>}
    </div>
  );
}

Object.assign(window, { Icon, Button, Card, Input, Badge, StatValue, TabBar, Avatar, EmptyState, uiBase });
