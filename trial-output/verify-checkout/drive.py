"""Exercise checkout in a fresh browser against a private ledger."""
import json
from pathlib import Path
from tempfile import TemporaryDirectory, mkdtemp
from subprocess import Popen
from urllib.request import urlopen
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

proof = Path(mkdtemp(prefix='checkout-proof-'))
print('Evidence:', proof, flush=True)


def record(action, value):
    line = f'{action}: {value}'
    print(line, flush=True)
    with (proof / 'journey.txt').open('a') as out:
        print(line, file=out)


def check(ok, reason):
    if not ok:
        raise RuntimeError(reason)


with TemporaryDirectory(prefix='checkout-run-') as scratch:
    with (proof / 'server.log').open('w+') as log:
        server = Popen(['/usr/bin/python3', 'app.py', '--port', '0', '--db', scratch+'/payments.db'],
                       stdout=-1, stderr=log, text=True)
        try:
            base = server.stdout.readline().strip().removeprefix('Listening on ')
            check(base.startswith('http://127.0.0.1:'), 'Missing local readiness URL')

            def ledger(stage):
                with urlopen(base+'/ledger', timeout=5) as response:
                    rows = json.load(response)
                record(stage+' ledger', rows)
                return rows

            check(not ledger('doctor'), 'Ledger must be empty')
            opts = webdriver.ChromeOptions()
            opts.set_capability('goog:loggingPrefs', {'performance': 'ALL'})
            for arg in ('--headless', '--no-sandbox', '--disable-dev-shm-usage', '--user-data-dir='+scratch+'/profile'):
                opts.add_argument(arg)
            with webdriver.Chrome(service=Service('/usr/bin/chromedriver'), options=opts) as b:
                wait = WebDriverWait(b, 8)
                el = lambda key: b.find_element(By.ID, key)
                b.get(base)
                key = el('order-id').text
                check(key and b.title == 'Checkout' and 'Order total: $25.00' in b.find_element(By.TAG_NAME, 'body').text, 'Unexpected checkout')
                def click(label):
                    button = el('submit')
                    check(button.text == label and button.is_enabled(), 'Expected '+label)
                    record('Click', label)
                    button.click()

                def requests_since_last_check():
                    seen = []
                    for entry in b.get_log('performance'):
                        event = json.loads(entry['message'])['message']
                        if event['method'] == 'Network.requestWillBeSent':
                            req = event['params']['request']
                            if req['url'].startswith(base+'/'):
                                seen.append((req['method'], req['url'][len(base):]))
                    record('Browser requests', seen)
                    return seen

                click('Submit order')
                wait.until(lambda _: el('status').text == 'Connection lost. Retry to confirm your order.')
                record('Interruption', el('status').text)
                check(requests_since_last_check().count(('POST', '/checkout')) == 1, 'Missing initial checkout request')
                first = ledger('interrupted')
                check(len(first) == 1 and first[0]['order_id'] == key and first[0]['amount_cents'] == 2500, 'Expected one committed $25 payment for displayed order')
                expected = f"Receipt #{first[0]['id']} for {key} — Paid $25.00"
                click('Retry')
                def confirmed(stage):
                    wait.until(lambda _: el('status').text == 'Order confirmed' and el('receipt').text == expected)
                    check(not el('submit').is_displayed(), 'Payment control still visible')
                    record(stage, el('receipt').text+' at '+b.current_url)
                    check(ledger(stage) == first, 'Payment changed or duplicated')

                confirmed('retry')
                check(requests_since_last_check().count(('POST', '/checkout')) == 1, 'Retry did not resubmit once')
                check(b.current_url == base+'/#receipt', 'Missing receipt location')
                record('Reload', b.current_url)
                b.refresh()
                confirmed('return')
                seen = requests_since_last_check()
                check(('GET', '/receipt?key='+key) in seen and all(m != 'POST' for m, _ in seen), 'Return must read the receipt without paying again')
        finally:
            server.terminate()
            server.wait()
record('PASS', 'same receipt and single payment after reload')
