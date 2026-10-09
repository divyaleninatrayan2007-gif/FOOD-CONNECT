from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from selenium.common.exceptions import (
    NoAlertPresentException,
    UnexpectedAlertPresentException
)
from pathlib import Path
from urllib.parse import urlparse, unquote
import time


# =========================================================
# FOOD CONNECT SELENIUM TESTING
# =========================================================

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


# =========================================================
# DRIVER SETUP
# =========================================================

def create_driver():

    options = webdriver.ChromeOptions()

    options.add_argument("--start-maximized")

    driver = webdriver.Chrome(
        options=options
    )

    driver.implicitly_wait(3)

    return driver


# =========================================================
# ALERT FUNCTIONS
# =========================================================

def get_alert_text(driver):

    try:

        alert = driver.switch_to.alert

        return alert.text

    except NoAlertPresentException:

        return None


def accept_alert(driver, attempts=5):

    for _ in range(attempts):

        try:

            alert = driver.switch_to.alert

            text = alert.text

            alert.accept()

            time.sleep(0.3)

            return text

        except NoAlertPresentException:

            time.sleep(0.3)

    raise AssertionError(
        "Expected alert was not present"
    )


def accept_alert_if_present(driver, attempts=5):

    for _ in range(attempts):

        try:

            alert = driver.switch_to.alert

            text = alert.text

            alert.accept()

            time.sleep(0.3)

            return text

        except NoAlertPresentException:

            time.sleep(0.3)

    return None


# =========================================================
# OPEN PAGE
# =========================================================

def open_page(driver, page):

    file_path = (
        BASE_DIR / page
    ).resolve()

    if not file_path.exists():

        raise FileNotFoundError(
            f"Page not found: {file_path}"
        )

    try:

        driver.get(
            file_path.as_uri()
        )

    except UnexpectedAlertPresentException:

        pass

    time.sleep(0.7)


# =========================================================
# OPEN PAGE AND CHECK LOGIN PROTECTION
# =========================================================

def open_page_with_login_check(driver, page):

    file_path = (
        BASE_DIR / page
    ).resolve()

    if not file_path.exists():

        raise FileNotFoundError(
            f"Page not found: {file_path}"
        )

    try:

        driver.get(
            file_path.as_uri()
        )

    except UnexpectedAlertPresentException:

        pass

    # Give access.js enough time to execute
    time.sleep(1)

    # -----------------------------------------------------
    # Check JavaScript alert
    # -----------------------------------------------------

    for _ in range(10):

        try:

            alert = driver.switch_to.alert

            text = alert.text

            alert.accept()

            time.sleep(0.5)

            return text

        except NoAlertPresentException:

            time.sleep(0.2)

    # -----------------------------------------------------
    # If Selenium did not catch the alert,
    # check whether access.js redirected to login page.
    # -----------------------------------------------------

    current_name = Path(
        driver.current_url.split("?")[0]
    ).name.lower()

    if current_name == "02-login.html":

        return "LOGIN_REDIRECT"

    return None


# =========================================================
# PAGE INTERFACE TEST
# =========================================================

def check_page_interface(driver, page):

    # -----------------------------------------------------
    # SPECIAL HANDLING FOR PAGE 11
    # -----------------------------------------------------

    if page == "11-track-delivery.html":

        result = open_page_with_login_check(
            driver,
            page
        )

        if result in [
            "Please log in to continue.",
            "LOGIN_REDIRECT"
        ]:

            print(
                f"{page:<30} PASS  (login protection)"
            )

            return "PASS"

        raise AssertionError(
            "Login protection was not detected"
        )

    # -----------------------------------------------------
    # NORMAL PAGE
    # -----------------------------------------------------

    open_page(
        driver,
        page
    )

    # -----------------------------------------------------
    # LOGIN PROTECTION
    # -----------------------------------------------------

    alert_text = accept_alert_if_present(
        driver,
        attempts=5
    )

    if alert_text == "Please log in to continue.":

        print(
            f"{page:<30} PASS  (login protection)"
        )

        return "PASS"

    # -----------------------------------------------------
    # ADMIN PROTECTION
    # -----------------------------------------------------

    admin_pages = [
        "18-admin-dashboard.html",
        "19-admin-volunteers.html",
        "20-admin-donations.html",
        "21-admin-requests.html",
        "22-admin-matches.html"
    ]

    current_name = Path(
        driver.current_url.split("?")[0]
    ).name

    if page in admin_pages:

        if current_name == "17-admin-login.html":

            print(
                f"{page:<30} PASS  (admin protection)"
            )

            return "PASS"

    # -----------------------------------------------------
    # BASIC INTERFACE
    # -----------------------------------------------------

    title = driver.title.strip()

    assert title, (
        f"{page}: page title is empty"
    )

    body = driver.find_element(
        By.TAG_NAME,
        "body"
    )

    assert body.is_displayed(), (
        f"{page}: body is not displayed"
    )

    # -----------------------------------------------------
    # PAGE-SPECIFIC TESTS
    # -----------------------------------------------------

    if page == "01-splash.html":

        button = driver.find_element(
            By.CSS_SELECTOR,
            "a.landing-cta"
        )

        assert button.is_displayed()

    elif page == "02-login.html":

        assert driver.find_element(
            By.ID,
            "loginType"
        ).is_displayed()

        assert driver.find_element(
            By.ID,
            "loginEmail"
        ).is_displayed()

        assert driver.find_element(
            By.ID,
            "loginPassword"
        ).is_displayed()

        assert driver.find_element(
            By.ID,
            "loginSubmitBtn"
        ).is_displayed()

    elif page == "03-signup.html":

        controls = driver.find_elements(
            By.CSS_SELECTOR,
            "input, select, textarea, button"
        )

        assert len(controls) > 0, (
            "Signup controls were not found"
        )

        buttons = driver.find_elements(
            By.XPATH,
            "//button[contains(normalize-space(.), 'Create Account')]"
        )

        assert len(buttons) > 0, (
            "Create Account button was not found"
        )

    elif page == "12-ngo-register.html":

        controls = driver.find_elements(
            By.CSS_SELECTOR,
            "input, select, textarea, button"
        )

        assert len(controls) > 0, (
            "NGO registration controls not found"
        )

    elif page == "16-volunteer-register.html":

        controls = driver.find_elements(
            By.CSS_SELECTOR,
            "input, select, textarea, button"
        )

        assert len(controls) > 0, (
            "Volunteer registration controls not found"
        )

    elif page == "17-admin-login.html":

        controls = driver.find_elements(
            By.CSS_SELECTOR,
            "input, button"
        )

        assert len(controls) > 0, (
            "Admin login controls not found"
        )

    elif page == "18-admin-dashboard.html":

        buttons = driver.find_elements(
            By.CSS_SELECTOR,
            "button"
        )

        assert len(buttons) > 0, (
            "Admin dashboard buttons not found"
        )

    # -----------------------------------------------------
    # PASS
    # -----------------------------------------------------

    print(
        f"{page:<30} PASS"
    )

    return "PASS"


# =========================================================
# LOGIN TEST
# =========================================================

def test_login(driver):

    login_page = (
        BASE_DIR / "02-login.html"
    ).resolve()

    driver.get(
        login_page.as_uri()
    )

    time.sleep(0.7)

    # -----------------------------------------------------
    # Interface
    # -----------------------------------------------------

    login_type = driver.find_element(
        By.ID,
        "loginType"
    )

    email = driver.find_element(
        By.ID,
        "loginEmail"
    )

    password = driver.find_element(
        By.ID,
        "loginPassword"
    )

    login_button = driver.find_element(
        By.ID,
        "loginSubmitBtn"
    )

    assert login_type.is_displayed()
    assert email.is_displayed()
    assert password.is_displayed()
    assert login_button.is_displayed()

    print(
        "Login interface test passed"
    )

    # -----------------------------------------------------
    # Empty email
    # -----------------------------------------------------

    email.clear()
    password.clear()

    driver.execute_script(
        "arguments[0].click();",
        login_button
    )

    message = accept_alert(driver)

    assert message == (
        "Please enter your email address."
    ), (
        f"Unexpected empty-email message: {message}"
    )

    print(
        "Login empty-email test passed"
    )

    # -----------------------------------------------------
    # Invalid login
    # -----------------------------------------------------

    email.clear()
    password.clear()

    email.send_keys(
        "invalid@example.com"
    )

    password.send_keys(
        "wrongpassword"
    )

    driver.execute_script(
        "arguments[0].click();",
        login_button
    )

    message = accept_alert(driver)

    valid_messages = [
        "No account found. Please sign up first as a Donor.",
        "Email address is incorrect.",
        "Password is incorrect.",
        "Role mismatch. Please choose the correct account type."
    ]

    assert message in valid_messages, (
        f"Unexpected invalid-login message: {message}"
    )

    print(
        "Invalid-login test passed"
    )

    # -----------------------------------------------------
    # Volunteer role
    # -----------------------------------------------------

    select = Select(
        driver.find_element(
            By.ID,
            "loginType"
        )
    )

    select.select_by_value(
        "volunteer"
    )

    time.sleep(0.5)

    volunteer_field = driver.find_element(
        By.ID,
        "volunteerStatusField"
    )

    assert volunteer_field.is_displayed()

    # -----------------------------------------------------
    # NGO role
    # -----------------------------------------------------

    select.select_by_value(
        "ngo"
    )

    time.sleep(0.5)

    print(
        "Login role-selection test passed"
    )


# =========================================================
# SIGNUP TEST
# =========================================================

def test_signup(driver):

    signup_page = (
        BASE_DIR / "03-signup.html"
    ).resolve()

    driver.get(
        signup_page.as_uri()
    )

    time.sleep(0.7)

    controls = driver.find_elements(
        By.CSS_SELECTOR,
        "input, select, textarea, button"
    )

    assert len(controls) > 0, (
        "Signup controls were not found"
    )

    buttons = driver.find_elements(
        By.XPATH,
        "//button[contains(normalize-space(.), 'Create Account')]"
    )

    assert len(buttons) > 0, (
        "Create Account button was not found"
    )

    create_button = buttons[0]

    assert create_button.is_displayed()

    driver.execute_script(
        "arguments[0].click();",
        create_button
    )

    message = accept_alert(driver)

    assert message == (
        "Please enter your full name."
    ), (
        f"Unexpected signup validation message: {message}"
    )

    print(
        "Signup interface/validation test passed"
    )


# =========================================================
# FORM / USABILITY TEST
# =========================================================

def test_form_usability(driver):

    pages = [
        "03-signup.html",
        "12-ngo-register.html",
        "16-volunteer-register.html"
    ]

    for page in pages:

        open_page(
            driver,
            page
        )

        accept_alert_if_present(
            driver,
            attempts=3
        )

        controls = driver.find_elements(
            By.CSS_SELECTOR,
            "input, select, textarea, button"
        )

        assert len(controls) > 0, (
            f"{page}: no interface controls found"
        )

        visible_controls = [
            control
            for control in controls
            if control.is_displayed()
        ]

        assert len(visible_controls) > 0, (
            f"{page}: no visible controls found"
        )

    print(
        "Form/usability validation test passed"
    )


# =========================================================
# NAVIGATION TEST
# =========================================================

def test_navigation_links(driver):

    failures = []

    print(
        "Checking navigation links..."
    )

    for page in PAGES:

        # -------------------------------------------------
        # Open page safely
        # -------------------------------------------------

        try:

            if page == "11-track-delivery.html":

                access_result = (
                    open_page_with_login_check(
                        driver,
                        page
                    )
                )

                if access_result in [
                    "Please log in to continue.",
                    "LOGIN_REDIRECT"
                ]:
                    continue

            else:

                open_page(
                    driver,
                    page
                )

                alert_text = (
                    accept_alert_if_present(
                        driver,
                        attempts=5
                    )
                )

                if alert_text == (
                    "Please log in to continue."
                ):
                    continue

        except Exception as e:

            alert_text = (
                accept_alert_if_present(
                    driver,
                    attempts=3
                )
            )

            if alert_text == (
                "Please log in to continue."
            ):
                continue

            current_name = Path(
                driver.current_url.split("?")[0]
            ).name.lower()

            if current_name == "02-login.html":
                continue

            failures.append(
                f"{page} -> could not open page: {e}"
            )

            continue

        # -------------------------------------------------
        # ADMIN PROTECTED PAGES
        # -------------------------------------------------

        current_name = Path(
            driver.current_url.split("?")[0]
        ).name

        if page in [
            "18-admin-dashboard.html",
            "19-admin-volunteers.html",
            "20-admin-donations.html",
            "21-admin-requests.html",
            "22-admin-matches.html"
        ]:

            if current_name == "17-admin-login.html":

                continue

        # -------------------------------------------------
        # FIND LINKS
        # -------------------------------------------------

        try:

            links = driver.find_elements(
                By.TAG_NAME,
                "a"
            )

        except UnexpectedAlertPresentException:

            alert_text = (
                accept_alert_if_present(
                    driver,
                    attempts=5
                )
            )

            if alert_text == (
                "Please log in to continue."
            ):
                continue

            failures.append(
                f"{page} -> unexpected alert"
            )

            continue

        # -------------------------------------------------
        # CHECK EACH LINK
        # -------------------------------------------------

        for link in links:

            try:

                href = link.get_attribute(
                    "href"
                )

                if not href:
                    continue

                href = href.strip()

                # -----------------------------------------
                # External / special links
                # -----------------------------------------

                if (
                    href.startswith("http://")
                    or href.startswith("https://")
                    or href.startswith("mailto:")
                    or href.startswith("tel:")
                    or href.startswith("#")
                    or href.startswith("javascript:")
                ):
                    continue

                # -----------------------------------------
                # Handle file:// URLs
                # -----------------------------------------

                if href.startswith("file://"):

                    parsed = urlparse(href)

                    target_path = unquote(
                        parsed.path
                    )

                    # Windows file URLs may look like:
                    # /C:/Users/Student/...
                    #
                    # Convert to:
                    # C:/Users/Student/...

                    if (
                        len(target_path) >= 3
                        and target_path[0] == "/"
                        and target_path[2] == ":"
                    ):

                        target_path = (
                            target_path[1:]
                        )

                    target = Path(
                        target_path
                    )

                else:

                    # -------------------------------------
                    # Relative local link
                    # -------------------------------------

                    clean_href = (
                        href.split("?")[0]
                    )

                    clean_href = (
                        clean_href.split("#")[0]
                    )

                    if not clean_href:
                        continue

                    target = (
                        BASE_DIR / clean_href
                    ).resolve()

                # -----------------------------------------
                # Check target
                # -----------------------------------------

                if not target.exists():

                    failures.append(
                        f"{page} -> {href}"
                    )

            except Exception as e:

                failures.append(
                    f"{page} -> {e}"
                )

    # -----------------------------------------------------
    # Navigation result
    # -----------------------------------------------------

    if failures:

        raise AssertionError(
            "Broken navigation links found:\n"
            + "\n".join(failures)
        )

    print(
        "Navigation link test passed"
    )


# =========================================================
# MAIN
# =========================================================

def main():

    print(
        "======================================================="
    )

    print(
        "        FOOD CONNECT SELENIUM TESTING"
    )

    print(
        "======================================================="
    )

    driver = create_driver()

    passed = 0
    failed = []

    try:

        # =================================================
        # ALL 22 PAGE TESTS
        # =================================================

        for page in PAGES:

            try:

                result = check_page_interface(
                    driver,
                    page
                )

                if result == "PASS":

                    passed += 1

            except Exception as e:

                try:

                    accept_alert_if_present(
                        driver,
                        attempts=3
                    )

                except Exception:
                    pass

                failed.append(
                    (
                        page,
                        str(e)
                    )
                )

                print(
                    f"{page:<30} FAIL"
                )

                print(
                    "   ",
                    str(e)
                )

        print(
            "-------------------------------------------------------"
        )

        # =================================================
        # LOGIN TEST
        # =================================================

        try:

            test_login(
                driver
            )

        except Exception as e:

            print(
                "Login test failed:"
            )

            print(
                "   ",
                str(e)
            )

        # =================================================
        # SIGNUP TEST
        # =================================================

        try:

            test_signup(
                driver
            )

        except Exception as e:

            print(
                "Signup test failed:"
            )

            print(
                "   ",
                str(e)
            )

        # =================================================
        # FORM / USABILITY
        # =================================================

        try:

            test_form_usability(
                driver
            )

        except Exception as e:

            print(
                "Form/usability test failed:"
            )

            print(
                "   ",
                str(e)
            )

        # =================================================
        # NAVIGATION
        # =================================================

        try:

            test_navigation_links(
                driver
            )

        except Exception as e:

            print(
                "Navigation test failed:"
            )

            print(
                "   ",
                str(e)
            )

        # =================================================
        # FINAL RESULT
        # =================================================

        print(
            "-------------------------------------------------------"
        )

        print(
            f"Page/interface tests passed : "
            f"{passed}/{len(PAGES)}"
        )

        print(
            f"Page/interface tests failed : "
            f"{len(failed)}/{len(PAGES)}"
        )

        if failed:

            print()

            print(
                "Failed page tests:"
            )

            for page, error in failed:

                print(
                    f" - {page} : {error}"
                )

            print()

            print(
                "Some page tests need attention."
            )

        else:

            print()

            print(
                "ALL 22 PAGE TESTS PASSED!"
            )

        print(
            "======================================================="
        )

        print(
            "Experiment 10 testing completed"
        )

        print(
            "=======================================================" 
        )

    finally:

        driver.quit()


# =========================================================
# START PROGRAM
# =========================================================

if __name__ == "__main__":

    main()