type LocaleKeys = [
  "addServer",
  "addingServer",
  "areYouSure",
  "confirmYourURL",
  "customScript",
  "deleteThisServer",
  "deletingServer_s",
  "enterServerURL",
  "failedToFetchServer",
  "invalidURL",
  "saveAndClose",
  "serverConfig",
  "serverConfig_s",
  "wrongServerURL",
][number];

type Locale = {
  [key in LocaleKeys]: string;
};

export default Locale;
