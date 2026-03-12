
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** Kushi hygieia
- **Date:** 2026-03-12
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 Search doctors by specialization returns matching results
- **Test Code:** [TC001_Search_doctors_by_specialization_returns_matching_results.py](./TC001_Search_doctors_by_specialization_returns_matching_results.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d4ece350-1f06-4dc1-98a0-13ba48f66656/608cbbf8-0601-47bb-bd7a-8a696f158fbe
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 Search doctors by name and open doctor details (skipped: route not available)
- **Test Code:** [TC002_Search_doctors_by_name_and_open_doctor_details_skipped_route_not_available.py](./TC002_Search_doctors_by_name_and_open_doctor_details_skipped_route_not_available.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d4ece350-1f06-4dc1-98a0-13ba48f66656/3508b549-8de3-4b73-a88c-bb7e13ef71cf
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 Search with unknown term shows 'No results found' (skipped: route not available)
- **Test Code:** [TC003_Search_with_unknown_term_shows_No_results_found_skipped_route_not_available.py](./TC003_Search_with_unknown_term_shows_No_results_found_skipped_route_not_available.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Doctors route or doctor search page not listed or reachable from application root
- Root page contains 0 interactive elements; no login form or navigation links found
- Doctor login page (/login) could not be reached; no username/password inputs detected
- Doctor dashboard (/doctor-dashboard) not accessible via UI; no clickable path to it exists
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d4ece350-1f06-4dc1-98a0-13ba48f66656/5c33bd85-b510-440e-8ecf-61fec49e6923
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004 Attempt to reach Doctor Search from known navigation entry points
- **Test Code:** [TC004_Attempt_to_reach_Doctor_Search_from_known_navigation_entry_points.py](./TC004_Attempt_to_reach_Doctor_Search_from_known_navigation_entry_points.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d4ece350-1f06-4dc1-98a0-13ba48f66656/bc0c9de2-dc58-4777-87d7-dca2cfedacfc
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005 Doctor Search route direct navigation shows accessible page (skipped: route not listed)
- **Test Code:** [TC005_Doctor_Search_route_direct_navigation_shows_accessible_page_skipped_route_not_listed.py](./TC005_Doctor_Search_route_direct_navigation_shows_accessible_page_skipped_route_not_listed.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Login form not found on the application's root page; page contains 0 interactive elements and no visible input fields or buttons.
- Doctor UI routes (e.g., /doctor-dashboard or /doctors) are not reachable from the current app state or are missing from the application.
- Navigation to /login was not executed because the test plan prohibits navigating to routes not explicitly listed in shared_context.routes.
- The SPA did not render expected content at http://localhost:4173 (blank page), preventing further interaction or verification.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d4ece350-1f06-4dc1-98a0-13ba48f66656/ac4947fb-5cdf-468c-aa17-e71d2ab92f40
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006 Search hospitals by typing a valid location
- **Test Code:** [TC006_Search_hospitals_by_typing_a_valid_location.py](./TC006_Search_hospitals_by_typing_a_valid_location.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d4ece350-1f06-4dc1-98a0-13ba48f66656/c1a57701-cbce-4252-8d8d-bc7889b1fabb
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007 Open a hospital card to view hospital details
- **Test Code:** [TC007_Open_a_hospital_card_to_view_hospital_details.py](./TC007_Open_a_hospital_card_to_view_hospital_details.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d4ece350-1f06-4dc1-98a0-13ba48f66656/f825e594-0289-44ee-a82d-2b703474ce9d
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008 Hospital details view shows services section
- **Test Code:** [TC008_Hospital_details_view_shows_services_section.py](./TC008_Hospital_details_view_shows_services_section.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d4ece350-1f06-4dc1-98a0-13ba48f66656/0ea72c1c-ec82-4cc1-8739-880b9630ac2e
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009 Hospital details view shows contact information
- **Test Code:** [TC009_Hospital_details_view_shows_contact_information.py](./TC009_Hospital_details_view_shows_contact_information.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d4ece350-1f06-4dc1-98a0-13ba48f66656/51acfcfb-bb34-4b24-8f7a-7ca52caa55a5
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010 Invalid location search shows 'No hospitals found' message
- **Test Code:** [TC010_Invalid_location_search_shows_No_hospitals_found_message.py](./TC010_Invalid_location_search_shows_No_hospitals_found_message.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d4ece350-1f06-4dc1-98a0-13ba48f66656/870c867d-b533-4d52-a9be-01be9fc934de
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC011 Search with empty location prompts user or prevents search
- **Test Code:** [TC011_Search_with_empty_location_prompts_user_or_prevents_search.py](./TC011_Search_with_empty_location_prompts_user_or_prevents_search.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d4ece350-1f06-4dc1-98a0-13ba48f66656/5f462a45-4192-46ff-ae40-6fca775c2667
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC012 Book an appointment and see confirmation message
- **Test Code:** [TC012_Book_an_appointment_and_see_confirmation_message.py](./TC012_Book_an_appointment_and_see_confirmation_message.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Booking creation flow is not available on Doctor Dashboard: clicking '+ Add' opened a 'Post-Care Instructions' modal instead of an appointment creation dialog
- No 'Confirm Booking' button or 'Booking confirmed' text was found on the page
- No UI controls were found to select a doctor or timeslot and complete a booking from the Doctor Dashboard

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d4ece350-1f06-4dc1-98a0-13ba48f66656/8964f526-5f91-4855-9d09-48367d12103f
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC013 Booked appointment appears in booking details on dashboard
- **Test Code:** [TC013_Booked_appointment_appears_in_booking_details_on_dashboard.py](./TC013_Booked_appointment_appears_in_booking_details_on_dashboard.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d4ece350-1f06-4dc1-98a0-13ba48f66656/d508a57e-9213-4b5e-b4e9-b622072637cb
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC014 Attempt to book an unavailable timeslot shows 'Timeslot unavailable' error
- **Test Code:** [TC014_Attempt_to_book_an_unavailable_timeslot_shows_Timeslot_unavailable_error.py](./TC014_Attempt_to_book_an_unavailable_timeslot_shows_Timeslot_unavailable_error.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Unavailable timeslot not found on /doctor-dashboard after scrolling and searching for the text 'Unavailable' (no UI element labeled 'Unavailable' or equivalent present).
- No interactive timeslot element indicating a disabled/unavailable state was available to select, so selection of an unavailable timeslot could not be attempted.
- The 'Confirm Booking' action could not be performed because the required timeslot selection step failed (no unavailable timeslot to act on).
- Expected error message 'Timeslot unavailable' could not be verified because no booking attempt on an unavailable timeslot was possible.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d4ece350-1f06-4dc1-98a0-13ba48f66656/b5552c11-4b04-4d9f-990e-d301253fb565
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC015 Confirm Booking is blocked until a timeslot is selected
- **Test Code:** [TC015_Confirm_Booking_is_blocked_until_a_timeslot_is_selected.py](./TC015_Confirm_Booking_is_blocked_until_a_timeslot_is_selected.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Confirm Booking button not found on doctor dashboard
- 'Select a timeslot' prompt not present on doctor dashboard when attempting to confirm a booking
- No doctor-list or patient-booking flow accessible from the doctor dashboard to trigger booking confirmation
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d4ece350-1f06-4dc1-98a0-13ba48f66656/85188687-baa5-45ea-80ae-c9828b58255c
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC016 Switching doctors updates visible available timeslots
- **Test Code:** [TC016_Switching_doctors_updates_visible_available_timeslots.py](./TC016_Switching_doctors_updates_visible_available_timeslots.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Available timeslots section not found on /doctor-dashboard after selecting doctor 'Dr.Abhishek'.
- No alternative doctor entries found on the Doctor Dashboard to select and verify timeslot update.
- Search and scroll attempts to locate 'Available timeslots' (search, scroll, search) failed.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d4ece350-1f06-4dc1-98a0-13ba48f66656/d78574a2-0af3-4f64-b6cf-511f4135b816
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC017 Booking details display includes selected doctor and time
- **Test Code:** [TC017_Booking_details_display_includes_selected_doctor_and_time.py](./TC017_Booking_details_display_includes_selected_doctor_and_time.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Confirm Booking functionality not found on Doctor Dashboard (no 'Confirm Booking' button or booking creation flow detected).
- Doctor selection/timeslot booking UI not present on the doctor-side interface (no doctor list with selectable timeslots found).
- Booking details after confirmation could not be verified: 'Doctor' and 'Time' are not visible because no booking confirmation flow exists on the Doctor Dashboard.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d4ece350-1f06-4dc1-98a0-13ba48f66656/1d13325e-8a73-4d3e-a9cd-a471a5491e84
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC018 User can see appointment booking area on dashboard after login
- **Test Code:** [TC018_User_can_see_appointment_booking_area_on_dashboard_after_login.py](./TC018_User_can_see_appointment_booking_area_on_dashboard_after_login.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d4ece350-1f06-4dc1-98a0-13ba48f66656/292af374-f782-4626-811e-aef5ca74c86a
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC019 Emergency SOS: SOS button is visible and actionable on Emergency page
- **Test Code:** [TC019_Emergency_SOS_SOS_button_is_visible_and_actionable_on_Emergency_page.py](./TC019_Emergency_SOS_SOS_button_is_visible_and_actionable_on_Emergency_page.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d4ece350-1f06-4dc1-98a0-13ba48f66656/86826102-4dd8-440f-b635-9476f1cb3d5d
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC020 AI chat returns a response for a basic medical query
- **Test Code:** [TC020_AI_chat_returns_a_response_for_a_basic_medical_query.py](./TC020_AI_chat_returns_a_response_for_a_basic_medical_query.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d4ece350-1f06-4dc1-98a0-13ba48f66656/ba73511c-1c11-4091-a463-724d85f87c3b
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC021 AI chat supports a multi-turn conversation with clarification and refined advice
- **Test Code:** [TC021_AI_chat_supports_a_multi_turn_conversation_with_clarification_and_refined_advice.py](./TC021_AI_chat_supports_a_multi_turn_conversation_with_clarification_and_refined_advice.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- AI assistant did not produce a follow-up question after the user's message; assistant response shows 'Unable to fetch AI response: Server error: 404'.
- Retry and resend attempts were executed but no assistant reply appeared in the chat.
- No successful AI response was returned despite confirmed client-side message submission, preventing verification of the follow-up question and refined advice.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d4ece350-1f06-4dc1-98a0-13ba48f66656/2b277554-fe88-403c-b4ad-4320b3b7a63e
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC022 Send button behavior when message input is empty
- **Test Code:** [TC022_Send_button_behavior_when_message_input_is_empty.py](./TC022_Send_button_behavior_when_message_input_is_empty.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d4ece350-1f06-4dc1-98a0-13ba48f66656/6df93209-b350-47dc-b047-7e8756dafec6
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC023 Long query is accepted and an AI response is displayed
- **Test Code:** [TC023_Long_query_is_accepted_and_an_AI_response_is_displayed.py](./TC023_Long_query_is_accepted_and_an_AI_response_is_displayed.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- AI response not returned; chat shows error message 'Unable to fetch AI response: Server error: 404'.
- Retry attempt also failed and no AI response text is visible in the chat.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d4ece350-1f06-4dc1-98a0-13ba48f66656/071220ff-ab43-4dc6-b121-5d8837cdac96
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC024 Multiple sequential questions produce multiple AI responses in the same session
- **Test Code:** [TC024_Multiple_sequential_questions_produce_multiple_AI_responses_in_the_same_session.py](./TC024_Multiple_sequential_questions_produce_multiple_AI_responses_in_the_same_session.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Assistant did not produce any AI/assistant replies in the Community Chat panel after two user queries were sent.
- No assistant response corresponding to 'What is a normal adult blood pressure range?' is visible in the chat history.
- No assistant response corresponding to 'When should someone seek urgent care for high blood pressure symptoms?' is visible in the chat history.
- The chat UI shows the two user messages and send controls, indicating messages were sent but no backend/assistant response was returned.
- Waiting and observing the chat for multiple seconds did not reveal any assistant replies.

Attachments:

extracted_content_0.md:
<url>
http://localhost:4173/doctor-dashboard
</url>
<query>
Extract the visible chat messages from the Community Chat panel on the Doctor Dashboard. List messages in chronological order with speaker (e.g., 'Dr.Abhishek' or 'Assistant/AI') and the exact message text. Specifically indicate whether there is an assistant/AI reply corresponding to (1) 'What is a normal adult blood pressure range?' and (2) 'When should someone seek urgent care for high blood pressure symptoms?'.
</query>
<result>
Messages (chronological order):

1. Uday Kiran Reddy Seelam (06:04 am) — Hi
2. Abhishek Edla (02:44 pm) — Is it safe to take paracetamol for a mild fever?
3. Abhishek Edla (02:44 pm) — How much water should an adult drink daily?
4. Dr.Dr.Abhishek (03:51 pm) — What is a normal adult blood pressure range?
5. Dr.Dr.Abhishek (03:52 pm) — When should someone seek urgent care for high blood pressure symptoms?
6. Abhi (03:58 pm) — fine
7. Abhi (04:15 pm) — HI
8. Abhi (04:15 pm) — HI
9. Abhi (04:40 pm) — hi
10. Abhi (04:40 pm) — hello
11. Abhi (04:45 pm) — ahahah
12. Dr.Dr.Abhishek (04:46 pm) — Hi
13. Abhi (04:51 pm) — bye
14. Dr.Dr.Abhishek (05:38 pm) — Ok
15. Dr.Dr.Abhishek (05:38 pm) — How are you

Assistant/AI reply status:
- For "What is a normal adult blood pressure range?": No assistant/AI reply is visible in the Community Chat panel.
- For "When should someone seek urgent care for high blood pressure symptoms?": No assistant/AI reply is visible in the Community Chat panel.
</result>
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d4ece350-1f06-4dc1-98a0-13ba48f66656/20a7c7f0-0076-49ea-8048-4b3298d27848
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC025 Update personal information successfully from Profile page
- **Test Code:** [TC025_Update_personal_information_successfully_from_Profile_page.py](./TC025_Update_personal_information_successfully_from_Profile_page.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d4ece350-1f06-4dc1-98a0-13ba48f66656/a5501eba-3dc6-4bdc-961b-1ae8dc6abad9
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC026 Show validation errors when saving invalid contact information
- **Test Code:** [TC026_Show_validation_errors_when_saving_invalid_contact_information.py](./TC026_Show_validation_errors_when_saving_invalid_contact_information.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d4ece350-1f06-4dc1-98a0-13ba48f66656/4472bd47-08f8-44eb-94e7-c7b5444d2945
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC027 Cancel editing does not persist changes on Profile page
- **Test Code:** [TC027_Cancel_editing_does_not_persist_changes_on_Profile_page.py](./TC027_Cancel_editing_does_not_persist_changes_on_Profile_page.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d4ece350-1f06-4dc1-98a0-13ba48f66656/96ed0586-11fe-42e1-91c9-9b2e59a397c8
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC028 Profile page loads and displays key sections for a logged-in user
- **Test Code:** [TC028_Profile_page_loads_and_displays_key_sections_for_a_logged_in_user.py](./TC028_Profile_page_loads_and_displays_key_sections_for_a_logged_in_user.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d4ece350-1f06-4dc1-98a0-13ba48f66656/af1f5bc1-0568-4a52-991d-60c018fcb63c
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC029 Save button remains unavailable until changes are made (if supported)
- **Test Code:** [TC029_Save_button_remains_unavailable_until_changes_are_made_if_supported.py](./TC029_Save_button_remains_unavailable_until_changes_are_made_if_supported.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Save button allowed submission when no profile fields were changed: 'Saving...' indicator displayed after clicking 'Save Profile'.
- No disabled state was observed for the Save button prior to clicking; Save was actionable without edits.
- No validation or user-facing message was displayed indicating there were no changes to save after attempting to save.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d4ece350-1f06-4dc1-98a0-13ba48f66656/b69209df-18bb-4f5f-bd5b-b0c329208081
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **62.07** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---