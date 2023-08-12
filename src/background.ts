import { NativeModules, processColor } from "react-native";

const { BackgroundColor } = NativeModules;

export async function setBackgroundColor(color: string, light: boolean) {
  const c = processColor(color);
  if (c === null || c === undefined) return Promise.reject("invalid color");
  if (typeof c !== "number") return Promise.reject("err");
  return (await BackgroundColor.setBackgroundColor(c, light)) as boolean;
}
