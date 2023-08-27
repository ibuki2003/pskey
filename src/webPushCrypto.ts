import React from "react";
import { NativeModules } from "react-native";
import storage from "@/storage";

const { WebPushCrypto } = NativeModules;

export const generateKeyPair: () => Promise<{
  publicKey: string;
  privateKey: string;
}> = WebPushCrypto.generateKeyPair;
export const generateAuthSecret: () => Promise<string> =
  WebPushCrypto.generateAuthSecret;

export const decryptMessage: (
  msg: string,
  privKey: string,
  pubKey: string,
  auth: string
) => Promise<string> = WebPushCrypto.decryptMessage;

export interface PushKeys {
  publicKey: string;
  privateKey: string;
  authSecret: string;
}

export function loadPushKeys(): Promise<PushKeys | null> {
  return storage
    .load({ key: "pushKeys" })
    .then((data) => {
      if (!data) {
        return null;
      }
      if ("publicKey" in data && "privateKey" in data && "authSecret" in data) {
        return data as PushKeys;
      }
      return null;
    })
    .catch((err) => {
      console.log("Error loading push keys: " + err);
      return null;
    });
}

// load or generate (and save) keys and authSecret
export function usePushKeys(): PushKeys | null {
  const [keys, setKeys] = React.useState<PushKeys | null>(null);

  React.useEffect(() => {
    loadPushKeys().then((data) => {
      if (data) {
        setKeys(data);
      } else {
        Promise.all([generateKeyPair(), generateAuthSecret()]).then(
          ([newKeys, authSecret]) => {
            storage.save({ key: "pushKeys", data: { ...newKeys, authSecret } });
            setKeys({ ...newKeys, authSecret });
          }
        );
      }
    });
  }, []);

  return keys;
}
