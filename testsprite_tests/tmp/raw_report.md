
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** Kushi hygieia
- **Date:** 2026-03-10
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 Search doctors by specialization and view matching results
- **Test Code:** [TC001_Search_doctors_by_specialization_and_view_matching_results.py](./TC001_Search_doctors_by_specialization_and_view_matching_results.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/059b19e6-342d-4ed9-b1e8-9c5331844c7e/a46deb2f-2b26-45d8-988a-65d636634714
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 Search doctors by doctor name and open doctor details
- **Test Code:** [TC002_Search_doctors_by_doctor_name_and_open_doctor_details.py](./TC002_Search_doctors_by_doctor_name_and_open_doctor_details.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/059b19e6-342d-4ed9-b1e8-9c5331844c7e/0da1a10c-6959-4e79-a25a-045305b86c68
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 Search with unknown term shows No results found message
- **Test Code:** [TC003_Search_with_unknown_term_shows_No_results_found_message.py](./TC003_Search_with_unknown_term_shows_No_results_found_message.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Login page did not render: current page contains 0 interactive elements and displays a blank UI.
- Unable to interact with login form or submit credentials because no inputs or buttons are available in the DOM.
- Authentication flow could not be completed: no redirect to dashboard or main navigation was observed after multiple attempts.
- Doctor search cannot be executed because the 'Doctors' view or navigation link is not accessible.
- Screenshot shows a blank page indicating the SPA failed to load, preventing verification of the empty-state message.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/059b19e6-342d-4ed9-b1e8-9c5331844c7e/d757141d-1ad6-4aff-954b-c0b95c45e3f1
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008 Doctor profile view shows identifiable doctor information
- **Test Code:** [TC008_Doctor_profile_view_shows_identifiable_doctor_information.py](./TC008_Doctor_profile_view_shows_identifiable_doctor_information.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/059b19e6-342d-4ed9-b1e8-9c5331844c7e/bd8640d1-1a6a-4f10-b5cd-78153c2616cb
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009 Search hospitals by typing a valid location
- **Test Code:** [TC009_Search_hospitals_by_typing_a_valid_location.py](./TC009_Search_hospitals_by_typing_a_valid_location.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Login did not redirect to dashboard after submitting credentials; current URL remains '/login'.
- 'Hospitals' navigation item was not available after sign-in and cannot be accessed because the user is not authenticated.
- No clear authentication error message was presented on the page explaining why sign-in failed.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/059b19e6-342d-4ed9-b1e8-9c5331844c7e/cf8e2003-8a13-4ae9-8d9c-8b9c2b7f4bab
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010 View hospital details from a hospital card
- **Test Code:** [TC010_View_hospital_details_from_a_hospital_card.py](./TC010_View_hospital_details_from_a_hospital_card.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Login page did not render: no email/username or password input fields were found on the page.
- No interactive elements are present on the page (0 interactive elements), preventing any UI interactions required by the test.
- Hospitals/search flow cannot be tested because search inputs, results list, and hospital cards are not available.
- SPA content failed to load after navigation to /login; the page displays a blank/empty UI.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/059b19e6-342d-4ed9-b1e8-9c5331844c7e/e1e5b708-156f-404e-85a6-73259489ef53
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC011 Invalid location shows 'No hospitals found' message
- **Test Code:** [TC011_Invalid_location_shows_No_hospitals_found_message.py](./TC011_Invalid_location_shows_No_hospitals_found_message.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- SPA did not render: page loaded at http://localhost:5173/ is blank and contains 0 interactive elements.
- Login form not found on page: no email/username or password input fields present to perform authentication.
- Hospitals search flow not accessible: navigation elements or search inputs for Hospitals are not present, preventing verification of 'No hospitals found' empty state.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/059b19e6-342d-4ed9-b1e8-9c5331844c7e/d55213c6-656d-4ead-b750-45cba8e1d523
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC014 Book an appointment and see booking confirmation
- **Test Code:** [TC014_Book_an_appointment_and_see_booking_confirmation.py](./TC014_Book_an_appointment_and_see_booking_confirmation.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Sign In failed: the Sign In button was non-interactable/stale on two separate click attempts, and submitting with Enter did not navigate to the dashboard.
- Dashboard not reached: the URL did not contain '/dashboard' and no dashboard UI or booking workflow rendered after submission.
- Application UI is unstable: the page intermittently becomes blank (0 interactive elements) after interactions, preventing continuation of the booking flow.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/059b19e6-342d-4ed9-b1e8-9c5331844c7e/70825ca0-d233-47fe-a8fc-27f3c8e20b5f
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC015 Booked appointment appears in dashboard booking details
- **Test Code:** [TC015_Booked_appointment_appears_in_dashboard_booking_details.py](./TC015_Booked_appointment_appears_in_dashboard_booking_details.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Login page at http://localhost:5173/login shows 0 interactive elements, preventing any user interactions.
- Email and password input fields and the Login button are not present on the page, so login cannot be performed.
- Dashboard and booking flows could not be reached, so booking confirmation and verification cannot be tested.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/059b19e6-342d-4ed9-b1e8-9c5331844c7e/bee21d12-a9c4-4f34-b4c3-0078fc22cc44
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC016 Attempt to book a timeslot that is unavailable shows error
- **Test Code:** [TC016_Attempt_to_book_a_timeslot_that_is_unavailable_shows_error.py](./TC016_Attempt_to_book_a_timeslot_that_is_unavailable_shows_error.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/059b19e6-342d-4ed9-b1e8-9c5331844c7e/578ca39a-b05b-4b95-a387-c889d3b3c925
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC019 Booking confirmation shows the chosen doctor and timeslot information
- **Test Code:** [TC019_Booking_confirmation_shows_the_chosen_doctor_and_timeslot_information.py](./TC019_Booking_confirmation_shows_the_chosen_doctor_and_timeslot_information.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Confirmation view not found on page; 'Confirm Booking' control is missing and not visible.
- Page shows 0 interactive elements on /doctors, preventing selection of timeslot or confirmation.
- Attempts to click the doctor/timeslot controls failed or elements were not interactable (stale or not rendered).
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/059b19e6-342d-4ed9-b1e8-9c5331844c7e/3ff6d66b-35b6-4776-bcf2-f1cf75b7e286
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC022 AI chat returns a response for a general medical query
- **Test Code:** [TC022_AI_chat_returns_a_response_for_a_general_medical_query.py](./TC022_AI_chat_returns_a_response_for_a_general_medical_query.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- User message 'What are common causes of a mild headache?' not found in the chat page after submitting.
- No AI response message was found in the chat thread following the submission.
- Page content extraction/search returned 0 occurrences of the exact user message.
- The chat UI shows only the initial assistant greeting and the input field; the submitted message did not appear in the conversation.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/059b19e6-342d-4ed9-b1e8-9c5331844c7e/a889cf23-ff6f-4eea-8578-d20bc4890a51
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC023 AI chat follow-up question and refined advice after additional details
- **Test Code:** [TC023_AI_chat_follow_up_question_and_refined_advice_after_additional_details.py](./TC023_AI_chat_follow_up_question_and_refined_advice_after_additional_details.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Login page did not load: page contains 0 interactive elements and SPA content failed to render
- Sign In button not found or not interactable after filling credentials
- AI Chat flow could not be tested because the application did not reach an authenticated state
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/059b19e6-342d-4ed9-b1e8-9c5331844c7e/b1e1af28-4b57-49c3-bcb3-f77bfd3e6d80
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC029 Update personal information successfully from Profile page
- **Test Code:** [TC029_Update_personal_information_successfully_from_Profile_page.py](./TC029_Update_personal_information_successfully_from_Profile_page.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Save button could not be clicked on the profile page (element not interactable/stale) after multiple attempts.
- After attempting to save, the profile page rendered blank with 0 interactive elements, preventing further interaction or verification.
- No 'Profile updated' confirmation message was observed on the page.
- Multiple attempts to click Save and to re-render the page failed, indicating the feature cannot be reliably tested in this state.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/059b19e6-342d-4ed9-b1e8-9c5331844c7e/6d195f79-b34b-4402-9d07-22f176fe0c42
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC030 Show validation errors when contact fields have invalid values
- **Test Code:** [TC030_Show_validation_errors_when_contact_fields_have_invalid_values.py](./TC030_Show_validation_errors_when_contact_fields_have_invalid_values.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/059b19e6-342d-4ed9-b1e8-9c5331844c7e/dd8ed1cc-f118-4070-ab22-19c426941e04
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **33.33** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---