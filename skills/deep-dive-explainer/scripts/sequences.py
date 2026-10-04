"""Author-time image embedding and rendering for offline explanatory sequences."""
import base64
import html
import json
from pathlib import Path
import re
import xml.etree.ElementTree as ET
from urllib.parse import urlsplit


def within(root, base, name, suffixes):
    if not isinstance(name, str) or not name.strip():
        raise ValueError('Sequence assets require a nonempty relative path')
    if Path(name).is_absolute():
        raise ValueError('Sequence asset paths must be relative')
    path = (base / name).resolve()
    if not path.is_relative_to(root.resolve()) or path.suffix.lower() not in suffixes:
        raise ValueError(f'Sequence asset must be {suffixes} within the article directory: {name}')
    return path


def raster(path):
    payload = path.read_bytes()
    if payload.startswith(b'\x89PNG\r\n\x1a\n'):
        mime = 'image/png'
    elif payload.startswith(b'\xff\xd8\xff'):
        mime = 'image/jpeg'
    elif payload[:4] == b'RIFF' and payload[8:12] == b'WEBP':
        mime = 'image/webp'
    else:
        raise ValueError(f'Expected PNG, JPEG, or WebP image: {path.name}')
    return f'data:{mime};base64,' + base64.b64encode(payload).decode('ascii')


def image_uri(path, root):
    if path.suffix.lower() != '.svg':
        return raster(path)
    payload = path.read_text()
    if re.search(r'<!DOCTYPE|<!ENTITY', payload, re.I):
        raise ValueError('Sequence SVG cannot declare document types or entities')
    try:
        svg = ET.fromstring(payload)
    except ET.ParseError as error:
        raise ValueError(f'Invalid sequence SVG: {error}') from error
    if svg.tag != '{http://www.w3.org/2000/svg}svg':
        raise ValueError('Sequence SVG requires an SVG namespace and root')
    for node in svg.iter():
        tag = node.tag.rsplit('}', 1)[-1]
        if tag in {'script', 'foreignObject', 'animate', 'animateMotion', 'animateTransform', 'set'}:
            raise ValueError(f'Sequence frames must be static SVG images; unsupported {tag}')
        for key, value in list(node.attrib.items()):
            name = key.rsplit('}', 1)[-1]
            if name.lower().startswith('on'):
                raise ValueError('Sequence SVG cannot contain event handlers')
            if any(not url.strip(' \t\r\n\"\'').startswith('#')
                   for url in re.findall(r'url\(([^)]*)\)', value, re.I)):
                raise ValueError('Sequence SVG attributes must not load external assets')
            if name == 'href' and not value.startswith('#'):
                if tag != 'image':
                    raise ValueError('Sequence SVG permits fragment references and embedded images')
                if value.startswith(('data:image/png;base64,', 'data:image/jpeg;base64,', 'data:image/webp;base64,')):
                    continue
                local = within(root, path.parent, value, ('.png', '.jpg', '.jpeg', '.webp'))
                node.set(key, raster(local))
        css = node.text if tag == 'style' else node.get('style', '')
        if css and (re.search(r'@import', css, re.I) or any(
            not url.strip(' \t\r\n\"\'').startswith('#')
            for url in re.findall(r'url\(([^)]*)\)', css, re.I)
        )):
            raise ValueError('Sequence SVG styles must not load external assets')
    ET.register_namespace('', 'http://www.w3.org/2000/svg')
    encoded = base64.b64encode(ET.tostring(svg, encoding='utf-8')).decode('ascii')
    return 'data:image/svg+xml;base64,' + encoded


def render_sequence(value, source_dir, number, inline, keys, string, sequence):
    keys(value, ('sequence', 'caption'))
    if source_dir is None:
        raise ValueError('Sequences require an article source directory')
    root = source_dir.resolve()
    path = within(root, root, value['sequence'], ('.json',))
    model = json.loads(path.read_text())
    keys(model, ('states',), ('interval_ms', 'min_width'))
    states = sequence(model['states'])
    if len(states) < 2:
        raise ValueError('An explanatory sequence needs at least two states')
    interval = model.get('interval_ms', 9000)
    if type(interval) is not int or not 3000 <= interval <= 30000:
        raise ValueError('interval_ms must be an integer from 3000 to 30000')
    min_width = model.get('min_width')
    if min_width is not None and (type(min_width) is not int or not 320 <= min_width <= 1600):
        raise ValueError('min_width must be an integer from 320 to 1600')
    frames, cache = [], {}
    for state in states:
        keys(state, ('title', 'image', 'alt', 'explanation'), ('changed', 'question', 'code', 'language', 'source'))
        asset = within(root, path.parent, state['image'], ('.svg', '.png', '.jpg', '.jpeg', '.webp'))
        if asset not in cache:
            cache[asset] = image_uri(asset, root)
        title = html.escape(string(state['title']))
        alt = html.escape(string(state['alt']), quote=True)
        image = f'<img class="sequence-image" src="{cache[asset]}" alt="{alt}">'
        if min_width is not None:
            image = f'<div class="sequence-viewport" style="--sequence-min-width:{min_width}px" tabindex="0" role="region" aria-label="Scrollable explanatory frame">{image}</div>'
        body = image + f'<h3>{title}</h3><p>{inline(state["explanation"])}</p>'
        if 'changed' in state:
            body += '<p class="sequence-change">' + inline(state['changed']) + '</p>'
        if 'question' in state:
            question = state['question']
            keys(question, ('prompt', 'answer'))
            body += f'<details data-sequence-question><summary>{inline(question["prompt"])}</summary><p>{inline(question["answer"])}</p></details>'
        if 'language' in state and 'code' not in state:
            raise ValueError('Sequence language requires code')
        if 'code' in state:
            label = html.escape(string(state.get('language', 'text')))
            body += f'<div class="sequence-code"><span>{label}</span><pre tabindex="0"><code>{html.escape(string(state["code"]))}</code></pre></div>'
        if 'source' in state:
            url = string(state['source'])
            parsed = urlsplit(url)
            if parsed.scheme not in ('http', 'https') or not parsed.netloc or re.search(r'\s|[()]', url):
                raise ValueError('Sequence source requires an HTTP(S) URL; percent-encode parentheses')
            body += '<p class="sequence-source">' + inline(f'[Source for this stage]({url})') + '</p>'
        frames.append(body)
    ident = f'sequence-{number}'
    caption = inline(value['caption'])
    controls = f'''<div class="sequence-controls" hidden>
<button type="button" data-sequence-back aria-controls="{ident}-stage" disabled>Back</button>
<button type="button" data-sequence-play aria-controls="{ident}-stage" aria-pressed="false">Play explanation</button>
<button type="button" data-sequence-next aria-controls="{ident}-stage">Next</button>
<label>Stage <input type="range" data-sequence-range min="0" max="{len(states)-1}" value="0" aria-label="Choose a stage" aria-controls="{ident}-stage"></label>
<span data-sequence-position>1 / {len(states)}</span></div>'''
    transcript = ''.join('<li data-sequence-frame>' + frame.replace('<details data-sequence-question>', '<details data-sequence-question open>') + '</li>' for frame in frames)
    return f'''<figure class="explanation-sequence" id="{ident}" data-sequence-interval="{interval}" aria-labelledby="{ident}-caption">
<figcaption id="{ident}-caption">{caption}</figcaption>{controls}
<div class="sequence-stage" id="{ident}-stage" data-sequence-stage role="group" aria-label="Current explanatory stage">{frames[0]}</div>
<span class="sequence-announcement" data-sequence-announcement aria-live="polite" aria-atomic="true"></span>
<details data-sequence-transcript open><summary>Read every stage</summary><ol>{transcript}</ol></details></figure>'''
