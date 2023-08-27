const ja = {
  addServer: "サーバーを追加",
  addingServer: "新しいサーバーを追加する",
  areYouSure: "本当によろしいですか？",
  confirmYourURL: "URLを確認してください。",
  customScript: "カスタムスクリプト (JavaScript)",
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

  experimentalSettings: "実験的設定",
  pushNotifications: "プッシュ通知",
  becauseOfVersion: "端末のバージョンが古いため、",
  pushNotificationsUnsupported: "プッシュ通知は設定できません。",
  pushNotificationsAbout:
    "Misskeyからプッシュ通知を受けとることができます。\n" +
    "通信内容は暗号化されますが、PSkeyのサーバーを経由して通信するため、注意してください。\n" +
    "また、通知を設定するためにMisskeyのログイン情報を用いた操作を行います。\n" +
    "下のボタンを押すと、「現在ログインしているユーザー」での通知設定が行われます。",
  pushNotificationsEnable: "プッシュ通知を設定する",
  loginRequired: "ログインが必要です。",
  errorOccured: "処理中にエラーが発生しました",
  registrationSuccessful: "設定が完了しました",
} as const;

export default ja;
