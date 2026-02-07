from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Listen to console messages
        page.on("console", lambda msg: print(f"PAGE LOG: {msg.text}"))

        # Load the local HTML file (BotCasino.html)
        url = f"file://{os.getcwd()}/BotCasino.html"
        print(f"Opening {url}")
        page.goto(url)

        # Wait for the initial message
        page.wait_for_selector(".bubble-bot")

        # Take a screenshot of the main menu
        page.screenshot(path="/app/verification/menu_screenshot_final.png")
        print("Menu screenshot taken.")

        # Check buttons
        buttons = page.locator("button.wa-btn")
        count = buttons.count()
        print(f"Found {count} buttons.")

        for i in range(count):
            print(f"Button {i}: {buttons.nth(i).inner_text()}")

        # Click on 'Hacer una recarga' (Option 1)
        print("Clicking 'Hacer una recarga'...")

        # Use a more specific selector
        recharge_btn = page.locator("button.wa-btn").filter(has_text="Hacer una recarga")
        if recharge_btn.count() > 0:
            print("Button found. Clicking...")
            # We use evaluate to click because sometimes overlays can interfere in headless mode or styles
            recharge_btn.click()
        else:
            print("Button NOT found!")

        # Wait a bit to see if user message appears
        page.wait_for_timeout(1000)
        page.screenshot(path="/app/verification/after_click_final.png")
        print("After click screenshot taken.")

        # Check if user bubble appeared
        user_bubbles = page.locator(".bubble-user")
        print(f"User bubbles count: {user_bubbles.count()}")
        if user_bubbles.count() > 0:
            print(f"User message: {user_bubbles.last.inner_text()}")

        # Wait for the response
        print("Waiting for 'RECARGA DE SALDO'...")
        try:
            page.wait_for_selector("text=RECARGA DE SALDO", timeout=5000)
            print("Response found!")
        except Exception as e:
            print(f"Error waiting for response: {e}")
            page.screenshot(path="/app/verification/error_state_final.png")
            browser.close()
            return

        # Take a screenshot of the recharge options
        page.screenshot(path="/app/verification/recharge_screenshot_final.png")
        print("Recharge screenshot taken.")

        browser.close()

if __name__ == "__main__":
    run()
