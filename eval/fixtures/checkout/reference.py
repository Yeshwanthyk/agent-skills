"""Reference browser replay, not an agent score. See REPLAY.md."""
import argparse
import json
import re
import selectors
import shutil
import sqlite3
import subprocess
import tempfile
from contextlib import closing
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait


def drive(browser, url, db):
    wait = WebDriverWait(browser, 8)

    def element(name):
        return browser.find_element(By.ID, name)

    def ledger():
        with closing(sqlite3.connect(db.as_uri() + '?mode=ro', uri=True)) as conn:
            return conn.execute('SELECT order_id FROM payments ORDER BY id').fetchall()

    browser.get(url)
    order = element('order-id').text.strip()
    if not order or ledger():
        raise RuntimeError('Expected an order and an empty ledger before driving')
    element('submit').click()
    status = wait.until(lambda _: 'Retry' in element('status').text and element('status').text)
    first_rows = ledger()
    events = [json.loads(entry['message'])['message'] for entry in browser.get_log('performance')]
    posts = [e['params'] for e in events if e['method'] == 'Network.requestWillBeSent'
             and e['params']['request']['url'] == url + '/checkout'
             and e['params']['request']['method'] == 'POST']
    ids = {p['requestId'] for p in posts if json.loads(p['request']['postData'])['key'] == order}
    errors = [e['params']['errorText'] for e in events if e['method'] == 'Network.loadingFailed'
              and e['params']['requestId'] in ids]
    drop = first_rows == [(order,)] and len(posts) == 1 and errors == ['net::ERR_EMPTY_RESPONSE']
    element('submit').click()
    before = wait.until(lambda _: element('receipt').text)
    rows = ledger()
    browser.refresh()
    wait.until(lambda _: browser.find_element(By.TAG_NAME, 'body').get_attribute('data-reconciled') == order)
    after = element('receipt').text
    view = element('status').text
    receipt = re.fullmatch(r'Receipt #\d+ for (.+) — Paid \$25\.00', after)
    return dict(order=order, status=status, first_rows=first_rows, network_errors=errors,
                retry_rows=rows, before_reload=before, after_reload=after,
                drop=drop, durable=rows == [(order,)], reconciled=order, status_after_reload=view,
                receipt_order=receipt[1] if receipt else None)


def run(setup, variant):
    with tempfile.TemporaryDirectory(prefix='checkout-replay-') as tmp:
        root = Path(tmp)
        subprocess.run(['sh', setup, root, variant], check=True)
        db = root / 'checkout.sqlite'
        app = subprocess.Popen(['python3', 'app.py', '--port', '0', '--db', db], cwd=root,
                               stdout=subprocess.PIPE, text=True)
        try:
            with selectors.DefaultSelector() as ready:
                ready.register(app.stdout, selectors.EVENT_READ)
                if not ready.select(timeout=8):
                    raise RuntimeError('Checkout did not announce a port')
                line = app.stdout.readline().strip()
            match = re.fullmatch(r'Listening on (http://127\.0\.0\.1:\d+)', line)
            if not match:
                raise RuntimeError(f'Unexpected startup: {line!r}')
            opts = webdriver.ChromeOptions()
            opts.binary_location = shutil.which('chromium') or 'chromium'
            opts.add_experimental_option('prefs', {'net.network_prediction_options': 2})
            for arg in ['--disable-preconnect', '--headless', '--no-sandbox', '--disable-dev-shm-usage']:
                opts.add_argument(arg)
            opts.set_capability('goog:loggingPrefs', {'performance': 'ALL'})
            with webdriver.Chrome(service=Service(shutil.which('chromedriver')), options=opts) as browser:
                return drive(browser, match[1], db)
        finally:
            app.terminate()
            app.wait(timeout=5)
            app.stdout.close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--setup', type=Path, default=Path(__file__).with_name('setup.sh'))
    args = parser.parse_args()
    ok = True
    for name in ('good', 'duplicate', 'stale', 'spinner'):
        evidence = run(args.setup.resolve(), name)
        expected_order = {'stale': 'previous-order', 'spinner': None}.get(name, evidence['order'])
        expected_view = 'Loading receipt…' if name == 'spinner' else 'Order confirmed'
        matched = (evidence['drop'] and evidence['durable'] == (name != 'duplicate')
                   and evidence['receipt_order'] == expected_order
                   and evidence['status_after_reload'] == expected_view
                   and (name != 'spinner' or evidence['after_reload'] == ''))
        print(json.dumps(dict(variant=name, expected_signature=matched, **evidence)), flush=True)
        ok &= matched
    raise SystemExit(0 if ok else 1)
