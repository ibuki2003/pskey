package dev.fuwa.pskey

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import kotlin.collections.ArrayList

class MyAppPackage : ReactPackage {

  override fun createViewManagers(reactContext: ReactApplicationContext)
    = listOf(
      ImagePickerManager(reactContext)
    )

  override fun createNativeModules(
    reactContext: ReactApplicationContext
  ) = listOf(
    BackgroundColor(reactContext),
    WebPushCrypto(reactContext),
  )

}
