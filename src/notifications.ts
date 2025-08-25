import { PermissionsAndroid, Platform } from "react-native";
import { composeNotification } from "./misskeyNotifications";
import i18n from "@/i18n";
import { makeNotification } from "@/nativeNotifications";
import { decryptMessage, loadPushKeys } from "@/webPushCrypto";
import messaging, {
  FirebaseMessagingTypes,
  getMessaging,
  getToken,
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

const unregisterScriptTemplate = (endpoint: string) =>
  embedTemplate(`
const endpoint = ${JSON.stringify(endpoint)};
await Promise.all([
  endpoint,
  \`\${endpoint}/\${account['username']}\`,
].map((e) => fetch('/api/sw/unregister', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', },
  body: JSON.stringify({ i: account['token'], endpoint: e, }),
})));
alert('${i18n.t("unregistrationSuccessful")}');
`);

export async function registerServiceWorker(domain: string) {
  if (Platform.OS !== "android") {
    // only for android
    throw new Error("Unsupported platform");
  }
  // ensure notification permission
  if (
    // PUSH_NOTIFICATIONS permission is required for android 13+
    Platform.Version >= 33 &&
    (await PermissionsAndroid.request(
      "android.permission.POST_NOTIFICATIONS"
    )) !== "granted"
  ) {
    throw new Error("Permission denied");
  }

  const keys = await loadPushKeys();
  if (!keys) throw new Error("No keys found");

  const messaging = getMessaging();
  const fcmToken = await getToken(messaging);

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

// remove only one registration from misskey server
export async function unregisterServiceWorker(domain: string) {
  const fcmToken = await messaging().getToken();

  const reg_id: string = await fetch(SERVICE_SERVER_URL + "/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token: fcmToken,
      domain: domain,
    }),
  })
    .then((res) => res.json())
    .then((data) => data.id);

  const unregisterScript = unregisterScriptTemplate(
    SERVICE_SERVER_URL + "/push/" + reg_id
  );

  return unregisterScript;
}

// remove registration from fwd server; it will remove all registrations of the "server"
export async function unregisterRegistration(domain: string) {
  const fcmToken = await messaging().getToken();

  await fetch(SERVICE_SERVER_URL + "/unregister", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token: fcmToken,
      domain: domain,
    }),
  });
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
        server_domain: domain,

        ...notif,
      };
      await makeNotification(nn);
    } catch (e) {
      console.log("Error decrypting message: " + e);
      return;
    }
  }
}
