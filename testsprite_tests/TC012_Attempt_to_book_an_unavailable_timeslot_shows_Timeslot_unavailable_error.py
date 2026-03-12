import asyncio
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()

        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )

        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)

        # Open a new page in the browser context
        page = await context.new_page()

        # Interact with the page elements to simulate user flow
        # -> Navigate to http://localhost:4173
        await page.goto("http://localhost:4173")
        
        # -> Accept the privacy consent, fill email and password, then click 'Sign In' to proceed to the dashboard.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/button').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        frame = context.pages[-1]
        # Input text
        elem = frame.locator('xpath=/html/body/div/div[2]/div/div/form/div/input').nth(0)
        await asyncio.sleep(3); await elem.fill('abhishekedla9133@gmail.com')
        
        frame = context.pages[-1]
        # Input text
        elem = frame.locator('xpath=/html/body/div/div[2]/div/div/form/div[2]/div[2]/input').nth(0)
        await asyncio.sleep(3); await elem.fill('8309176874')
        
        # -> Click the 'Sign In' button (index 15) to submit the login form and proceed to the dashboard.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div[2]/div/div/form/button').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # -> Click the 'Doctors' link (top nav) to open the doctors list and proceed to select a doctor (click index 181).
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div[2]/header/div/nav/a[2]').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # -> Click the first doctor's 'View Profile & Book' button (index 1254) to open that doctor's profile and booking slots.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div[2]/main/section[4]/div/div/div[2]/div/button').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # -> Open the booking UI by clicking the 'Book Appointment' button so timeslots are displayed, then select an unavailable timeslot and attempt to confirm booking to verify the 'Timeslot unavailable' error message.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div[2]/main/section[2]/div/div/div/div/button').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # -> Click an available timeslot (choose a selectable slot) and then click the 'Confirm Physical Appointment' button to attempt booking and check for the 'Timeslot unavailable' error message.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div[2]/main/div/div/form/div[4]/div/button[4]').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div[2]/main/div/div/form/button').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # -> Fill the Appointment Date field (index 1646) with a valid date and click the 'Confirm Physical Appointment' button (index 1671) to attempt booking and check for the 'Timeslot unavailable' message.
        frame = context.pages[-1]
        # Input text
        elem = frame.locator('xpath=/html/body/div/div[2]/main/div/div/form/div[3]/input').nth(0)
        await asyncio.sleep(3); await elem.fill('2026-03-12')
        
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div[2]/main/div/div/button').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # -> Click the 'Confirm Physical Appointment' button (index 1670) to submit the booking and then verify the UI shows the 'Timeslot unavailable' message.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div[2]/main/div/div/form/button').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # -> Click the 'Confirm Physical Appointment' button (index 1670) to submit the booking request so the UI can be checked for the 'Timeslot unavailable' message.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div[2]/main/div/div/form/button').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # --> Assertions to verify final state
        frame = context.pages[-1]
        current_url = await frame.evaluate("() => window.location.href")
        assert '/dashboard' in current_url
        assert await frame.locator("xpath=//*[contains(., 'Timeslot unavailable')]").nth(0).is_visible(), "Expected 'Timeslot unavailable' to be visible"
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    