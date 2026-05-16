/* ═══════════════════════════════════════
   About Me
   ═══════════════════════════════════════ */

function PersonalPage({ onBack, onLogout, scrollTo }) {
  const { lang } = useT();
  const title = lang === 'de' ? 'Über Mich' : 'About Me';
  const src = scrollTo ? `about-me/about_me.html#${scrollTo}` : 'about-me/about_me.html';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <NavBar onBack={onBack} onLogout={onLogout} title={title} />
      <iframe
        src={src}
        title={title}
        style={{ flex: 1, border: 'none', width: '100%' }}
      />
    </div>
  );
}

Object.assign(window, { PersonalPage });
