import i18n from "@/i18n";
import { entities } from "misskey-js";

// to avoid type error; real notification may be different from document
type RealNotification =
  | entities.Notification
  // TODO: update misskey-js and remove these lines after the next release
  // pollEnded notification will be added in the next release of misskey-js
  | { type: "pollEnded"; note: entities.Note }
  // note notification will be added in the next release of misskey
  | {
      type: "note";
      user: entities.User;
      userId: entities.User["id"];
      note: entities.Note;
    }
  | { type: "achievementEarned"; achievement: string };

export interface NotificationContent {
  title: string;
  body?: string;
  badgeUrl?: string;
  iconUrl?: string;
}

type MkPushNotification =
  | {
      type: "notification";
      body: RealNotification;
    }
  | {
      type: "unreadAntennaNote" | "readAllNotifications";
      body: unknown;
    };

function isMkNotification(n: unknown): n is entities.Notification {
  if (typeof n !== "object" || n === null) return false;
  return (
    "id" in n &&
    typeof n.id === "string" &&
    "type" in n &&
    typeof n.type === "string"
  );
}

function isMkPushNotification(n: unknown): n is MkPushNotification {
  if (typeof n !== "object" || n === null) return false;
  return (
    "type" in n &&
    typeof n.type === "string" &&
    ["notification", "unreadAntennaNote", "readAllNotifications"].includes(
      n.type
    ) &&
    "body" in n &&
    isMkNotification(n.body)
  );
}

function getBadgeUrl(domain: string, image: string): string {
  return `https://${domain}/proxy/image.webp?badge=1&url=${encodeURIComponent(
    image
  )}`;
}

function emojiUrl(domain: string, emoji: string): string | null {
  if (emoji.startsWith(":") && emoji.endsWith(":")) {
    const emojiId = emoji.slice(1, -1).split("@");
    if (emojiId.length > 2) return null;
    if (emojiId[1] === "." || emojiId[1] === "") {
      emojiId[1] = domain;
    }
    if (emojiId.length === 1) {
      emojiId.push(domain);
    }

    return getBadgeUrl(
      emojiId[1],
      `https://${emojiId[1]}/emoji/${emojiId[0]}.webp`
    );
  }

  // twemoji
  let r = Array.from(emoji).map((c) => c.codePointAt(0)?.toString(16));
  if (!r.includes("200d")) r = r.filter((c) => c !== "fe0f");
  const filename = r.join("-");
  return `https://${domain}/twemoji-badge/${filename}.png`;
}

function getMkStaticIcon(domain: string, name: string): string {
  return `https://${domain}/static-assets/tabler-badges/${name}.png`;
}

function userName(u: entities.User): string {
  return u.name ?? u.username;
}

export function composeNotification(
  srcDomain: string,
  msg: unknown
): NotificationContent | null {
  if (!isMkPushNotification(msg))
    return {
      title: i18n.t("notifications.unknown"),
      body: JSON.stringify(msg),
    };

  // ignore not-notification data
  // TODO: support unreadAntennaNote and readAllNotifications
  if (msg.type !== "notification") return null;
  const notif = msg.body;

  switch (notif.type) {
    case "reaction":
      return {
        title: `${notif.reaction} ${userName(notif.user)}`,
        body: notif.note.text ?? "",
        iconUrl: notif.user.avatarUrl,
        badgeUrl: emojiUrl(srcDomain, notif.reaction) ?? undefined,
      };

    case "reply":
      return {
        title: i18n.t("notifications.reply", {
          userName: userName(notif.user),
        }),
        body: notif.note.text ?? "",
        iconUrl: notif.user.avatarUrl,
        badgeUrl: getMkStaticIcon(srcDomain, "arrow-back-up"),
      };

    case "renote":
      return {
        title: i18n.t("notifications.renote", {
          userName: userName(notif.user),
        }),
        body: notif.note.text ?? "",
        iconUrl: notif.user.avatarUrl,
        badgeUrl: getMkStaticIcon(srcDomain, "repeat"),
      };

    case "quote":
      return {
        title: i18n.t("notifications.quote", {
          userName: userName(notif.user),
        }),
        body: notif.note.text ?? "",
        iconUrl: notif.user.avatarUrl,
        badgeUrl: getMkStaticIcon(srcDomain, "quote"),
      };

    case "mention":
      return {
        title: i18n.t("notifications.mention", {
          userName: userName(notif.user),
        }),
        body: notif.note.text ?? "",
        iconUrl: notif.user.avatarUrl,
        badgeUrl: getMkStaticIcon(srcDomain, "at"),
      };

    case "follow":
      return {
        title: i18n.t("notifications.follow", {
          userName: userName(notif.user),
        }),
        body: "",
        iconUrl: notif.user.avatarUrl,
        badgeUrl: getMkStaticIcon(srcDomain, "user-plus"),
      };

    case "followRequestAccepted":
      return {
        title: i18n.t("notifications.followRequestAccepted", {
          userName: userName(notif.user),
        }),
        body: "",
        iconUrl: notif.user.avatarUrl,
        badgeUrl: getMkStaticIcon(srcDomain, "circle-check"),
      };

    case "receiveFollowRequest":
      return {
        title: i18n.t("notifications.receiveFollowRequest", {
          userName: userName(notif.user),
        }),
        body: "",
        iconUrl: notif.user.avatarUrl,
        badgeUrl: getMkStaticIcon(srcDomain, "user-plus"),
      };

    case "app":
      return {
        title: notif.header ?? notif.body ?? "",
        body: notif.header ? (notif.body ?? "") : "",
        iconUrl: notif.icon ?? undefined,
      };

    case "pollEnded":
      return {
        title: i18n.t("notifications.pollEnded"),
        body: notif.note.text ?? "",
        // iconUrl: notif.user.avatarUrl, // avatar not given
        badgeUrl: getMkStaticIcon(srcDomain, "chart-arrows"),
      };

    case "achievementEarned":
      return {
        title: i18n.t("notifications.achievementEarned"),
        body: notif.achievement,
        badgeUrl: getMkStaticIcon(srcDomain, "medal"),
      };

    case "note":
      return {
        title: i18n.t("notifications.newNoteByUser", {
          userName: notif.user.name ?? notif.user.username,
        }),
        body: notif.note.text ?? "",
      };

    default:
      return {
        // // @ts-expect-error real notification is different from document
        title: notif.type,
        body: JSON.stringify(notif),
      };
  }

  // real notification may be different from document
  return null;
}
