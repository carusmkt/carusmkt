import { createPatternWaves } from './PatternWaves.js';

// Temporarily disabled while comparing a constant background with the scroll fade.
const FADE_ON_SCROLL = false;

// Keep the animated surface behind the opening view, including its floating menu.
export function initHomeWaves(hero) {
  const container = document.createElement('div');
  container.className = 'home-waves';
  container.setAttribute('aria-hidden', 'true');
  document.body.prepend(container);

  const readColor = () => getComputedStyle(container).getPropertyValue('--waves-color').trim();
  let waves;
  try {
    waves = createPatternWaves(container, {
      preset: 'silk',
      color: readColor(),
      backgroundColor: 'transparent',
      fade: 'edges',
      speed: 0.45,
      shine: 1,
      contrast: 1.3,
      interactive: true,
      cursorSize: 50,
      cursorStrength: 0.6
    });
  } catch (error) {
    container.remove();
    console.warn('Pattern Waves could not initialize:', error);
    return null;
  }
  if (!waves) {
    container.remove();
    return null;
  }

  let frame = 0;
  let fadeStart = 0;
  let fadeEnd = 1;
  let destroyed = false;
  const update = () => {
    frame = 0;
    const progress = Math.min(1, Math.max(0, (window.scrollY - fadeStart) / (fadeEnd - fadeStart)));
    const opacity = FADE_ON_SCROLL ? 1 - progress * progress * (3 - 2 * progress) : 1;
    container.style.setProperty('--waves-scroll', opacity.toFixed(4));
    waves.setVisible(opacity > 0);
  };
  const onScroll = () => {
    if (!frame && !destroyed) frame = requestAnimationFrame(update);
  };
  const resize = () => {
    const bottom = hero.getBoundingClientRect().bottom + window.scrollY;
    // Hold the opening intensity first, then fade over an extra viewport of scroll.
    fadeStart = bottom * 0.4;
    fadeEnd = Math.max(fadeStart + 1, bottom + window.innerHeight);
    container.style.height = `${Math.ceil(bottom)}px`;
    onScroll();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(hero);
  const themeObserver = new MutationObserver(() => waves.setColor(readColor()));
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  if (FADE_ON_SCROLL) window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  resize();
  update();

  return {
    destroy() {
      destroyed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', resize);
      waves.destroy();
      container.remove();
    }
  };
}
