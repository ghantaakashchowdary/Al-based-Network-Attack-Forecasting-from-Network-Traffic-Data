# SentinelAI Android — Stage 2 + Stage 3 Real-Time SMS

This Android module connects a physical Android phone to the SentinelAI FastAPI server running on the laptop.

## What is implemented

### Stage 2 — manual gateway
```text
Android test message
        ↓
POST /mobile/events
        ↓
FastAPI laptop
        ↓
Message AI → URL evidence → context/policy → audit
        ↓
Security result on Android
```

### Stage 3 — automatic real SMS gateway
```text
📩 Real SMS arrives on phone
        ↓
Android SMS_RECEIVED
        ↓
SentinelAI SmsReceiver
        ↓
POST /mobile/events
        ↓
FastAPI laptop
        ↓
Message AI + policy + audit
        ↓
📱 Android security notification
```

The phone does **not** need to send the SMS manually to the API. Once SMS permission is granted and the gateway is enabled, Android delivers eligible incoming SMS broadcasts to `SmsReceiver`, which forwards the message automatically.

## Exact setup

### 1. Start the laptop API
From the folder that contains `api.py`:

```powershell
python -m uvicorn api:app --host 0.0.0.0 --port 8000
```

### 2. Find laptop Wi-Fi IP

```powershell
ipconfig
```

Use the Wi-Fi IPv4 address, for example:

```text
192.168.28.165
```

### 3. Connect the phone

Phone and laptop must be on the same Wi-Fi.

In the Android SentinelAI app enter:

```text
http://192.168.28.165:8000
```

Tap **CONNECT TO SENTINELAI**.

### 4. Enable automatic SMS detection

Tap:

```text
ENABLE AUTOMATIC SMS DETECTION
```

Android will ask for SMS permission. Tap **Allow**.

On Android 13+ the app may also ask for notification permission. Allow it so the AI decision can appear as a notification.

The app should then show:

```text
REAL-TIME SMS DETECTION: ON
```

### 5. Test with a harmless SMS

Use another phone to send a normal SMS to the connected test phone.

Safe example:

```text
Hi Madhav, the project meeting is at 3 PM today. See you there.
```

The flow is automatic:

```text
Other phone
   ↓ SMS
Your Android phone
   ↓ automatically detected by Android
SmsReceiver
   ↓ HTTP
192.168.28.165:8000/mobile/events
   ↓
SentinelAI AI
   ↓
Policy
   ↓
Android notification
```

For a controlled security test, use harmless synthetic text such as:

```text
URGENT: Your account is suspended. Verify your password immediately.
```

Do not use real malicious links or conduct real phishing.

## Important Android limitation

This module is designed for a controlled physical-device demonstration using SMS. Android platform permissions, device configuration, default-SMS-app rules, and app-store policies can restrict SMS capabilities. This project does not claim universal interception/blocking of WhatsApp, Telegram, email, or every messaging application.

The current Stage 3 action is **detect → send to AI → policy decision → notify**. A policy result such as `BLOCK` is a SentinelAI security decision recorded by the server; this Android module does not silently delete or suppress the SMS.

## Stage 2 still works

The built-in safe/controlled test buttons remain available and call `/mobile/events` directly.
