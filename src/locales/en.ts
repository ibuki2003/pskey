import type Locale from "./type";

const en: Locale = {
  addServer: "Add Server",
  addingServer: "Adding a new server",
  areYouSure: "Are you sure?",
  confirmYourURL: "Please confirm URL.",
  customScript: "Custom Script (JavaScript)",
  deleteThisServer: "Delete this server",
  deletingServer: "Delete {{serverName}}",
  download: "Download",
  doYouWantToDownload:
    "Do you want to download the file?\n(It may be opened in your browser)",
  enterServerURL: "Enter server URL",
  failedToFetchServer: "Failed to fetch server information.",
  invalidURL: "Invalid URL.",
  saveAndClose: "Save and Close",
  serverConfig: "Server Configurations",
  serverConfigFor: "Configurations for {{serverName}}",
  wrongServerURL: "Wrong server URL.",

  pushNotifications: "Push Notifications",
  becauseOfVersion: "Because of your device's version,",
  pushNotificationsUnsupported: "push notifications are not supported.",
  pushNotificationsAbout:
    "You can receive push notification from Misskey." +
    "Please note that the content of the communication is encrypted, but it is transmitted through PSkey's servers." +
    "App will also use your Misskey login token to set up notifications." +
    'Press the button below to set up notifications with the "currently logged in user".',
  pushNotificationsEnable: "Set up push notifications",
  refreshEmojis: "Refresh emojis",
  refreshEmojisAbout:
    "Force refresh emoji cache. The page will be reloaded after that.",

  loginRequired: "Login required.",
  errorOccured: "An error occured。",
  registrationSuccessful: "Registration successful",

  aboutPSkey:
    "PSkey is open source software. Support, license information, etc. are available on GitHub.",

  notifications: {
    unknown: "Unknown notification",
    reply: `{{userName}} replied to you`,
    renote: `{{userName}} renoted your note`,
    quote: `{{userName}} quoted your note`,
    mention: `{{userName}} mentioned you`,
    follow: `{{userName}} followed you`,
    followRequestAccepted: `{{userName}} accepted your follow request`,
    receiveFollowRequest: `{{userName}} sent you a follow request`,
    pollEnded: "The poll has ended",
    achievementEarned: "You earned an achievement",
    newNoteByUser: "{{userName}} posted a note",
  },

  settings: {
    general: "General",
    experimental: "Experimental",
    info: "About App",
  },
};
export default en;
