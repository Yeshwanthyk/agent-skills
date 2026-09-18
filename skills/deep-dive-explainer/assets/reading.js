(() => {
  const nav = document.querySelector('nav');
  const entries = [...document.querySelectorAll('nav ol a[href^="#"]')]
    .map(link => ({ link, heading: document.getElementById(link.hash.slice(1)) }))
    .filter(entry => entry.heading);
  let current = null;
  let scheduled = false;
  const updatePosition = () => {
    scheduled = false;
    const threshold = Math.min(160, innerHeight * 0.2);
    let active = null;
    for (const entry of entries) {
      if (entry.heading.getBoundingClientRect().top <= threshold) active = entry;
      else break;
    }
    if (scrollY > 0 && innerHeight + scrollY >= document.documentElement.scrollHeight - 2) {
      active = entries.at(-1) || null;
    }
    if (active === current) return;
    current?.link.removeAttribute('aria-current');
    active?.link.setAttribute('aria-current', 'location');
    current = active;
    // Move only the desktop sidebar; never move the article or keyboard focus.
    if (active && nav && matchMedia('(min-width: 801px)').matches &&
        !nav.matches(':hover') && !nav.contains(document.activeElement)) {
      const item = active.link.getBoundingClientRect();
      const bounds = nav.getBoundingClientRect();
      if (item.top < bounds.top + 12) nav.scrollTop += item.top - bounds.top - 12;
      else if (item.bottom > bounds.bottom - 12) nav.scrollTop += item.bottom - bounds.bottom + 12;
    }
  };
  const schedulePosition = () => {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(updatePosition);
    }
  };
  window.addEventListener('scroll', schedulePosition, { passive: true });
  window.addEventListener('resize', schedulePosition);
  window.addEventListener('pageshow', schedulePosition);
  window.addEventListener('load', schedulePosition);
  updatePosition();

  const controls = document.querySelector('[data-reading-controls]');
  const enabled = document.querySelector('[data-reading-keys]');
  if (!controls || !enabled) return;
  controls.hidden = false;
  let lastG = null;
  document.addEventListener('keydown', (event) => {
    const target = event.target;
    const editing = target instanceof Element && target.closest(
      'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]'
    );
    if (!enabled.checked || event.defaultPrevented || event.isComposing || editing ||
        event.metaKey || event.altKey || (event.ctrlKey && !['d', 'u'].includes(event.key))) {
      lastG = null;
      return;
    }
    if (event.key === 'g' && !event.ctrlKey) {
      if (event.repeat) return;
      const now = performance.now();
      if (lastG !== null && now - lastG < 800) {
        window.scrollTo({ top: 0, behavior: 'instant' });
        lastG = null;
      } else {
        lastG = now;
      }
      event.preventDefault();
      return;
    }
    lastG = null;
    const line = parseFloat(getComputedStyle(document.body).lineHeight) || 32;
    const delta = { j: line * 2, k: -line * 2, d: innerHeight / 2, u: -innerHeight / 2 }[event.key];
    if (delta !== undefined) {
      event.preventDefault();
      window.scrollBy({ top: delta, behavior: 'instant' });
    } else if (event.key === 'G' && !event.ctrlKey) {
      event.preventDefault();
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
    }
  });
})();
