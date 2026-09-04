# TMV SMS campaign resubmission

Apply the guarded recovery installer first. Existing assignments and checklist selection behavior remain intact. The installer accepts the reviewed R2 or R3 source states, plus already-current files, while refusing unrecognized edits.

## Public review URLs

- https://tmvapp.local-journal.com/privacy.html
- https://tmvapp.local-journal.com/terms.html
- https://tmvapp.local-journal.com/sms-consent.html

Verify all three while signed out, preferably on a phone using cellular data. They must show the full content without an authentication prompt or challenge. The local installer health check does not test the public Cloudflare path. Earlier assistant-origin public requests returned 403; this does not prove Twilio receives 403. If that persists, examine the actual Cloudflare event before making targeted changes; do not disable protection for the whole app.

## Proposed campaign fields — use only after deployment and verification

Confirm that the registered A2P Brand identifies the same CUDD Energy Services sender shown on the website. Do not submit under a different business identity without correcting the mismatch.

Use case: operational account/work-order alerts (confirm the equivalent available use case in the registered Brand's Console).

Description:
CUDD Energy Services uses the TMV Preventive Maintenance application to send operational SMS alerts to field technicians and contracted service personnel who voluntarily opt in. Messages concern maintenance dispatch, work-order assignments, and completion requests, and may include a link to the assigned work order at tmvapp.local-journal.com. Message frequency varies with assigned work. This campaign does not send marketing messages.

Message flow:
Technicians visit https://tmvapp.local-journal.com/sms-consent.html from the application's SMS Preferences link. They enter their own name and US mobile number, read the SMS disclosure, actively check the separate initially unchecked consent checkbox, and click Subscribe to SMS Alerts. Name and number must match the technician roster. The disclosure identifies CUDD Energy Services, explains work-order alerts, variable frequency, message/data charges, STOP and HELP instructions, and support at jguynes@rpc.net. Privacy Policy and Terms links are adjacent to the consent control. Consent is optional and is not a condition of purchase, employment, or use of the app. The server stores the submitted name/number, timestamp, disclosure/version, source page and choice. Roster inclusion or an assignment does not enroll anyone. Initial enrollment is website-based, not keyword-based. Users may withdraw through SMS Preferences or reply STOP once messaging is active. Privacy: https://tmvapp.local-journal.com/privacy.html. Terms: https://tmvapp.local-journal.com/terms.html.

Sample messages (examples only; do not send during setup):
1. CUDD Energy Services TMV PM: You have a new maintenance work order for TMV57454B. View your assignment: https://tmvapp.local-journal.com/tech/EXAMPLE_ID. Reply STOP to unsubscribe or HELP for help.
2. CUDD Energy Services TMV PM: Please review the selected maintenance sections for your assigned TMV in the PM app. Reply STOP to unsubscribe or HELP for help.

Embedded links: Yes. No initial opt-in keyword is advertised. Do not invent a text-to-join flow.

## Twilio settings still requiring verification

In the linked Messaging Service, verify the actual STOP and HELP keywords and responses. Configure HELP to identify CUDD Energy Services TMV PM and give jguynes@rpc.net. Verify STOP blocks subsequent messages and returns the opt-out confirmation. A website re-enrollment cannot remove Twilio's STOP block: support must explain the provider's actual re-enrollment procedure. Do not advertise START/SUBSCRIBE behavior until it is verified.

Suggested HELP response to configure:
CUDD Energy Services TMV PM: For help, email jguynes@rpc.net. Message frequency varies. Message and data rates may apply. Reply STOP to cancel.

Suggested STOP response to configure:
CUDD Energy Services TMV PM: You have been unsubscribed and will receive no further alerts. For help, email jguynes@rpc.net.

These suggested provider responses have NOT been applied to the Twilio account. No campaign fields have been submitted by this update.

## Sending gate and consent records

`POST /api/sms` now refuses sends unless `TMV_SMS_APPROVED=1`, `SMS_PROVIDER=twilio`, `TWILIO_MESSAGING_SERVICE_SID` is configured, and the recipient's latest recorded consent event is a subscription. Keep the approval flag unset until campaign approval and provider keyword handling are verified. Do not set it just to bypass the gate. Existing Twilio credentials stay outside Git.

The public form records self-attested consent for a matching roster name/number; it does not send an OTP or independently verify ownership of the handset. The checkbox explicitly asks the submitter to confirm they are the authorized user. No one is automatically enrolled. No confirmation SMS or email is sent by form submission. The form confirms on screen instead.

SQLite adds `sms_consent_events` with append-only application writes (name, normalized phone, timestamp, choice, disclosure/version and source). The existing source/database backup includes these records. No existing consent is assumed or fabricated, and no records are deleted by this update. Unsubscribe works without checking the opt-in box.

The gate applies to server-sent SMS. Existing native phone SMS/mailto links open the user's own messaging application and are not automatically sent or controlled by this gate.

References checked September 4, 2026:
- https://www.twilio.com/docs/api/errors/30908
- https://www.twilio.com/docs/api/errors/30925
