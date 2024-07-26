package dev.fuwa.pskey

import android.os.Bundle
import android.app.Activity
import android.content.Intent
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.bridge.Arguments
import com.zoontek.rnbootsplash.RNBootSplash;

class MainActivity : ReactActivity() {
  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String? {
    return "pskey"
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    RNBootSplash.init(this, R.style.BootTheme)
    super.onCreate(savedInstanceState)
  }

  /**
   * Returns the instance of the [ReactActivityDelegate]. Here we use a util class [ ] which allows you to easily enable Fabric and Concurrent React
   * (aka React 18) with two boolean flags.
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return MainActivityDelegate(this, mainComponentName!!)
  }

  public class MainActivityDelegate(activity: ReactActivity, mainComponentName: String): ReactActivityDelegate(activity, mainComponentName) {
      private var mInitialProps: Bundle? = null;

      val activity = activity;

      private fun sendEvent(intent: Intent?) {
        var map = Arguments.createMap();

        val intent_extras = intent?.extras;
        if (intent_extras != null) {
          val extras = Arguments.createMap()
          for (key in intent_extras.keySet()) {
            intent_extras.getString(key)?.let { extras.putString(key, it) };
          }
          map.putMap("extras", extras);
        }

        try {
          getReactInstanceManager().currentReactContext
            ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            ?.emit("onIntent", map);
        } catch (e: Exception) {
        }
      }

      override protected fun onCreate(savedInstanceState: Bundle?) {
        mInitialProps = activity.intent.extras?.let { Bundle().apply { putBundle("initial_extras", it) } };
        super.onCreate(savedInstanceState);
        sendEvent(activity.getIntent());
        activity.intent.replaceExtras(Bundle());
      }

      override fun onNewIntent(intent: Intent?): Boolean {
        sendEvent(intent)
        val ret = super.onNewIntent(intent);
        mInitialProps = intent?.extras?.let { Bundle().apply { putBundle("initial_extras", it) } };
        activity.intent.replaceExtras(Bundle());
        intent?.replaceExtras(Bundle());
        return ret
      }

      override fun getLaunchOptions(): Bundle? = mInitialProps
  }
}
