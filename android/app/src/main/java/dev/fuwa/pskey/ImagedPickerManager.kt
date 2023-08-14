package dev.fuwa.pskey

import android.util.Log
import android.view.View
import android.widget.AdapterView
import com.facebook.infer.annotation.Assertions
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.BaseViewManager
import com.facebook.react.uimanager.LayoutShadowNode
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewProps
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.EventDispatcher


class ImagePickerManager(
  private val reactContext: ReactApplicationContext
): BaseViewManager<ImagedPicker, ImagePickerShadowNode>() {

  override fun getName() = REACT_CLASS
  /**
   * Return a FrameLayout which will later hold the Fragment
   */
  override fun createViewInstance(reactContext: ThemedReactContext) =
    ImagedPicker(reactContext)

  override fun createShadowNodeInstance(): ImagePickerShadowNode {
    return ImagePickerShadowNode()
  }
  override fun getShadowNodeClass(): Class<out ImagePickerShadowNode>? {
    return ImagePickerShadowNode::class.java
  }

  override fun updateExtraData(p0: ImagedPicker, p1: Any?) { }

  @ReactProp(name="items")
  fun setItems(view: ImagedPicker, items: ReadableArray?) {
    if (items != null) {
      Log.i("pskey", items.toString())
      (view.adapter as ImagePickerAdapter).items =
        List(items.size()) { i ->
          val v = items.getMap(i)
          ImagePickerItem(
            v.getString("label") ?: "",
            v.getString("imageUrl") ?: "",
          )
        }
    }
  }

  @ReactProp(name="selected")
  fun setSelected(view: ImagedPicker, selected: Int?) {
    if (selected != null) {
      view.setSelection = selected
    }
  }

  override fun onAfterUpdateTransaction(view: ImagedPicker) {
    super.onAfterUpdateTransaction(view)
    // force refresh selection
    view.setSelection(view.setSelection)
  }

  @ReactProp(name = ViewProps.COLOR, customType = "Color")
  fun setColor(view: ImagedPicker, color: Int?) {
    view.setColor(color)
  }

  @ReactProp(name = ViewProps.BACKGROUND_COLOR)
  fun setBackgroundColor(view: ImagedPicker, backgroundColor: Int?) {
    view.setBackgroundColor(backgroundColor)
  }

  override fun addEventEmitters(reactContext: ThemedReactContext, view: ImagedPicker) {
    val dispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, view.id)
    if (dispatcher != null) {
      val eventEmitter = PickerEventEmitter(
        view,
        dispatcher
      )

      view.onItemSelectedListener = eventEmitter
    }
  }

  override fun getExportedCustomBubblingEventTypeConstants(): Map<String, Any>? {
    return mapOf(PickerItemSelectEvent.EVENT_NAME to mapOf(
        "phasedRegistrationNames" to mapOf(
          "bubbled" to "onChange"
        )
      )
    )
  }

  companion object {
    private const val REACT_CLASS = "ImagedPicker"
    private const val COMMAND_CREATE = 1
  }

  class PickerEventEmitter(private val picker: ImagedPicker, private val dispatcher: EventDispatcher)
    : AdapterView.OnItemSelectedListener {

    override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
      if (picker != null) {
        dispatcher.dispatchEvent(PickerItemSelectEvent(
          UIManagerHelper.getSurfaceId(picker),
          picker.id,
          position
        ))
      }
    }

    override fun onNothingSelected(parent: AdapterView<*>?) {
      TODO("Not yet implemented")
    }

  }
}

// NOTE: code referred to react-native-picker (licensed under MIT License, Facebook, Inc.)
// https://github.com/react-native-picker/picker

class ImagePickerShadowNode : LayoutShadowNode() {
  override fun setLocalData(data: Any) {
    Assertions.assertCondition(data is ReactPickerLocalData)
    setStyleMinHeight((data as ReactPickerLocalData).height.toFloat())
  }
}

class ReactPickerLocalData(val height: Int) {
  override fun equals(o: Any?): Boolean {
    if (this === o) return true
    if (o == null || javaClass != o.javaClass) return false
    val that = o as ReactPickerLocalData
    return height == that.height
  }

  override fun hashCode(): Int {
    return 31 + height
  }

  override fun toString(): String {
    return "RectPickerLocalData{" +
      "height=" + height +
      '}'
  }
}

internal class PickerItemSelectEvent(surfaceId: Int, viewTag: Int, private val position: Int):
  Event<PickerItemSelectEvent>(surfaceId, viewTag) {

  override fun getEventData(): WritableMap? {
    val eventData = Arguments.createMap()
    eventData.putInt("position", position)
    return eventData
  }

  override fun getEventName() = EVENT_NAME

  companion object {
    const val EVENT_NAME = "topChange"
  }
}
