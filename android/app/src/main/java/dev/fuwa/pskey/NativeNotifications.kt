package dev.fuwa.pskey

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.pm.PackageManager
import android.content.Intent
import android.graphics.drawable.BitmapDrawable
import android.os.Build
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.graphics.drawable.IconCompat
import coil.Coil
import coil.request.ImageRequest
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap

class NativeNotifications(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {
  companion object {
    const val CHANNEL_ID = "default"
    const val NOTIFY_TAG = "pskey.fuwa.dev"
  }

  override fun getName(): String = "NativeNotifications"

  @ReactMethod
  fun makeNotification(notification: ReadableMap, promise: Promise) {
    if (
      Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
      ActivityCompat.checkSelfPermission(
        this.reactApplicationContext,
        Manifest.permission.POST_NOTIFICATIONS
      ) != PackageManager.PERMISSION_GRANTED
    ) {
      promise.reject("ERR_PERMISSION", "Permission denied")
      return
    }

    if (
      !notification.hasKey("id") ||
      !notification.hasKey("title") ||
      !notification.hasKey("body") ||
      !notification.hasKey("group")
    ) {
      promise.reject("ERR_INVALID", "Invalid notification")
      return
    }

    // first, create a channel
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      NotificationManagerCompat.from(this.reactApplicationContext).createNotificationChannel(
        NotificationChannel(CHANNEL_ID, "default", NotificationManager.IMPORTANCE_DEFAULT)
      )
    }

    val id = notification.getString("id")!!.hashCode()
    val parentId = notification.getString("group")!!.hashCode()

    val parentBuilder = NotificationCompat.Builder(this.reactApplicationContext, CHANNEL_ID)
      .setSmallIcon(R.drawable.notification_icon)
      .setGroup(notification.getString("group"))
      .setGroupSummary(true)
      .setSubText(notification.getString("group"))
      .setGroupAlertBehavior(NotificationCompat.GROUP_ALERT_CHILDREN)

    val builder = NotificationCompat.Builder(this.reactApplicationContext, CHANNEL_ID)
      .setSmallIcon(R.drawable.notification_icon)
      .setContentTitle(notification.getString("title"))
      .setSubText(notification.getString("subtitle"))
      .setContentText(notification.getString("body"))
      .setPriority(NotificationManagerCompat.IMPORTANCE_DEFAULT)
      .setGroup(notification.getString("group"))
      .setWhen(notification.getString("when")?.toLong() ?: System.currentTimeMillis())
      .setShowWhen(true)
      .setOnlyAlertOnce(true)
      .setContentIntent(notification.getString("server_domain")?.let { domain ->
        PendingIntent.getActivity(
          this.reactApplicationContext,
          0,
          Intent(this.reactApplicationContext, MainActivity::class.java).also { intent ->
            intent.flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
            intent.putExtra("type", "NOTIFICATION_TAP")
            intent.putExtra("server_domain", domain)
          },
          PendingIntent.FLAG_IMMUTABLE
        )
      })

    val manager = NotificationManagerCompat.from(this.reactApplicationContext)
    manager.notify(NOTIFY_TAG, parentId, parentBuilder.build())
    manager.notify(NOTIFY_TAG, id, builder.build())

    builder.setSmallIcon(R.drawable.notification_icon)

      // small icon
      if (notification.hasKey("badgeUrl")) {
        ImageRequest.Builder(this.reactApplicationContext)
          .data(notification.getString("badgeUrl"))
          .target { drawable ->
            val bm = (drawable as BitmapDrawable).bitmap
            builder.setSmallIcon(IconCompat.createWithBitmap(bm))
            manager.notify(NOTIFY_TAG, id, builder.build())
          }
          .build()
          .let { Coil.imageLoader(this.reactApplicationContext).enqueue(it) }

      // large icon
      if (notification.hasKey("iconUrl")) {
        ImageRequest.Builder(this.reactApplicationContext)
          .data(notification.getString("iconUrl"))
          .target { drawable ->
            val bm = (drawable as BitmapDrawable).bitmap
            builder.setLargeIcon(bm)
            manager.notify(NOTIFY_TAG, id, builder.build())
          }
          .build()
          .let { Coil.imageLoader(this.reactApplicationContext).enqueue(it) }
      }
    }

    promise.resolve(null)
  }
}
