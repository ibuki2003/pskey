import Storage from "react-native-storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

const storage = new Storage({
  size: 1024,

  storageBackend: AsyncStorage, // for web: window.localStorage

  defaultExpires: null, // never

  enableCache: true,
});

export default storage;
