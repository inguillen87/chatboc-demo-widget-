import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Load the file
        filepath = os.path.abspath("BotCasino.html")
        print(f"Loading {filepath}")
        await page.goto(f"file://{filepath}")

        # 1. Verify Dark Mode Toggle
        toggle = await page.query_selector('button[onclick="toggleTheme()"]')
        if toggle:
            print("✅ Dark Mode toggle found.")
            await toggle.click()
            is_dark = await page.evaluate("document.documentElement.classList.contains('dark')")
            if is_dark:
                print("✅ Dark Mode activated successfully.")
            else:
                print("❌ Dark Mode activation failed.")
        else:
            print("❌ Dark Mode toggle NOT found.")

        # 2. Verify Quick Replies (Visible in Agent Tab)
        # Ensure we are in agent tab
        await page.evaluate("switchTab('agent')")
        replies_container = await page.query_selector('#quick-replies')
        if replies_container:
            # Check visibility
            visible = await replies_container.is_visible()
            if visible:
                print("✅ Quick Replies container found and visible.")
                chips = await replies_container.query_selector_all('.chip')
                if len(chips) > 0:
                    texts = [await c.inner_text() for c in chips]
                    print(f"✅ Found chips: {texts}")
                else:
                    print("❌ No chips found inside Quick Replies container.")
            else:
                 print("❌ Quick Replies container found but NOT visible.")
        else:
            print("❌ Quick Replies container NOT found.")

        # 3. Verify PDF Export Button (Visible in Dashboard Tab)
        await page.evaluate("switchTab('dashboard')")
        pdf_btn = await page.query_selector('button[onclick="downloadPDF()"]')
        if pdf_btn:
            visible = await pdf_btn.is_visible()
            if visible:
                print("✅ PDF Export button found and visible.")
            else:
                 print("❌ PDF Export button found but NOT visible.")
        else:
            print("❌ PDF Export button NOT found.")

        # 4. Verify Persistence
        # Switch back to Agent tab
        await page.evaluate("switchTab('agent')")

        # Type a message
        # Wait for input to be visible
        await page.wait_for_selector('#user-input', state='visible')
        await page.fill('#user-input', 'Test Persistence')
        await page.click('button[onclick="processInput()"]')

        # Wait for bot response (simulated)
        await page.wait_for_timeout(2000)

        # Reload page
        print("Reloading page...")
        await page.reload()

        # Verify persistence (Wait for messages to load)
        await page.wait_for_selector('#chat-messages', state='visible')
        # Wait a bit for JS to populate from LocalStorage
        await page.wait_for_timeout(1000)

        content = await page.content()
        if 'Test Persistence' in content:
            print("✅ Chat persistence verified (message found after reload).")
        else:
            print("❌ Chat persistence FAILED (message lost).")

        # Screenshot
        await page.screenshot(path="verification/enhanced_bot_check.png")
        print("📸 Screenshot saved to verification/enhanced_bot_check.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
