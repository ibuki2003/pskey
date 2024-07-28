package dev.fuwa.pskey

import android.content.Context
import android.graphics.Color
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.BaseAdapter
import android.widget.ImageView
import android.widget.TextView
import coil.load

class ImagePickerAdapter(
  applicationContext: Context?,
) : BaseAdapter() {
  private var context: Context? = applicationContext
  var items: List<ImagePickerItem> = listOf()
    set(value) {
      field = value
      notifyDataSetChanged()
    }
  private var inflater: LayoutInflater

  init {
    inflater = LayoutInflater.from(applicationContext)
  }

  var color: Int? = null
    set(value) {
      field = value
      notifyDataSetChanged()
    }
  var backgroundColor: Int? = null
    set(value) {
      field = value
      notifyDataSetChanged()
    }

  override fun getCount(): Int = items.size;

  override fun getItem(i: Int): Any? = null;

  override fun getItemId(i: Int): Long = 0;

  override fun getView(i: Int, convertView: View?, parent: ViewGroup): View? {
    val view = convertView ?: inflater.inflate(R.layout.imaged_spinner_item, parent, false)
    view.setBackgroundColor(backgroundColor ?: Color.TRANSPARENT)
    val icon = view.findViewById<View>(R.id.imageView) as ImageView
    val names = view.findViewById<View>(R.id.textView) as TextView
    if (color != null) names.setTextColor(color!!)
    icon.load(this.items[i].imageUrl)
    names.text = this.items[i].text
    return view
  }
}

class ImagePickerItem(
  public final val text: String,
  public final val imageUrl: String,
)
