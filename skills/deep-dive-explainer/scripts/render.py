#!/usr/bin/env python3
"""Render article content using the bundled offline reading layout."""
import argparse
import base64
import datetime
import html
import json
from pathlib import Path
import re
import sys
from urllib.parse import urlsplit


def string(value):
    if not isinstance(value, str) or not value.strip():
        raise ValueError('Expected a nonempty string')
    return value


def keys(value, required, optional=()):
    if not isinstance(value, dict) or not set(required) <= value.keys():
        raise ValueError(f'Expected object with keys: {required}')
    extra = value.keys() - set(required) - set(optional)
    if extra:
        raise ValueError(f'Unknown keys: {sorted(extra)}')


def sequence(value, nonempty=True):
    if not isinstance(value, list) or (nonempty and not value):
        raise ValueError('Expected a nonempty list' if nonempty else 'Expected a list')
    return value


def render(data, source_dir=None):
    keys(data, ('title', 'summary', 'date', 'intro', 'sections'), ('author',))
    datetime.date.fromisoformat(string(data['date']))
    ids, fragments, toc = set(), set(), []

    def inline(value):
        value = string(value)
        pattern = r'`([^`]+)`|\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^\s)]+)\)'
        result, end = [], 0
        for match in re.finditer(pattern, value):
            result.append(html.escape(value[end:match.start()]))
            code, strong, label, url = match.groups()
            if code is not None:
                result.append('<code>' + html.escape(code) + '</code>')
            elif strong is not None:
                result.append('<strong>' + html.escape(strong) + '</strong>')
            else:
                parsed = urlsplit(url)
                if url.startswith('#'):
                    fragments.add(url[1:])
                elif parsed.scheme not in ('http', 'https') or not parsed.netloc:
                    raise ValueError(f'Unsupported link: {url}')
                result.append(f'<a href="{html.escape(url, quote=True)}">{html.escape(label)}</a>')
            end = match.end()
        result.append(html.escape(value[end:]))
        return ''.join(result)

    def blocks(values):
        output = []
        for value in sequence(values, nonempty=False):
            if isinstance(value, str):
                output.append('<p>' + inline(value) + '</p>')
            elif isinstance(value, dict) and 'list' in value:
                keys(value, ('list',), ('ordered',))
                if type(value.get('ordered', False)) is not bool:
                    raise ValueError('ordered must be boolean')
                tag = 'ol' if value.get('ordered') else 'ul'
                output.append(f'<{tag}>' + ''.join('<li>' + inline(x) + '</li>' for x in sequence(value['list'])) + f'</{tag}>')
            elif isinstance(value, dict) and 'code' in value:
                keys(value, ('code',), ('language',))
                label = html.escape(string(value.get('language', 'text')))
                output.append(f'<figure><figcaption>{label}</figcaption><pre tabindex="0"><code>{html.escape(string(value["code"]))}</code></pre></figure>')
            elif isinstance(value, dict) and 'mermaid' in value:
                keys(value, ('mermaid', 'svg', 'caption', 'alt'))
                if source_dir is None:
                    raise ValueError('Diagram blocks require an article source directory')
                def asset(field, suffix):
                    path = (source_dir / string(value[field])).resolve()
                    if not path.is_relative_to(source_dir.resolve()) or path.suffix != suffix:
                        raise ValueError(f'Diagram {field} must be a {suffix} file within the article directory')
                    return path.read_bytes()
                source = asset('mermaid', '.mmd').decode('utf-8')
                svg = asset('svg', '.svg')
                if b'<svg' not in svg:
                    raise ValueError('Diagram SVG is missing its root element')
                encoded = base64.b64encode(svg).decode('ascii')
                alt = html.escape(string(value['alt']), quote=True)
                output.append(f'<figure class="diagram"><div class="diagram-scroll" tabindex="0" role="region" aria-label="Scrollable diagram"><img src="data:image/svg+xml;base64,{encoded}" alt="{alt}"></div><figcaption>{inline(value["caption"])}</figcaption><details><summary>Mermaid source</summary><pre tabindex="0"><code>{html.escape(source)}</code></pre></details></figure>')
            elif isinstance(value, dict) and 'quote' in value:
                keys(value, ('quote',))
                output.append('<blockquote><p>' + inline(value['quote']) + '</p></blockquote>')
            elif isinstance(value, dict) and 'table' in value:
                keys(value, ('table',))
                table = value['table']
                keys(table, ('headers', 'rows'))
                headers = sequence(table['headers'])
                rows = sequence(table['rows'])
                cells = []
                for row in rows:
                    if len(sequence(row)) != len(headers):
                        raise ValueError('Table row width must match headers')
                    cells.append('<tr>' + ''.join('<td>' + inline(x) + '</td>' for x in row) + '</tr>')
                output.append('<div class="table-scroll" tabindex="0" role="region" aria-label="Comparison table"><table><thead><tr>' + ''.join('<th scope="col">' + inline(x) + '</th>' for x in headers) + '</tr></thead><tbody>' + ''.join(cells) + '</tbody></table></div>')
            else:
                raise ValueError('Unknown block type')
        return ''.join(output)

    def sections(values, parent=''):
        output = []
        for index, section in enumerate(sequence(values), 1):
            keys(section, ('heading', 'blocks'), ('children',) if not parent else ())
            ident = f'{parent}-{index}' if parent else f'section-{index}'
            ids.add(ident)
            level = 3 if parent else 2
            title = html.escape(string(section['heading']))
            toc.append(f'<li class="level-{level}"><a href="#{ident}">{title}</a></li>')
            body = blocks(section['blocks'])
            children = sections(section['children'], ident) if section.get('children') else ''
            output.append(f'<section aria-labelledby="{ident}"><h{level} id="{ident}">{title}</h{level}>{body}{children}</section>')
        return ''.join(output)

    intro = blocks(data['intro'])
    body = sections(data['sections'])
    if fragments - ids:
        raise ValueError(f'Unknown section links: {sorted(fragments - ids)}')
    title = html.escape(string(data['title']))
    summary = html.escape(string(data['summary']))
    author = html.escape(string(data['author'])) + ' · ' if 'author' in data else ''
    assets = Path(__file__).resolve().parent.parent / 'assets'
    css = (assets / 'reading.css').read_text()
    script = (assets / 'reading.js').read_text() + '\n' + (assets / 'annotations.js').read_text()
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{title}</title><style>{css}</style></head>
<body><a class="skip" href="#article">Skip to article</a><div class="layout"><aside><nav aria-label="In this article"><details open><summary>In this article</summary><ol>{''.join(toc)}</ol></details><details class="reading-controls" data-reading-controls hidden><summary>Keyboard reading</summary><label><input type="checkbox" data-reading-keys checked> Enable shortcuts</label><p><kbd>j</kbd> / <kbd>k</kbd> down / up<br><kbd>d</kbd> / <kbd>u</kbd> half page<br><kbd>gg</kbd> top · <kbd>G</kbd> bottom</p><p>Ctrl+D / Ctrl+U also work. Browser Find stays available.</p></details></nav></aside><main id="article"><header><h1>{title}</h1><p class="meta">{author}<time datetime="{data['date']}">{data['date']}</time></p><p class="summary">{summary}</p></header><article>{intro}{body}</article><footer><a href="#article">Back to top ↑</a></footer></main></div><script>{script}</script></body></html>'''


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input', type=Path)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--output', type=Path)
    mode.add_argument('--check', action='store_true')
    args = parser.parse_args()
    try:
        if args.output and args.input.resolve() == args.output.resolve():
            raise ValueError('Output must differ from input')
        result = render(json.loads(args.input.read_text()), args.input.resolve().parent)
        if args.output:
            args.output.parent.mkdir(parents=True, exist_ok=True)
            args.output.write_text(result)
        print(f'Valid article: {args.output or args.input}')
    except (ValueError, TypeError, OSError) as error:
        print(f'Error: {error}', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
