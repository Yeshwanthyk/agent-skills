// State and event contract test with a minimal DOM; does not establish browser layout.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function node(text = '') {
  return {textContent: text, events: {}, attrs: {}, disabled: false, hidden: true, open: false,
    classList: {add() {}, remove() {}},
    setAttribute(key, value) { this.attrs[key] = value; },
    addEventListener(key, callback) { (this.events[key] ||= []).push(callback); },
    emit(key, event = {}) { for (const callback of this.events[key] || []) callback(event); },
    cloneNode() { return node(this.textContent); }
  };
}
function figure(titles) {
  const nodes = new Map();
  for (const name of ['stage', 'play', 'back', 'next', 'range', 'transcript', 'position', 'announcement']) {
    nodes.set(`[data-sequence-${name}]`, node());
  }
  nodes.set('.sequence-controls', node());
  const frames = titles.map(title => ({childNodes: [node(title), node('question')]}));
  const stage = nodes.get('[data-sequence-stage]');
  stage.replaceChildren = (...children) => { stage.childNodes = children; };
  stage.querySelector = selector => { assert.equal(selector, 'h3'); return stage.childNodes[0]; };
  stage.querySelectorAll = selector => { assert.equal(selector, 'details'); return [stage.childNodes[1]]; };
  return {dataset: {sequenceInterval: '9000'}, querySelector(selector) { assert(nodes.has(selector)); return nodes.get(selector); },
    querySelectorAll(selector) { assert.equal(selector, '[data-sequence-frame]'); return frames; },
    get(name) { return nodes.get(`[data-sequence-${name}]`); }
  };
}
const first = figure(['Shared destination', 'Separate destinations', 'Publication boundary']);
const second = figure(['A second topic', 'A changed relationship']);
const doc = node();
doc.hidden = false;
doc.querySelectorAll = selector => { assert.equal(selector, '.explanation-sequence'); return [first, second]; };
const win = node();
const media = [node(), node()];
media.forEach(item => { item.matches = false; });
let mediaIndex = 0;
win.matchMedia = () => media[mediaIndex++];
let timerId = 0;
const timers = new Map();
const context = vm.createContext({document: doc, window: win,
  setTimeout(callback, interval) { assert.equal(interval, 9000); const id = ++timerId; timers.set(id, callback); return id; },
  clearTimeout(id) { timers.delete(id); }, requestAnimationFrame(callback) { callback(); }
});
vm.runInContext(fs.readFileSync(path.join(__dirname, '../assets/sequences.js'), 'utf8'), context);
function tick() { assert(timers.size); const [id, callback] = timers.entries().next().value; timers.delete(id); callback(); }
const title = fig => fig.get('stage').querySelector('h3').textContent;
assert.equal(timers.size, 0, 'no autoplay');
assert.equal(first.get('transcript').open, false);
assert.equal(first.get('back').disabled, true);
assert.equal(first.querySelector('.sequence-controls').hidden, false);
first.get('next').emit('click');
assert.equal(title(first), 'Separate destinations');
assert.equal(title(second), 'A second topic', 'figures are independent');
assert.equal(first.get('range').attrs['aria-valuetext'], 'Stage 2: Separate destinations');
first.get('play').emit('click');
assert.equal(first.get('play').attrs['aria-pressed'], 'true');
first.get('stage').emit('toggle', {target: {open: true}});
assert.equal(timers.size, 0, 'opening an answer pauses');
first.get('play').emit('click');
first.get('stage').emit('focusin');
assert.equal(timers.size, 0, 'inspecting stage content pauses');
first.get('play').emit('click');
tick();
assert.equal(title(first), 'Publication boundary');
assert.equal(first.get('next').disabled, true);
assert.equal(first.get('play').textContent, 'Replay explanation');
assert.equal(timers.size, 0, 'playback ends');
first.get('play').emit('click');
assert.equal(title(first), 'Shared destination', 'replay restarts');
first.get('range').value = '1';
first.get('range').emit('input');
assert.equal(title(first), 'Separate destinations');
assert.equal(timers.size, 0, 'manual navigation pauses');
first.get('play').emit('click');
first.get('transcript').open = true;
first.get('transcript').emit('toggle');
assert.equal(timers.size, 0, 'reading the transcript pauses');
first.get('transcript').open = false;
first.get('play').emit('click');
second.get('play').emit('click');
assert.equal(timers.size, 2);
doc.hidden = true;
doc.emit('visibilitychange');
assert.equal(timers.size, 0, 'hidden document pauses every figure');
doc.hidden = false;
first.get('play').emit('click');
media[0].matches = true;
media[0].emit('change');
assert.equal(timers.size, 0, 'preference change pauses');
first.get('back').emit('click');
assert.equal(title(first), 'Shared destination', 'reduced motion retains navigation');
win.emit('beforeprint');
assert.equal(first.get('transcript').open, true);
assert.equal(second.get('transcript').open, true);
win.emit('afterprint');
assert.equal(first.get('transcript').open, false, 'print restores reading state');
assert.equal(second.get('transcript').open, false);
console.log('PASS: independent figures, manual navigation, finite replay, inspection pauses, hidden document, reduced motion, and print transcript');
