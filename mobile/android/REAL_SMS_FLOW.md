# SentinelAI Stage 3 — Real SMS Flow

1. Start FastAPI on the laptop with `--host 0.0.0.0`.
2. Put phone and laptop on the same Wi-Fi.
3. Enter the laptop IP in SentinelAI Mobile.
4. Connect/register the device.
5. Grant `RECEIVE_SMS` permission.
6. Enable automatic SMS detection.
7. Send a harmless SMS from another phone.
8. Android invokes `SmsReceiver` automatically.
9. `SmsReceiver` extracts sender/text and an optional URL.
10. It POSTs the event to `/mobile/events`.
11. FastAPI runs the existing message AI + policy + audit flow.
12. Android shows the returned category/action/severity/risk in a notification.
