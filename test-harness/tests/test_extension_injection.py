import time

from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

# Deliberately scoped narrow: this confirms the REAL built MV3 extension
# (not a reimplementation) injects on Workday-shaped DOM and that Navigator's
# step classifier correctly reads the fixture's heading — not a full
# resume-to-submission run. See test-harness/README.md for why broader,
# live-multi-tenant coverage is intentionally NOT automated here.


def test_panel_mounts_and_classifies_the_step(driver, fixture_server):
    driver.get(f"{fixture_server}/workday_my_information.html")
    host = WebDriverWait(driver, 10).until(
        lambda active_driver: active_driver.find_element(By.ID, "workday-autofill-host")
    )
    shadow_text = driver.execute_script(
        "return arguments[0].shadowRoot.textContent;", host
    )

    assert "Workday Autofill Assistant" in shadow_text
    assert "My Information" in shadow_text
