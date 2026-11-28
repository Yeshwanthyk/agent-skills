"""Local checkout verification fixture (Python standard library only)."""
import argparse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import sqlite3
from urllib.parse import parse_qs, urlsplit


class Checkout(BaseHTTPRequestHandler):
    def respond(self, status, data, mime='application/json'):
        body = json.dumps(data).encode() if mime == 'application/json' else data
        self.send_response(status)
        self.send_header('Content-Type', mime)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        url = urlsplit(self.path)
        if url.path == '/':
            return self.respond(200, Path(__file__).with_name('checkout.html').read_bytes(), 'text/html; charset=utf-8')
        with sqlite3.connect(self.server.db) as db:
            db.row_factory = sqlite3.Row
            if url.path == '/ledger':
                return self.respond(200, [dict(r) for r in db.execute('SELECT * FROM ledger ORDER BY id')])
            if url.path == '/receipt' and self.server.variant != 'stale':
                key = parse_qs(url.query).get('key', [''])[0]
                row = db.execute('SELECT * FROM ledger WHERE key=? ORDER BY id DESC LIMIT 1', (key,)).fetchone()
                if row:
                    return self.respond(200, dict(row))
        self.respond(404, {'error': 'Not found'})

    def do_POST(self):
        if self.path != '/checkout':
            return self.respond(404, {'error': 'Not found'})
        try:
            size = int(self.headers.get('Content-Length', '0'))
            if not 0 < size <= 4096:
                raise ValueError
            key = json.loads(self.rfile.read(size))['key']
            if not isinstance(key, str) or not key:
                raise ValueError
        except (ValueError, KeyError, TypeError):
            return self.respond(400, {'error': 'Expected JSON with nonempty key'})
        with sqlite3.connect(self.server.db) as db:
            db.row_factory = sqlite3.Row
            db.execute('BEGIN IMMEDIATE')
            row = db.execute('SELECT * FROM ledger WHERE key=? ORDER BY id LIMIT 1', (key,)).fetchone()
            first = row is None
            if first or self.server.variant == 'duplicate':
                rid = db.execute('INSERT INTO ledger(key, amount_cents) VALUES (?, 2500)', (key,)).lastrowid
                row = db.execute('SELECT * FROM ledger WHERE id=?', (rid,)).fetchone()
        if first:  # Commit has completed. Close without writing even a status line.
            self.close_connection = True
            return
        self.respond(200, dict(row))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--host', default='127.0.0.1')
    parser.add_argument('--port', type=int, default=8000)
    parser.add_argument('--db', default='checkout.sqlite')
    parser.add_argument('--variant', choices=('correct', 'duplicate', 'stale'), default='correct')
    args = parser.parse_args()
    with sqlite3.connect(args.db) as db:
        db.execute('CREATE TABLE IF NOT EXISTS ledger (id INTEGER PRIMARY KEY, key TEXT NOT NULL, amount_cents INTEGER NOT NULL)')
    with ThreadingHTTPServer((args.host, args.port), Checkout) as server:
        server.db, server.variant = args.db, args.variant
        print(f'Listening on http://{args.host}:{server.server_port}', flush=True)
        server.serve_forever()
