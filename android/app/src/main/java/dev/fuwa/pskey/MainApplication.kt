package dev.fuwa.pskey

import android.app.Application
import coil.ImageLoader
import coil.ImageLoaderFactory
import coil.decode.SvgDecoder
import coil.disk.DiskCache
import coil.memory.MemoryCache
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost

class MainApplication : Application(), ReactApplication, ImageLoaderFactory {
  override val reactNativeHost: ReactNativeHost = object : DefaultReactNativeHost(this) {
    override fun getUseDeveloperSupport(): Boolean {
      return BuildConfig.DEBUG
    }

    override fun getPackages(): List<ReactPackage> = PackageList(this).packages.apply {
      add(MyAppPackage())
    }

    override fun getJSMainModuleName(): String = "index"

    override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
    override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
  }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun newImageLoader(): ImageLoader {
    return ImageLoader.Builder(this)
      .memoryCache {
        MemoryCache.Builder(this)
          .maxSizePercent(0.25)
          .build()
      }
      .diskCache {
        DiskCache.Builder()
          .directory(this.cacheDir.resolve("image_cache"))
          .maxSizePercent(0.1)
          .build()
      }
      .components {
        add(SvgDecoder.Factory())
      }
      .build()
  }
}
