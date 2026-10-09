from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from selenium.common.exceptions import NoAlertPresentException, WebDriverException
import time
from pathlib import Path

# ============================================================
# FOOD CONNECT - EXPERIMENT 10
# Functional, Usability and Interface Testing using Selenium
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

PAGES = [
    "01-splash.html",
    "02-login.html",
    "03-signup.html",
    "04-home.html",
    "05-donate.html",
    "06-ai-matching.html",
    "07-ngo-detail.html",
    "08-profile.html",
    "09-alerts.html",
    "10-request-pickup.html",
    "11-track-delivery.html",
    "12-ngo-register.html",
    "13-ngo-request-food.html",
    "14-ngo-confirmation.html",
    "15-volunteer-profile.html",
    "16-volunteer-register.html",
    "17-admin-login.html",
    "18-admin-dashboard.html",
    "19-admin-volunteers.html",
    "20-admin-donations.html",
    "21-admin-requests.html",
    "22-admin-matches.html",
]

# Important controls that are expected when a page is directly accessible.
PAGE_ELEMENTS = {
    "01-splash.html": [
        (By.CSS_SELECTOR, "a.landing-cta")
    ],

    "02-login.html": [
        (By.ID, "loginType"),
        (By.ID, "loginEmail"),
        (By.ID, "loginPassword"),
        (By.ID, "loginSubmitBtn")
    ],

    "03-signup.html": [
        (By.ID, "signupName"),
        (By.ID, "signupEmail"),
        (By.ID, "signupPassword"),
        (By.ID, "confirmPassword"),
        (By.ID, "terms"),
    ],

    "05-donate.html": [
        (By.TAG_NAME, "form"),
    ],

    "06-ai-matching.html": [
        (By.TAG_NAME, "body"),
    ],

    "07-ngo-detail.html": [
        (By.TAG_NAME, "body"),
    ],

    "09-alerts.html": [
        (By.TAG_NAME, "body"),
    ],

    "10-request-pickup.html": [
        (By.TAG_NAME, "body"),
    ],

    "12-ngo-register.html": [
        (By.TAG_NAME, "form"),
    ],

    "13-ngo-request-food.html": [
        (By.TAG_NAME, "form"),
    ],

    "15-volunteer-profile.html": [
        (By.TAG_NAME, "body"),
    ],

    "16-volunteer-register.html": [
        (By.ID, "name"),
        (By.ID, "email"),
        (By.ID, "password"),
        (By.ID, "confirmPassword"),
        (By.ID, "phone"),
        (By.ID, "vehicle"),
        (By.ID, "baseAddress"),
        (By.ID, "maxDistance"),
        (By.ID, "availability"),
        (By.ID, "registerButton"),
    ],

    "17-admin-login.html": [
        (By.ID, "email"),
        (By.ID, "password"),
        (By.ID, "loginButton"),
    ],

    "18-admin-dashboard.html": [
        (By.ID, "welcomeText"),
        (By.ID, "volunteerCount"),
        (By.ID, "donationCount"),
        (By.ID, "requestCount"),
        (By.ID, "matchCount"),
    ],

    "19-admin-volunteers.html": [
        (By.TAG_NAME, "body"),
    ],

    "20-admin-donations.html": [
        (By.TAG_NAME, "body"),
    ],

    "21-admin-requests.html": [
        (By.TAG_NAME, "body"),
    ],

    "22-admin-matches.html": [
        (By.TAG_NAME, "body"),
    ],
}


def accept_alert(driver):
    """Accept an alert and return its text, or return None."""
    try:
        alert = driver.switch_to.alert
        text = alert.text
        alert.accept()
        return text
    except NoAlertPresentException:
        return None


def open_page(driver, page):
    """Open a local HTML page."""
    driver.get((BASE_DIR / page).resolve().as_uri())
    time.sleep(0.35)


def check_page_interface(driver, page):
    """
    Interface/access smoke test.

    Some Food Connect pages are intentionally protected. If a protected page
    displays 'Please log in to continue.' or redirects to login, that is
    treated as a successful access-control test rather than a broken page.
    """
    open_page(driver, page)

    # Some pages use a JavaScript alert for access control.
    alert_text = accept_alert(driver)

    if alert_text == "Please log in to continue.":
        print(f"{page:<30} PASS  (login protection)")
        return "PASS"

    # Admin pages can redirect unauthenticated users to admin login.
    current_name = Path(driver.current_url.split("?")[0]).name

    if page.startswith("17-") or page.startswith("18-") or \
       page.startswith("19-") or page.startswith("20-") or \
       page.startswith("21-") or page.startswith("22-"):

        if current_name == "17-admin-login.html" and page != "17-admin-login.html":
            print(f"{page:<30} PASS  (admin protection)")
            return "PASS"

    # Normal page/interface checks.
    assert driver.title.strip(), f"{page}: page title is empty"

    body = driver.find_element(By.TAG_NAME, "body")
    assert body.is_displayed(), f"{page}: body is not visible"

    for by, value in PAGE_ELEMENTS.get(page, []):
        element = driver.find_element(by, value)
        assert element.is_displayed(), f"{page}: element not visible: {value}"

    print(f"{page:<30} PASS")
    return "PASS"


def test_login(driver):
    """Functional and interface tests for the Food Connect login page."""
    open_page(driver, "02-login.html")

    login_type = driver.find_element(By.ID, "loginType")
    email = driver.find_element(By.ID, "loginEmail")
    password = driver.find_element(By.ID, "loginPassword")
    login_button = driver.find_element(By.ID, "loginSubmitBtn")

    assert login_type.is_displayed()
    assert email.is_displayed()
    assert password.is_displayed()
    assert login_button.is_displayed()
    assert login_button.text.strip() == "Log In"

    print("Login interface test passed")

    # Empty email functional test.
    driver.execute_script(
        "arguments[0].scrollIntoView({block:'center'});",
        login_button
    )
    time.sleep(0.3)

    # JavaScript click avoids the fixed/footer overlay problem
    # encountered with normal Selenium click().
    driver.execute_script("arguments[0].click();", login_button)

    message = accept_alert(driver)
    assert message == "Please enter your email address."
    print("Login empty-email test passed")

    # Invalid-login functional test.
    email.send_keys("wrong@example.com")
    password.send_keys("wrongpassword")

    driver.execute_script(
        "arguments[0].scrollIntoView({block:'center'});",
        login_button
    )
    time.sleep(0.3)
    driver.execute_script("arguments[0].click();", login_button)

    message = accept_alert(driver)

    assert message in [
        "No account found. Please sign up first as a Donor.",
        "Email address is incorrect.",
        "Password is incorrect.",
        "Role mismatch. Please choose the correct account type.",
    ], f"Unexpected login message: {message}"

    print("Invalid-login test passed")

    # Volunteer interface.
    Select(login_type).select_by_value("volunteer")
    volunteer_field = driver.find_element(
        By.ID, "volunteerStatusField"
    )
    assert volunteer_field.is_displayed()

    # NGO interface.
    Select(login_type).select_by_value("ngo")
    ngo_field = driver.find_element(
        By.ID, "ngoStatusField"
    )
    assert ngo_field.is_displayed()

    print("Login role-selection test passed")


def test_signup(driver):
    """Signup interface and empty-field validation."""
    open_page(driver, "03-signup.html")

    assert driver.find_element(By.ID, "signupName").is_displayed()
    assert driver.find_element(By.ID, "signupEmail").is_displayed()
    assert driver.find_element(By.ID, "signupPassword").is_displayed()
    assert driver.find_element(By.ID, "confirmPassword").is_displayed()

    # Find the actual Create Account button by its text.
    create_button = driver.find_element(
        By.XPATH,
        "//button[contains(normalize-space(.), 'Create Account')]"
    )

    driver.execute_script(
        "arguments[0].scrollIntoView({block:'center'});",
        create_button
    )
    time.sleep(0.3)
    driver.execute_script("arguments[0].click();", create_button)

    message = accept_alert(driver)
    assert message == "Please enter your full name."

    print("Signup interface/validation test passed")


def test_form_requirements(driver):
    """Basic usability checks for accessible form pages."""
    pages = [
        "05-donate.html",
        "12-ngo-register.html",
        "13-ngo-request-food.html",
        "16-volunteer-register.html",
        "17-admin-login.html",
    ]

    for page in pages:
        open_page(driver, page)

        # Skip pages protected by an access-control alert.
        message = accept_alert(driver)
        if message == "Please log in to continue.":
            continue

        forms = driver.find_elements(By.TAG_NAME, "form")
        assert len(forms) >= 1, f"{page}: no form found"

        required = driver.find_elements(
            By.CSS_SELECTOR,
            "input[required], select[required], textarea[required]"
        )

        assert len(required) >= 1, f"{page}: no required fields found"

    print("Form/usability validation test passed")


def test_navigation_links(driver):
    """Check local HTML links for broken targets."""
    failures = []

    for page in PAGES:
        open_page(driver, page)

        # Dismiss access-control alerts before inspecting links.
        accept_alert(driver)

        links = driver.find_elements(By.CSS_SELECTOR, "a[href]")

        for link in links:
            href = link.get_attribute("href") or ""

            if (
                not href
                or href.startswith("#")
                or href.startswith("http://")
                or href.startswith("https://")
                or href.startswith("javascript:")
                or href.startswith("mailto:")
            ):
                continue

            target = href.split("#")[0]
            target_name = Path(target).name

            if target_name.endswith(".html"):
                if not (BASE_DIR / target_name).exists():
                    failures.append(f"{page} -> {target_name}")

    assert not failures, "Broken local links: " + ", ".join(failures)
    print("Navigation link test passed")


def main():
    driver = webdriver.Chrome()

    passed = 0
    failed = []

    try:
        print("=" * 55)
        print("        FOOD CONNECT SELENIUM TESTING")
        print("=" * 55)

        # Test all 22 pages.
        for page in PAGES:
            try:
                result = check_page_interface(driver, page)
                if result == "PASS":
                    passed += 1
            except Exception as e:
                # Dismiss any leftover alert so the next page can run.
                try:
                    accept_alert(driver)
                except Exception:
                    pass

                failed.append((page, str(e)))
                print(f"{page:<30} FAIL")
                print("   ", str(e))

        print("-" * 55)

        # Functional tests.
        test_login(driver)
        test_signup(driver)
        test_form_requirements(driver)
        test_navigation_links(driver)

        print("-" * 55)
        print(f"Page/interface tests passed : {passed}/{len(PAGES)}")
        print(f"Page/interface tests failed : {len(failed)}/{len(PAGES)}")

        if failed:
            print("\nFailed page tests:")
            for page, reason in failed:
                print(" -", page, ":", reason)
            print("\nSome page tests need attention.")
        else:
            print("\nAll 22 page/interface tests passed.")

        print("=" * 55)
        print("Experiment 10 testing completed")
        print("=" * 55)

    finally:
        driver.quit()


if __name__ == "__main__":
    main()
