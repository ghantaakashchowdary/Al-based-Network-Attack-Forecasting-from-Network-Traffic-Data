package com.sentinelai.mobile

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Telephony
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

/** Stage 3: real-time SMS -> SentinelAI -> AI/policy -> Android notification. */
class SmsReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return
        val pending = goAsync()
        val appContext = context.applicationContext

        thread {
            try {
                val prefs = appContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                if (!prefs.getBoolean("sms_protection_enabled", false)) return@thread

                val api = prefs.getString("api_url", null)?.trimEnd('/')
                val deviceId = prefs.getString("device_id", null)
                if (api.isNullOrBlank() || deviceId.isNullOrBlank()) {
                    showNotification(appContext, "SentinelAI SMS", "SMS received, but SentinelAI is not connected.")
                    return@thread
                }

                val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
                if (messages.isEmpty()) return@thread

                val text = messages.joinToString(" ") { it.messageBody ?: "" }.trim()
                val sender = messages.firstOrNull()?.originatingAddress ?: "unknown"
                if (text.isBlank()) return@thread

                // Avoid duplicate processing from broadcast retries.
                val signature = "$sender|$text"
                if (prefs.getString("last_sms_signature", null) == signature) return@thread
                prefs.edit().putString("last_sms_signature", signature).apply()

                val url = Regex("https?://[^\\s]+", RegexOption.IGNORE_CASE).find(text)?.value
                val payload = JSONObject()
                    .put("device_id", deviceId)
                    .put("source", "android-sms")
                    .put("text", text)
                    .put("sender", sender)
                    .put("url", if (url.isNullOrBlank()) JSONObject.NULL else url)

                val response = post("$api/mobile/events", payload)
                if (response.code in 200..299) {
                    val root = JSONObject(response.body)
                    val message = root.optJSONObject("message") ?: JSONObject()
                    val decision = root.optJSONObject("decision") ?: JSONObject()
                    val category = message.optString("category", "UNKNOWN")
                    val action = decision.optString("action", "UNKNOWN")
                    val severity = decision.optString("severity", "UNKNOWN")
                    val composite = (decision.optDouble("composite_risk", 0.0) * 100).toInt()
                    val reason = decision.optString("reason", "No reason supplied")
                    val eventId = root.optString("event_id", "-")
                    val body = "Severity: $severity | Risk: $composite%\n$reason\nEvent: $eventId"

                    prefs.edit()
                        .putString("last_sms_result", body)
                        .putString("last_sms_category", category)
                        .putString("last_sms_action", action)
                        .apply()

                    showNotification(appContext, "SentinelAI • $action • $category", body)
                } else {
                    showNotification(appContext, "SentinelAI SMS analysis failed", "HTTP ${response.code}: ${response.body.take(180)}")
                }
            } catch (e: Exception) {
                showNotification(appContext, "SentinelAI SMS gateway error", e.message ?: "Unable to contact the AI server.")
            } finally {
                pending.finish()
            }
        }
    }

    private fun showNotification(context: Context, title: String, body: String) {
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            manager.createNotificationChannel(
                NotificationChannel(CHANNEL_ID, "SentinelAI Security", NotificationManager.IMPORTANCE_HIGH).apply {
                    description = "Real-time SentinelAI SMS security results"
                }
            )
        }

        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            context, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            android.app.Notification.Builder(context, CHANNEL_ID)
        } else {
            @Suppress("DEPRECATION") android.app.Notification.Builder(context)
        }

        builder.setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(android.app.Notification.BigTextStyle().bigText(body))
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setPriority(android.app.Notification.PRIORITY_HIGH)

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
            context.checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) {
            manager.notify((System.currentTimeMillis() % Int.MAX_VALUE).toInt(), builder.build())
        }
    }

    private data class HttpResult(val code: Int, val body: String)

    private fun post(endpoint: String, json: JSONObject): HttpResult {
        val connection = (URL(endpoint).openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            connectTimeout = 5_000
            readTimeout = 10_000
            doOutput = true
            setRequestProperty("Content-Type", "application/json")
            setRequestProperty("Accept", "application/json")
        }
        return try {
            connection.outputStream.use { it.write(json.toString().toByteArray(Charsets.UTF_8)) }
            val stream = if (connection.responseCode in 200..299) connection.inputStream else connection.errorStream
            val body = stream?.bufferedReader(Charsets.UTF_8)?.use { it.readText() } ?: ""
            HttpResult(connection.responseCode, body)
        } finally { connection.disconnect() }
    }

    companion object {
        private const val PREFS = "sentinelai"
        private const val CHANNEL_ID = "sentinelai_security"
    }
}
