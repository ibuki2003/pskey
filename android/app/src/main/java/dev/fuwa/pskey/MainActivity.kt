package dev.fuwa.pskey

import android.content.Intent
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.bridge.Arguments
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.zoontek.rnbootsplash.RNBootSplash

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String {
    return "pskey"
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    RNBootSplash.init(this, R.style.BootTheme)
    super.onCreate(savedInstanceState)
  }

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return MainActivityDelegate(this, mainComponentName)
  }

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  // override fun createReactActivityDelegate(): ReactActivityDelegate =
  //     DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  class MainActivityDelegate(private val activity: ReactActivity, mainComponentName: String) :
    ReactActivityDelegate(activity, mainComponentName) {

    private var mInitialProps: Bundle? = null

    companion object {
      // extract only string values from bundle
      private fun filterBundle(extras: Bundle): Bundle {
        val out = Bundle()
        for (key in extras.keySet()) {
          extras.getString(key)?.let { out.putString(key, it) }
        }
        return out
      }
    }

    private fun sendEvent(extras: Bundle?) {
      val map = Arguments.createMap()

      extras?.let { map.putMap("extras", Arguments.fromBundle(it)) }

      try {
        reactHost?.currentReactContext
          ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
          ?.emit("onIntent", map)
      } catch (_: Exception) {
      }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
      val extras = activity.intent.extras?.let { filterBundle(it) }
      mInitialProps = extras?.let { Bundle().apply { putBundle("initial_extras", it) } }
      super.onCreate(savedInstanceState)
      sendEvent(extras)

      // clear intent extras to prevent re-sending the same data
      activity.intent.replaceExtras(Bundle())
    }

    override fun onNewIntent(intent: Intent?): Boolean {
      val extras = intent?.extras?.let { filterBundle(it) }
      mInitialProps = extras?.let { Bundle().apply { putBundle("initial_extras", it) } }
      val ret = super.onNewIntent(intent)
      sendEvent(extras)

      // clear intent extras to prevent re-sending the same data
      activity.intent.replaceExtras(Bundle())
      intent?.replaceExtras(Bundle())
      return ret
    }

    override fun getLaunchOptions(): Bundle? = mInitialProps

    override fun isFabricEnabled(): Boolean = fabricEnabled
  }
}
