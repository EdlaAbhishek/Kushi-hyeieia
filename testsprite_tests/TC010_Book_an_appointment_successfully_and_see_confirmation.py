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
        
        # -> Dismiss the privacy consent, fill the email and password fields with provided credentials, and click the Sign In button to log in.
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
        
        # -> Click the 'Sign In' button to submit the login form and proceed to the dashboard.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div[2]/div/div/form/button').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # -> Click the '+ New Appointment' button to open the appointment booking flow (element index 264).
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div[2]/main/div/div/section/div/div/div[2]/a').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # -> Click a doctor from the doctors list by selecting their 'View Profile & Book' button so the doctor's profile and available timeslots open.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div[2]/main/section[4]/div/div/div[2]/div/button').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # -> Open the booking/timeslot selector by clicking the 'Book Appointment' button so an available timeslot can be selected.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div[2]/main/section[2]/div/div/div/div/button').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # -> Click an available timeslot (choose an unbooked slot such as '09:00 AM'), then click 'Confirm Physical Appointment', then verify that the text 'Booking confirmation' is visible.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div[2]/main/div/div/form/div[4]/div/button').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div[2]/main/div/div/form/button').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # -> Fill the Appointment Date field with a valid date, reselect the 09:00 AM timeslot, click the Confirm button to submit the booking, and verify the 'Booking confirmation' message appears.
        frame = context.pages[-1]
        # Input text
        elem = frame.locator('xpath=/html/body/div/div[2]/main/div/div/form/div[3]/input').nth(0)
        await asyncio.sleep(3); await elem.fill('2026-03-12')
        
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div[2]/main/div/div/form/div[4]/div/button').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div[2]/main/div/div/button').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # -> Click the 'Confirm Physical Appointment' button and verify that the text 'Booking confirmation' appears on the page.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div[2]/main/div/div/form/button').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # --> Assertions to verify final state
        frame = context.pages[-1]
        current_url = await frame.evaluate("() => window.location.href")
        assert '/dashboard' in current_url
        assert await frame.locator("xpath=//*[contains(., 'Booking confirmation')]").nth(0).is_visible(), "Expected 'Booking confirmation' to be visible"
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    