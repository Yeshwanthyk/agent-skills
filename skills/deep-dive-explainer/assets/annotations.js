(() => {
  const article = document.querySelector('article');
  const controls = document.querySelector('[data-reading-controls]');
  if (!article || !controls) return;
  const blocks = [...article.querySelectorAll('p, ul, ol, figure, blockquote, .table-scroll')]
    .filter(node => node.parentElement === article || node.parentElement.tagName === 'SECTION');
  const blockText = node => {
    if (node.matches('ul, ol')) return [...node.children].map((item, index) =>
      `${node.tagName === 'OL' ? `${index + 1}.` : '-'} ${item.textContent.trim()}`).join('\n');
    if (node.matches('.diagram')) return node.querySelector('img')?.alt || node.textContent;
    return node.innerText;
  };
  const key = `explainer-notes:${location.pathname}`;
  let notes = [];
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '[]');
    if (Array.isArray(saved)) notes = saved.filter(n => n && typeof n.question === 'string' && typeof n.quote === 'string');
  } catch {}
  let start = -1, end = -1;
  const bar = document.createElement('div');
  bar.className = 'annotation-bar';
  bar.hidden = true;
  bar.innerHTML = '<span role="status"></span> <button type="button">Annotate (a)</button> <button type="button">Cancel (Esc)</button>';
  document.body.append(bar);
  const dialog = document.createElement('dialog');
  dialog.className = 'annotation-dialog';
  dialog.innerHTML = '<form><h2>Ask about this passage</h2><blockquote></blockquote><label for="annotation-question">Question or note</label><textarea id="annotation-question" required rows="4"></textarea><p>Saved in this browser. Export notes to request further research.</p><button type="submit">Save note</button> <button type="button">Cancel</button></form>';
  document.body.append(dialog);
  const panel = document.createElement('details');
  panel.className = 'reading-controls';
  panel.innerHTML = '<summary>Annotations</summary><p>v selects the top block · l adds the next · h removes the last · a annotates · Esc cancels.</p><button type="button">Export notes</button><p role="status"></p><ol></ol>';
  controls.after(panel);
  const status = panel.querySelector('[role="status"]');
  const persist = () => {
    try { localStorage.setItem(key, JSON.stringify(notes)); status.textContent = 'Saved locally.'; }
    catch { status.textContent = 'Browser storage unavailable. Export notes before closing this page.'; }
  };
  const renderNotes = () => {
    panel.querySelector('summary').textContent = `Annotations (${notes.filter(n => n.status !== "resolved").length} open · ${notes.filter(n => n.status === "resolved").length} resolved)`;
    const list = panel.querySelector('ol');
    list.replaceChildren();
    for (const note of notes) {
      const li = document.createElement('li');
      const quote = document.createElement('blockquote');
      quote.textContent = note.quote;
      const question = document.createElement('p');
      question.textContent = note.question;
      const state = document.createElement('p');
      state.textContent = note.status === 'resolved' ? 'Resolved' : 'Open';
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.textContent = note.status === 'resolved' ? 'Reopen' : 'Resolve';
      toggle.onclick = () => {
        note.status = note.status === 'resolved' ? 'open' : 'resolved';
        if (note.status === 'resolved') note.resolvedAt = new Date().toISOString();
        else delete note.resolvedAt;
        persist(); renderNotes();
        list.children[notes.indexOf(note)]?.querySelector('button')?.focus();
      };
      li.append(state, quote, question, toggle);
      list.append(li);
    }
  };
  const clear = () => {
    blocks.forEach(p => p.classList.remove('paragraph-selected'));
    start = end = -1;
    bar.hidden = true;
  };
  const paint = () => {
    blocks.forEach((p, i) => p.classList.toggle('paragraph-selected', i >= start && i <= end));
    bar.hidden = false;
    bar.querySelector('span').textContent = `${end - start + 1} block${end === start ? '' : 's'} selected · h / l to adjust`;
  };
  const open = () => {
    if (start < 0) return;
    dialog.querySelector('blockquote').textContent = blocks.slice(start, end + 1).map(blockText).join('\n\n');
    dialog.querySelector('textarea').value = '';
    dialog.showModal();
    dialog.querySelector('textarea').focus();
  };
  bar.querySelectorAll('button')[0].onclick = open;
  bar.querySelectorAll('button')[1].onclick = clear;
  dialog.querySelector('button[type="button"]').onclick = () => { dialog.close(); clear(); };
  dialog.addEventListener('cancel', clear);
  dialog.querySelector('form').onsubmit = event => {
    event.preventDefault();
    const question = dialog.querySelector('textarea').value.trim();
    if (!question) return;
    notes.push({ status: 'open', article: document.title, revision: document.querySelector('time')?.dateTime,
      created: new Date().toISOString(), section: blocks[start].closest('section')?.querySelector('h2,h3')?.textContent || 'Introduction',
      quote: dialog.querySelector('blockquote').textContent, question });
    persist();
    renderNotes(); dialog.close(); clear();
  };
  panel.querySelector('button').onclick = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(notes, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url; link.download = 'article-annotations.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  document.addEventListener('keydown', event => {
    if (dialog.open || event.defaultPrevented || event.isComposing || event.metaKey || event.ctrlKey || event.altKey ||
        !document.querySelector('[data-reading-keys]')?.checked ||
        event.target.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"]')) return;
    if (event.key === 'v' && start < 0) {
      start = blocks.findIndex(p => p.getBoundingClientRect().bottom > 0 && p.getBoundingClientRect().top < innerHeight);
      if (start < 0) return;
      end = start; paint();
    } else if (start >= 0 && event.key === 'l') { end = Math.min(end + 1, blocks.length - 1); paint(); }
    else if (start >= 0 && event.key === 'h') { end = Math.max(start, end - 1); paint(); }
    else if (start >= 0 && event.key === 'a') open();
    else if (event.key === 'Escape') clear();
    else return;
    event.preventDefault();
  });
  renderNotes();
})();
