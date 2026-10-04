(() => {
  document.querySelectorAll('.explanation-sequence').forEach(figure => {
    const find = selector => figure.querySelector(selector);
    const frames = [...figure.querySelectorAll('[data-sequence-frame]')];
    const stage = find('[data-sequence-stage]');
    const play = find('[data-sequence-play]');
    const back = find('[data-sequence-back]');
    const next = find('[data-sequence-next]');
    const range = find('[data-sequence-range]');
    const transcript = find('[data-sequence-transcript]');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const interval = Number(figure.dataset.sequenceInterval);
    let position = 0;
    let playing = false;
    let timer = null;

    function stop() {
      if (timer !== null) clearTimeout(timer);
      timer = null;
      playing = false;
      play.textContent = position === frames.length - 1 ? 'Replay explanation' : 'Play explanation';
      play.setAttribute('aria-pressed', 'false');
    }

    function render(value, announce = true) {
      position = Math.max(0, Math.min(frames.length - 1, value));
      stage.replaceChildren(...[...frames[position].childNodes].map(child => child.cloneNode(true)));
      stage.querySelectorAll('details').forEach(detail => { detail.open = false; });
      stage.classList.remove('sequence-enter');
      if (!reduced.matches) requestAnimationFrame(() => stage.classList.add('sequence-enter'));
      back.disabled = position === 0;
      next.disabled = position === frames.length - 1;
      range.value = String(position);
      range.setAttribute('aria-valuetext', `Stage ${position + 1}: ${stage.querySelector('h3').textContent}`);
      find('[data-sequence-position]').textContent = `${position + 1} / ${frames.length}`;
      if (announce) find('[data-sequence-announcement]').textContent = `Stage ${position + 1}. ${stage.querySelector('h3').textContent}`;
      if (!playing) play.textContent = position === frames.length - 1 ? 'Replay explanation' : 'Play explanation';
    }

    function schedule() {
      timer = setTimeout(() => {
        timer = null;
        render(position + 1);
        if (position === frames.length - 1) stop();
        else schedule();
      }, interval);
    }

    play.addEventListener('click', () => {
      if (playing) { stop(); return; }
      if (position === frames.length - 1) render(0);
      playing = true;
      play.textContent = 'Pause explanation';
      play.setAttribute('aria-pressed', 'true');
      schedule();
    });
    back.addEventListener('click', () => { stop(); render(position - 1); });
    next.addEventListener('click', () => { stop(); render(position + 1); });
    range.addEventListener('input', () => { stop(); render(Number(range.value)); });
    stage.addEventListener('toggle', event => { if (event.target.open) stop(); }, true);
    stage.addEventListener('focusin', stop);
    transcript.addEventListener('toggle', () => { if (transcript.open) stop(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
    reduced.addEventListener('change', () => { stop(); stage.classList.remove('sequence-enter'); });
    let transcriptBeforePrint = null;
    window.addEventListener('beforeprint', () => {
      stop();
      if (transcriptBeforePrint === null) transcriptBeforePrint = transcript.open;
      transcript.open = true;
    });
    window.addEventListener('afterprint', () => {
      if (transcriptBeforePrint !== null) transcript.open = transcriptBeforePrint;
      transcriptBeforePrint = null;
    });
    find('.sequence-controls').hidden = false;
    transcript.open = false;
    render(0, false);
  });
})();
