import ja from "@/locales/ja";
import "i18next";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: {
      translation: typeof ja;
    };
  }
}
