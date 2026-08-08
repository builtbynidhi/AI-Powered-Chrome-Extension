import http.server
import pathlib
import socket
import threading
import time

import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

FIXTURES_DIR = pathlib.Path(__file__).parent / "fixtures"
EXTENSION_DIST = pathlib.Path(__file__).parent.parent / "extension" / "dist"


def _free_port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


@pytest.fixture(scope="session")
def fixture_server():
    """Serves test-harness/fixtures/ over 127.0.0.1 so the extension's
    content script (matched to http://127.0.0.1/*, see manifest.config.ts)
    actually injects — a plain file:// URL wouldn't match host_permissions."""
    port = _free_port()
    handler = lambda *args: http.server.SimpleHTTPRequestHandler(*args, directory=str(FIXTURES_DIR))
    server = http.server.HTTPServer(("127.0.0.1", port), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    yield f"http://127.0.0.1:{port}"
    server.shutdown()


@pytest.fixture(scope="session")
def driver():
    if not EXTENSION_DIST.exists():
        pytest.skip("extension/dist not built — run `npm run build` in extension/ first")

    options = Options()
    # NOTE: intentionally NOT headless — Chrome's extension loading in
    # headless mode is unreliable across versions; a real (offscreen-ish,
    # small) window is more trustworthy for an MV3 content-script test.
    options.add_argument("--window-size=600,400")
    options.add_argument(f"--load-extension={EXTENSION_DIST.resolve()}")
    chrome_driver = webdriver.Chrome(options=options)
    chrome_driver.get("chrome://extensions/")
    time.sleep(0.5)
    loaded = chrome_driver.execute_script(
        """const manager=document.querySelector('extensions-manager');
        const list=manager?.shadowRoot?.querySelector('extensions-item-list');
        return list?.shadowRoot?.querySelectorAll('extensions-item').length || 0;"""
    )
    if loaded == 0:
        version = chrome_driver.capabilities.get("browserVersion", "unknown")
        chrome_driver.quit()
        pytest.skip(f"Chrome {version} ignored --load-extension; manual load-unpacked verification required")
    yield chrome_driver
    chrome_driver.quit()


@pytest.fixture(autouse=True)
def _settle():
    yield
    time.sleep(0.3)  # let the extension's mutation-settle debounce finish before the next assertion
