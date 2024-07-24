const ja = {
  addServer: "サーバーを追加",
  addingServer: "新しいサーバーを追加する",
  areYouSure: "本当によろしいですか？",
  cancel: "キャンセル",
  confirmYourURL: "URLを確認してください。",
  customCSS: "カスタムCSS",
  customScripts: "スクリプト (JavaScript)",
  delete: "削除",
  deleteThisServer: "このサーバーを削除する",
  deletingServer: "{{serverName}} を削除します",
  download: "ダウンロード",
  doYouWantToDownload:
    "ファイルをダウンロードしますか？\n(ブラウザで開かれることがあります)",
  enterServerURL: "サーバーのURLを入力してください",
  failedToFetchServer: "サーバー情報の取得に失敗しました。",
  invalidURL: "間違ったURLです。",
  saveAndClose: "保存して閉じる",
  serverConfig: "サーバーの設定",
  serverConfigFor: "{{serverName}} の設定",
  wrongServerURL: "間違ったサーバーURLです。",

  pushNotifications: "プッシュ通知",
  becauseOfVersion: "端末のバージョンが古いため、",
  pushNotificationsUnsupported: "プッシュ通知は設定できません。",
  pushNotificationsAbout:
    "Misskeyからプッシュ通知を受けとることができます。\n" +
    "通信内容は暗号化されますが、PSkeyのサーバーを経由して通信するため、注意してください。\n" +
    "また、通知を設定するためにMisskeyのログイン情報を用いた操作を行います。\n" +
    "下のボタンを押すと、「現在ログインしているユーザー」での通知設定が行われます。",
  pushNotificationsEnable: "プッシュ通知を設定する",
  pushNotificationsUnregisterAbout: "現在のユーザの通知設定を解除します。",
  pushNotificationsUnregister: "プッシュ通知を解除する",
  pushNotificationsDeleteAbout:
    "このサーバーからの通知設定をすべて削除します。\n" +
    "この操作はすべてのユーザーに影響します。\n" +
    "サーバーを削除する前にこの操作を行うことをおすすめします。\n" +
    "また、重複して通知が届く場合はこの操作を試してください。",
  pushNotificationsDelete: "通知設定を削除する",
  refreshEmojis: "絵文字を更新する",
  refreshEmojisAbout:
    "絵文字キャッシュを強制的に更新します。その後ページがリロードされます。",

  loginRequired: "ログインが必要です。",
  errorOccured: "処理中にエラーが発生しました",
  registrationSuccessful: "設定が完了しました",

  aboutPSkey:
    "PSkeyはオープンソースソフトウェアです。サポート、ライセンス情報などはGitHubにて対応しています。",

  notifications: {
    unknown: "不明な通知",
    reply: `{{userName}} からリプライされました`,
    renote: `{{userName}} にRenoteされました`,
    quote: `{{userName}} が引用しました`,
    mention: `{{userName}} からメンションされました`,
    follow: `{{userName}} にフォローされました`,
    followRequestAccepted: `{{userName}} にフォローリクエストが承認されました`,
    receiveFollowRequest: `{{userName}} からフォローリクエストが届きました`,
    pollEnded: "アンケートの結果が出ました",
    achievementEarned: "実績を解除しました",
    newNoteByUser: "{{userName}} がノートしました",
  },

  settings: {
    general: "一般",
    experimental: "実験的設定",
    info: "アプリ情報",
  },
} as const;

export default ja;
