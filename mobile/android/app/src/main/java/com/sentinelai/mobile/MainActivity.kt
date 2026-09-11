package com.sentinelai.mobile

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.ViewGroup
import android.widget.*
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID
import kotlin.concurrent.thread

/**
 * SentinelAI Android gateway.
 *
 * Stage 2: manual test message -> laptop API -> AI/policy -> result.
 * Stage 3: real incoming SMS -> SmsReceiver -> laptop API -> AI/policy -> notification.
 */
class MainActivity : Activity() {

    private lateinit var apiUrl: EditText
    private lateinit var senderInput: EditText
    private lateinit var messageInput: EditText
    private lateinit var urlInput: EditText
    private lateinit var status: TextView
    private lateinit var smsStatus: TextView
    private lateinit var deviceIdView: TextView
    private lateinit var resultView: TextView
    private lateinit var connectButton: Button
    private lateinit var smsButton: Button

    private lateinit var deviceId: String
    private val mainHandler = Handler(Looper.getMainLooper())
    private var heartbeatStarted = false

    private val heartbeatRunnable = object : Runnable {
        override fun run() {
            if (heartbeatStarted) {
                sendHeartbeat()
                mainHandler.postDelayed(this, 30_000L)
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val prefs = getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        deviceId = prefs.getString("device_id", null)
            ?: UUID.randomUUID().toString().also {
                prefs.edit().putString("device_id", it).apply()
            }

        buildUi(prefs)
    }

    override fun onResume() {
        super.onResume()
        if (::smsStatus.isInitialized) updateSmsStatus()
    }

    private fun buildUi(prefs: android.content.SharedPreferences) {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(20), dp(20), dp(20), dp(28))
            setBackgroundColor(Color.rgb(248, 250, 252))
        }

        val scroll = ScrollView(this).apply { addView(root) }

        val title = TextView(this).apply {
            text = "🛡 SentinelAI Mobile"
            textSize = 26f
            setTextColor(Color.rgb(15, 23, 42))
        }

        val subtitle = TextView(this).apply {
            text = "Stage 2 + Stage 3 • Real-time SMS Security"
            textSize = 14f
            setTextColor(Color.rgb(71, 85, 105))
            setPadding(0, dp(4), 0, dp(18))
        }

        status = TextView(this).apply {
            text = "● NOT CONNECTED"
            textSize = 15f
            setTextColor(Color.rgb(180, 83, 9))
            setPadding(dp(12), dp(12), dp(12), dp(12))
            setBackgroundColor(Color.rgb(255, 247, 237))
        }

        apiUrl = EditText(this).apply {
            hint = "http://192.168.28.165:8000"
            setSingleLine(true)
            setText(prefs.getString("api_url", "http://10.0.2.2:8000"))
        }

        connectButton = Button(this).apply { text = "CONNECT TO SENTINELAI" }

        deviceIdView = TextView(this).apply {
            text = "Device ID: $deviceId"
            textSize = 11f
            setTextColor(Color.rgb(100, 116, 139))
            setPadding(0, dp(6), 0, dp(14))
        }

        val connectionSection = section(
            "1. Laptop connection",
            "Phone and laptop must be on the same Wi-Fi. Use the laptop LAN IP, not localhost."
        )

        val smsSection = section(
            "2. REAL SMS protection",
            "After connecting, enable SMS access. Then every incoming SMS received by Android can be forwarded automatically to SentinelAI."
        )

        smsStatus = TextView(this).apply {
            textSize = 14f
            setPadding(dp(12), dp(12), dp(12), dp(12))
        }

        smsButton = Button(this).apply { text = "ENABLE AUTOMATIC SMS DETECTION" }

        val messageSection = section(
            "3. Stage 2 test message",
            "Use this only to verify the API path before testing real SMS."
        )

        senderInput = EditText(this).apply {
            hint = "Sender (example: Security-Test)"
            setSingleLine(true)
            setText("Security-Test")
        }

        messageInput = EditText(this).apply {
            hint = "Enter a safe or controlled test message"
            minLines = 4
            gravity = android.view.Gravity.TOP
            setText("URGENT: Your account is suspended. Verify your password immediately.")
        }

        urlInput = EditText(this).apply {
            hint = "Optional URL (use example/test domains only)"
            setSingleLine(true)
        }

        val safeButton = Button(this).apply { text = "LOAD SAFE TEST" }
        val phishingButton = Button(this).apply { text = "LOAD CONTROLLED PHISHING TEST" }
        val analyzeButton = Button(this).apply { text = "SEND TO SENTINELAI & ANALYZE" }

        resultView = TextView(this).apply {
            text = "No security result yet.\n\nConnect the phone and enable automatic SMS detection."
            textSize = 15f
            setTextColor(Color.rgb(30, 41, 59))
            setPadding(dp(14), dp(14), dp(14), dp(14))
            setBackgroundColor(Color.WHITE)
        }

        val resultSection = section(
            "4. AI security result",
            "Real SMS results are shown as Android notifications. Stage 2 test results are shown below."
        )

        root.addView(title)
        root.addView(subtitle)
        root.addView(status, matchParams())
        root.addView(connectionSection)
        root.addView(apiUrl, matchParams())
        root.addView(connectButton, matchParams())
        root.addView(deviceIdView)
        root.addView(smsSection)
        root.addView(smsStatus, matchParams())
        root.addView(smsButton, matchParams())
        root.addView(messageSection)
        root.addView(senderInput, matchParams())
        root.addView(messageInput, matchParams())
        root.addView(urlInput, matchParams())
        root.addView(safeButton, matchParams())
        root.addView(phishingButton, matchParams())
        root.addView(analyzeButton, matchParams())
        root.addView(resultSection)
        root.addView(resultView, matchParams())

        setContentView(scroll)

        connectButton.setOnClickListener { connectAndRegister() }
        smsButton.setOnClickListener { enableAutomaticSmsDetection() }

        safeButton.setOnClickListener {
            senderInput.setText("Demo-Contact")
            messageInput.setText("Hi team, the project review is moved to 3 PM today. See you there.")
            urlInput.setText("")
        }

        phishingButton.setOnClickListener {
            senderInput.setText("Security-Test")
            messageInput.setText("URGENT: Your account is suspended. Verify your password immediately.")
            urlInput.setText("http://192.0.2.10/verify")
        }

        analyzeButton.setOnClickListener { sendCurrentMessage() }
        updateSmsStatus()
    }

    private fun connectAndRegister() {
        val base = baseUrl()
        if (!isValidHttpUrl(base)) {
            setStatus("● INVALID SERVER URL", false)
            return
        }

        saveBaseUrl(base)
        connectButton.isEnabled = false
        setStatus("● CONNECTING...", null)

        thread {
            try {
                val health = get("$base/health")
                if (health.code !in 200..299) {
                    throw Exception("Health check failed (${health.code})")
                }

                val payload = JSONObject()
                    .put("device_id", deviceId)
                    .put("name", "${Build.MANUFACTURER} ${Build.MODEL}")
                    .put("model", Build.MODEL)
                    .put("os_version", Build.VERSION.RELEASE)

                val registered = post("$base/mobile/devices/register", payload)
                if (registered.code !in 200..299) {
                    throw Exception("Device registration failed (${registered.code}): ${registered.body}")
                }

                val response = JSONObject(registered.body)
                deviceId = response.optString("device_id", deviceId)
                getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                    .edit()
                    .putString("device_id", deviceId)
                    .apply()

                mainHandler.post {
                    setStatus("● CONNECTED TO SENTINELAI", true)
                    deviceIdView.text = "Device ID: $deviceId"
                    connectButton.isEnabled = true
                    heartbeatStarted = true
                    mainHandler.removeCallbacks(heartbeatRunnable)
                    mainHandler.postDelayed(heartbeatRunnable, 30_000L)
                    resultView.text = "Connected successfully.\n\nNow enable AUTOMATIC SMS DETECTION."
                    updateSmsStatus()
                }
            } catch (e: Exception) {
                mainHandler.post {
                    setStatus("● CONNECTION FAILED", false)
                    connectButton.isEnabled = true
                    resultView.text = "Connection error:\n${e.message ?: "Unknown error"}"
                }
            }
        }
    }

    private fun enableAutomaticSmsDetection() {
        val base = baseUrl()
        if (!isValidHttpUrl(base)) {
            Toast.makeText(this, "Connect to the laptop server first.", Toast.LENGTH_LONG).show()
            return
        }
        saveBaseUrl(base)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M &&
            checkSelfPermission(Manifest.permission.RECEIVE_SMS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(arrayOf(Manifest.permission.RECEIVE_SMS), REQUEST_SMS_PERMISSION)
            return
        }

        markSmsEnabled()
        requestNotificationPermissionIfNeeded()
        updateSmsStatus()
        Toast.makeText(this, "Automatic SMS detection is enabled.", Toast.LENGTH_LONG).show()
    }

    private fun markSmsEnabled() {
        getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putBoolean("sms_protection_enabled", true)
            .apply()
    }

    private fun requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), REQUEST_NOTIFICATION_PERMISSION)
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        when (requestCode) {
            REQUEST_SMS_PERMISSION -> {
                if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    markSmsEnabled()
                    requestNotificationPermissionIfNeeded()
                    updateSmsStatus()
                    Toast.makeText(this, "SMS permission granted. Real-time detection is ON.", Toast.LENGTH_LONG).show()
                } else {
                    updateSmsStatus()
                    Toast.makeText(this, "SMS permission was denied. Automatic detection cannot run.", Toast.LENGTH_LONG).show()
                }
            }
            REQUEST_NOTIFICATION_PERMISSION -> updateSmsStatus()
        }
    }

    private fun updateSmsStatus() {
        if (!::smsStatus.isInitialized) return
        val smsGranted = Build.VERSION.SDK_INT < Build.VERSION_CODES.M ||
            checkSelfPermission(Manifest.permission.RECEIVE_SMS) == PackageManager.PERMISSION_GRANTED
        val enabled = getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getBoolean("sms_protection_enabled", false)

        if (smsGranted && enabled) {
            smsStatus.text = "● REAL-TIME SMS DETECTION: ON\nIncoming SMS → Android → SentinelAI AI → security notification"
            smsStatus.setTextColor(Color.rgb(22, 101, 52))
            smsStatus.setBackgroundColor(Color.rgb(240, 253, 244))
            smsButton.text = "REAL-TIME SMS DETECTION ENABLED"
        } else if (!smsGranted) {
            smsStatus.text = "● SMS ACCESS: NOT GRANTED\nTap the button below to allow Android to deliver incoming SMS events to SentinelAI."
            smsStatus.setTextColor(Color.rgb(180, 83, 9))
            smsStatus.setBackgroundColor(Color.rgb(255, 247, 237))
            smsButton.text = "ENABLE AUTOMATIC SMS DETECTION"
        } else {
            smsStatus.text = "● SMS ACCESS READY\nEnable automatic detection to start the real-time gateway."
            smsStatus.setTextColor(Color.rgb(30, 64, 175))
            smsStatus.setBackgroundColor(Color.rgb(239, 246, 255))
            smsButton.text = "ENABLE AUTOMATIC SMS DETECTION"
        }
    }

    private fun sendCurrentMessage() {
        val text = messageInput.text.toString().trim()
        val sender = senderInput.text.toString().trim().ifBlank { "Android-User" }
        val url = urlInput.text.toString().trim()

        if (text.isBlank()) {
            Toast.makeText(this, "Enter a message first.", Toast.LENGTH_SHORT).show()
            return
        }

        val base = baseUrl()
        if (!isValidHttpUrl(base)) {
            Toast.makeText(this, "Connect to the laptop server first.", Toast.LENGTH_LONG).show()
            return
        }
        saveBaseUrl(base)
        resultView.text = "Sending message to SentinelAI...\n\nPOST $base/mobile/events"

        thread {
            try {
                val payload = JSONObject()
                    .put("device_id", deviceId)
                    .put("source", "android-stage2")
                    .put("text", text)
                    .put("sender", sender)
                    .put("url", if (url.isNotBlank()) url else JSONObject.NULL)

                val response = post("$base/mobile/events", payload)
                mainHandler.post {
                    if (response.code in 200..299) showSecurityResult(response.body)
                    else resultView.text = "SentinelAI rejected the event.\n\nHTTP ${response.code}\n${response.body}"
                }
            } catch (e: Exception) {
                mainHandler.post { resultView.text = "Event failed:\n${e.message ?: "Unable to reach server"}" }
            }
        }
    }

    private fun showSecurityResult(body: String) {
        try {
            val root = JSONObject(body)
            val message = root.optJSONObject("message") ?: JSONObject()
            val decision = root.optJSONObject("decision") ?: JSONObject()
            val category = message.optString("category", "UNKNOWN")
            val confidence = percent(message.optDouble("confidence", 0.0))
            val messageRisk = percent(decision.optDouble("message_risk", message.optDouble("threat_probability", 0.0)))
            val networkRisk = percent(decision.optDouble("network_risk", 0.0))
            val composite = percent(decision.optDouble("composite_risk", 0.0))
            val action = decision.optString("action", "UNKNOWN")
            val severity = decision.optString("severity", "UNKNOWN")
            val reason = decision.optString("reason", "No reason supplied")
            val eventId = root.optString("event_id", "-")
            val evidence = message.optJSONArray("evidence")
            val evidenceText = if (evidence != null && evidence.length() > 0) buildString {
                for (i in 0 until evidence.length()) append("• ").append(evidence.optString(i)).append("\n")
            }.trim() else "• No additional evidence returned"

            resultView.text = """
                SECURITY DECISION

                Action: $action
                Severity: $severity
                Category: $category

                Message risk: $messageRisk%
                Network risk: $networkRisk%
                Composite risk: $composite%
                AI confidence: $confidence%

                Evidence:
                $evidenceText

                Reason:
                $reason

                Event ID:
                $eventId
            """.trimIndent()

            resultView.setTextColor(if (action == "ALLOW") Color.rgb(22, 101, 52) else Color.rgb(153, 27, 27))
        } catch (_: Exception) {
            resultView.text = "Security result received, but could not parse it:\n\n$body"
        }
    }

    private fun sendHeartbeat() {
        val base = baseUrl()
        if (base.isBlank()) return
        thread {
            try { post("$base/mobile/devices/heartbeat", JSONObject().put("device_id", deviceId)) }
            catch (_: Exception) { }
        }
    }

    override fun onDestroy() {
        heartbeatStarted = false
        mainHandler.removeCallbacks(heartbeatRunnable)
        super.onDestroy()
    }

    private fun baseUrl(): String = apiUrl.text.toString().trim().trimEnd('/')

    private fun saveBaseUrl(base: String) {
        getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString("api_url", base).apply()
    }

    private fun setStatus(text: String, connected: Boolean?) {
        status.text = text
        when (connected) {
            true -> { status.setTextColor(Color.rgb(22, 101, 52)); status.setBackgroundColor(Color.rgb(240, 253, 244)) }
            false -> { status.setTextColor(Color.rgb(185, 28, 28)); status.setBackgroundColor(Color.rgb(254, 242, 242)) }
            null -> { status.setTextColor(Color.rgb(180, 83, 9)); status.setBackgroundColor(Color.rgb(255, 247, 237)) }
        }
    }

    private fun isValidHttpUrl(value: String): Boolean = value.startsWith("http://") || value.startsWith("https://")
    private fun percent(value: Double): Int = (value.coerceIn(0.0, 1.0) * 100.0).toInt()
    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()

    private fun matchParams(): LinearLayout.LayoutParams = LinearLayout.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.WRAP_CONTENT
    ).apply { setMargins(0, dp(6), 0, dp(6)) }

    private fun section(title: String, description: String): TextView = TextView(this).apply {
        text = "$title\n$description"
        textSize = 14f
        setTextColor(Color.rgb(30, 41, 59))
        setPadding(0, dp(16), 0, dp(6))
    }

    data class HttpResult(val code: Int, val body: String)

    companion object {
        const val PREFS = "sentinelai"
        private const val REQUEST_SMS_PERMISSION = 4101
        private const val REQUEST_NOTIFICATION_PERMISSION = 4102

        fun post(endpoint: String, json: JSONObject): HttpResult {
            val connection = (URL(endpoint).openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = 8_000
                readTimeout = 15_000
                doOutput = true
                setRequestProperty("Content-Type", "application/json")
                setRequestProperty("Accept", "application/json")
            }
            return try {
                connection.outputStream.use { it.write(json.toString().toByteArray(Charsets.UTF_8)) }
                HttpResult(connection.responseCode, readBody(connection))
            } finally { connection.disconnect() }
        }

        private fun get(endpoint: String): HttpResult {
            val connection = (URL(endpoint).openConnection() as HttpURLConnection).apply {
                requestMethod = "GET"
                connectTimeout = 8_000
                readTimeout = 10_000
                setRequestProperty("Accept", "application/json")
            }
            return try { HttpResult(connection.responseCode, readBody(connection)) }
            finally { connection.disconnect() }
        }

        private fun readBody(connection: HttpURLConnection): String {
            val stream = if (connection.responseCode in 200..299) connection.inputStream else connection.errorStream
            return stream?.bufferedReader(Charsets.UTF_8)?.use { it.readText() } ?: ""
        }
    }
}
