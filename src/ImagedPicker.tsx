import React from 'react';
import { NativeSyntheticEvent, StyleProp, ViewStyle } from 'react-native';
import {requireNativeComponent} from 'react-native';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ImagedPickerNative = requireNativeComponent<any>('ImagedPicker');

interface ImagedPickerProps {
  items: Array<{value: string, label: string, imageUrl: string}>;
  selectedValue: string;

  onChange: (value: string) => void;

  style: StyleProp<ViewStyle>;
}

const ImagedPicker: React.FC<ImagedPickerProps> = (props) => {

  const selectedIdx = React.useMemo(() => {
    return props.items.findIndex((item) => item.value === props.selectedValue);
  }, [props.selectedValue]);

  return (
    <ImagedPickerNative
      items={props.items.map((item) => ({label: item.label, imageUrl: item.imageUrl}))}
      selected={selectedIdx}
      onChange={(event: NativeSyntheticEvent<{position: number}>) => {
        const idx = event.nativeEvent.position;
        props.onChange(props.items[idx].value);
      }}
      style={props.style}
      />
  );
}

export default ImagedPicker;
