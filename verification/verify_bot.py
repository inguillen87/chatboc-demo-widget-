from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Listen to console messages
        page.on("console", lambda msg: print(f"PAGE LOG: {msg.text}"))

        # Load the local HTML file
        url = f"file://{os.getcwd()}/botcasino.html"
        print(f"Opening {url}")
        page.goto(url)

        # Wait for the initial message
        page.wait_for_selector(".bubble-bot")

        # Take a screenshot of the main menu
        page.screenshot(path="/app/verification/menu_screenshot.png")
        print("Menu screenshot taken.")

        # Check if onclick is set properly
        print("Checking onclick handler...")
        is_onclick = page.evaluate("""
            (() => {
                const buttons = Array.from(document.querySelectorAll('button.wa-btn'));
                const btn = buttons.find(b => b.innerText.includes('Hacer una recarga'));
                if (btn) {
                    console.log('Button found. Onclick type: ' + typeof btn.onclick);
                    // Try to execute onclick directly
                    if (typeof btn.onclick === 'function') {
                        try {
                            btn.onclick();
                            return true;
                        } catch (e) {
                            console.error('Error executing onclick: ' + e);
                            return false;
                        }
                    } else {
                         console.error('Onclick is not a function');
                         return false;
                    }
                } else {
                    console.error('Button not found');
                    return false;
                }
            })()
        """)

        print(f"Onclick execution result: {is_onclick}")

        page.wait_for_timeout(1000)
        user_bubbles = page.locator(".bubble-user")
        print(f"User bubbles count after direct onclick call: {user_bubbles.count()}")

        # If this worked, then the button is clickable.
        # Screenshot
        page.screenshot(path="/app/verification/after_direct_call.png")

        browser.close()

if __name__ == "__main__":
    run()
