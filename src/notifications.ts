import { PermissionsAndroid } from "react-native";
import { composeNotification } from "./misskeyNotifications";
import i18n from "@/i18n";
import { makeNotification } from "@/nativeNotifications";
import { decryptMessage, loadPushKeys } from "@/webPushCrypto";
import messaging, {
  FirebaseMessagingTypes,
} from "@react-native-firebase/messaging";

const SERVICE_SERVER_URL = "https://pskey-push.fuwa.dev";

// load user tokens from localStorage and run script
const embedTemplate = (content: string) => `
(async () => {
  try {
    const account = JSON.parse(localStorage.getItem('account'));
    if (!account) {
      throw new Error('${i18n.t("loginRequired")}');
    }
${content}
  } catch (e) {
    alert('${i18n.t("errorOccured")}\\n' + e);
  }
})();
`;

const registerScriptTemplate = (
  endpoint: string,
  publickey: string,
  auth: string
) =>
  embedTemplate(`
const token = account['token'];
const res = await fetch('/api/sw/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    i: token,
    endpoint: ${JSON.stringify(endpoint)} + '/' + account['username'],
    publickey: ${JSON.stringify(publickey)},
    auth: ${JSON.stringify(auth)},
  }),
});
console.log(res);
alert('${i18n.t("registrationSuccessful")}');
`);
export async function registerServiceWorker(domain: string) {
  // ensure notification permission
  if (
    (await PermissionsAndroid.request(
      "android.permission.POST_NOTIFICATIONS"
    )) !== "granted"
  ) {
    throw new Error("Permission denied");
  }

  const keys = await loadPushKeys();
  if (!keys) throw new Error("No keys found");

  const fcmToken = await messaging().getToken();

  const vapid: string = await fetch("https://" + domain + "/api/meta", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: `{"detail": false}`,
  })
    .then((res) => res.json())
    .then((data) => data.swPublickey);

  const reg_id: string = await fetch(SERVICE_SERVER_URL + "/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token: fcmToken,
      domain: domain,
      vapid: vapid,
    }),
  })
    .then((res) => res.json())
    .then((data) => data.id);

  const registerScript = registerScriptTemplate(
    SERVICE_SERVER_URL + "/push/" + reg_id,
    keys.publicKey,
    keys.authSecret
  );

  return registerScript;
}

export default async function messageHandler(
  message: FirebaseMessagingTypes.RemoteMessage
) {
  const data = message.data;
  if (!data) {
    console.log("No data found");
    return;
  }

  if ("webpush_message" in data) {
    const msg = data.webpush_message;
    const name: string | null = data.name;
    const domain = data.src_domain;
    const src = name ? `@${name}@${domain}` : domain;

    const keys = await loadPushKeys();
    if (!keys) {
      console.log("No keys found");
      return;
    }

    try {
      const raw_msg = await decryptMessage(
        msg,
        keys.privateKey,
        keys.publicKey,
        keys.authSecret
      );

      const m = JSON.parse(raw_msg);
      const notif = composeNotification(src, m);
      if (notif === null) return; // do not show notification

      const nn = {
        id: message.messageId!,
        group: src,
        when: String(message.sentTime ?? Date.now()),
        subtitle: src,

        ...notif,
      };
      await makeNotification(nn);
    } catch (e) {
      console.log("Error decrypting message: " + e);
      return;
    }
  }
}
