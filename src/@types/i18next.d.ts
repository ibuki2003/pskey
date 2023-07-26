import type Locale from "@/locales/type";
import "i18next";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: {
      translation: Locale;
    };
  }
}
