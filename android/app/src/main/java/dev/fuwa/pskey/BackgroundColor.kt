package dev.fuwa.pskey

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import android.view.WindowManager
import androidx.core.view.WindowInsetsControllerCompat

class BackgroundColor(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {
  override fun getName() = "BackgroundColor"

  @ReactMethod
  fun setBackgroundColor(color: Int, light: Boolean, promise: Promise) {
    val context = reactApplicationContext
    val activity = context.currentActivity
    activity?.runOnUiThread {
      try {
        val window = activity.window

        // window.navigationBarColor = color
        // window.statusBarColor = color
        window.clearFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS)
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS)

        val controller = WindowInsetsControllerCompat(window, window.decorView)
        controller.isAppearanceLightStatusBars = light
        controller.isAppearanceLightNavigationBars = light

        promise.resolve(true)
      } catch (e: Exception) {
        promise.reject(e)
      }
    }
  }
}
