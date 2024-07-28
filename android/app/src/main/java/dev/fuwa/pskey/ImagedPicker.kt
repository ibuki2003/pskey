package dev.fuwa.pskey

import android.graphics.PorterDuff
import android.graphics.PorterDuffColorFilter
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.UIManagerHelper.getReactContext
import com.facebook.react.uimanager.UIManagerModule

class ImagedPicker(context: ReactContext) : androidx.appcompat.widget.AppCompatSpinner(context) {
  init {
    //Getting the instance of Spinner and applying OnItemSelectedListener on it
    val customAdapter = ImagePickerAdapter(context)
    this.adapter = customAdapter
  }

  var setSelection: Int = 0

  fun setPopupBackgroundColor(color: Int?) {
    (adapter as ImagePickerAdapter).backgroundColor = color
  }

  fun setColor(color: Int?) {
    (adapter as ImagePickerAdapter).color = color
    if (color != null) {
      background.colorFilter = PorterDuffColorFilter(color, PorterDuff.Mode.SRC_ATOP)
    }
  }

  private val measureAndLayout = Runnable {
    measure(
      MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
      MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY)
    )
    layout(left, top, right, bottom)
  }

  override fun requestLayout() {
    super.requestLayout()

    // The spinner relies on a measure + layout pass happening after it calls requestLayout().
    // Without this, the widget never actually changes the selection and doesn't call the
    // appropriate listeners. Since we override onLayout in our ViewGroups, a layout pass never
    // happens after a call to requestLayout, so we simulate one here.
    post(measureAndLayout)
  }

  private var oldHeight: Int = 0
  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    super.onMeasure(widthMeasureSpec, heightMeasureSpec)
    val view = adapter.getView(0, null, this)
    measureChild(
      view,
      MeasureSpec.makeMeasureSpec(measuredWidth, MeasureSpec.EXACTLY),
      MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
    )
    val elementSize: Int = view.measuredHeight

    if (elementSize != oldHeight) {
      val uiManager = getReactContext(this).getNativeModule(
        UIManagerModule::class.java
      )
      uiManager?.setViewLocalData(id, ReactPickerLocalData(elementSize))
      oldHeight = elementSize
    }
  }
}
