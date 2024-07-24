import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, Share } from "react-native";
import Dialog from "react-native-dialog";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { ScriptsList } from "@/scriptsConfig";
import { MKTheme } from "@/theme";

export type WVRequester = (f: string) => Promise<string>;

interface Props {
  uri: string;
  onThemeChange: (newTheme: MKTheme) => void;
  onOpenExternalURL?: (url: string) => void;
  userScripts?: ScriptsList;
  innerKey?: string;

  innerProps?: React.ComponentProps<typeof WebView>;
  innerRef?: React.RefObject<WebView>;

  requesterRef?: React.MutableRefObject<WVRequester | null>;
}

// just a simple minifier
export function minifyScript(script: string) {
  return script.replace(/\/\/.*$/gm, "").replace(/[ \t\r\n]+/gs, " ");
}

const BASE_SCRIPT = minifyScript(`
(() => {
  if (!window.ReactNativeWebView) return;

  window.addEventListener('load', () => {
    let value = '#000;#fff';
    const styleObserver = new MutationObserver((mutations) => {
      const s = mutations[0].target.style;
      const currentValue = s.getPropertyValue('--fg') + ';' + s.getPropertyValue('--bg');

      if (currentValue !== value) {
        value = currentValue;
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'theme', value }))
      }
    });

    styleObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    });

    document.body.addEventListener('contextmenu', (e) => {
      const t = e.target;
      if (!t.classList.contains('pswp__img')) return;
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'pressImage', value: t.getAttribute('src') }));
    });
  });

  const itv = setInterval(() => {
    const e = document.getElementById('splash');
    if (e !== null && e.style.opacity === '0') {
      clearInterval(itv);
      window.dispatchEvent(new Event('MKReady'));
    }
  }, 10);

  if (!navigator.share) {
    navigator.share = (param) => {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'share', value: param }));
    };
  };

})();

`);

interface WebShareAPIParam {
  // ref https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share
  url?: string;
  text?: string;
  title?: string;
  // files unhandled
}

const Web: React.FC<Props> = ({
  uri,
  onThemeChange,
  onOpenExternalURL,
  userScripts,

  innerKey,
  innerProps,
  innerRef,

  requesterRef,
}) => {
  const { t } = useTranslation();

  const [wvKey, refreshWv] = React.useReducer((x) => x + 1, 0);

  const [DLTarget, setDLTarget] = React.useState<string | null>(null);

  const pendingRequests = React.useRef<{
    [key: string]: {
      res: (val: string) => void;
      rej: (val: string) => void;
    };
  }>({});
  useEffect(() => {
    if (!requesterRef) return;
    requesterRef.current = (f: string) => {
      console.log("requesting", f);
      return new Promise((res, rej) => {
        const key = Math.random().toString(36).slice(2);
        pendingRequests.current[key] = { res, rej };
        innerRef?.current?.injectJavaScript(`
          try {
            const v = eval(${JSON.stringify(f)});
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'response', key: '${key}', value: v }));
          } catch (e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'responseError', key: '${key}', value: e.toString() }));
          }
        `);
      });
    };
  }, [innerRef?.current, requesterRef?.current]);

  const handleBack = React.useCallback(() => {
    try {
      const c = innerRef?.current;
      if (c) {
        c.goBack();
        return true;
      }
    } catch (err) {
      console.log(err);
    }
    // BackHandler.exitApp();
    return undefined;
  }, [innerRef?.current]);

  React.useEffect(() => {
    BackHandler.addEventListener("hardwareBackPress", handleBack);
    return () => {
      BackHandler.removeEventListener("hardwareBackPress", handleBack);
    };
  }, []);

  const onMsg = React.useCallback(
    (event: WebViewMessageEvent) => {
      const { type, value, ...rest } = JSON.parse(event.nativeEvent.data) as {
        type: string;
        value: unknown;
        [key: string]: unknown;
      };
      // console.log({ type, value });

      switch (type) {
        case "theme": {
          const [fg, bg] = (value as string).split(";");
          onThemeChange({ foreground: fg, background: bg });
          break;
        }
        case "pressImage": {
          setDLTarget(value as string);
          break;
        }
        case "share": {
          // share API workaround
          // https://github.com/react-native-webview/react-native-webview/issues/1262#issuecomment-933315821
          const param = value as WebShareAPIParam;
          if (param.url == null && param.text == null) return;

          Share.share(
            {
              title: param.title,
              message: [param.text, param.url].filter(Boolean).join(" "), // join text and url if both exists
              url: param.url,
            },
            {
              dialogTitle: param.title,
              subject: param.title,
            }
          ).catch((e) => console.error(e));
          break;
        }

        case "response": {
          const key = rest.key as string;
          const val = typeof value === "string" ? value : JSON.stringify(value);

          if (pendingRequests.current[key]) {
            console.log("resolving", key, val);
            pendingRequests.current[key].res(val);
            delete pendingRequests.current[key];
          }
          break;
        }
        case "responseError": {
          const key = rest.key as string;
          const val = value as string;
          if (pendingRequests.current[key]) {
            console.log("resolvingE", key, val);
            pendingRequests.current[key].rej(val);
            delete pendingRequests.current[key];
          }
          break;
        }

        default:
          console.log("got unknown message type", type);
      }
    },
    [onThemeChange, setDLTarget]
  );

  return (
    <>
      <WebView
        {...innerProps}
        ref={innerRef}
        source={{ uri }}
        key={(innerKey ?? uri) + wvKey.toString()}
        scrollEnabled={false}
        applicationNameForUserAgent="Pskey mobile" // including 'mobile' to use mobile layout
        webviewDebuggingEnabled={true}
        onRenderProcessGone={() => {
          refreshWv();
        }}
        onOpenWindow={(e) => {
          onOpenExternalURL?.(e.nativeEvent.targetUrl);
        }}
        injectedJavaScriptBeforeContentLoadedForMainFrameOnly={true}
        injectedJavaScriptBeforeContentLoaded={
          BASE_SCRIPT +
          (userScripts?.length
            ? userScripts
                .filter((s) => s.enabled)
                .map(
                  (s) =>
                    `try { eval( ${JSON.stringify(s.content)} ) } catch (e) { alert(e); }`
                )
                .join("\n")
            : "") +
          "\ntrue\n"
        }
        onMessage={onMsg}
      />
      <Dialog.Container visible={!!DLTarget}>
        <Dialog.Title>{t("download")}</Dialog.Title>
        <Dialog.Description>{t("doYouWantToDownload")}</Dialog.Description>
        <Dialog.Button label="Cancel" onPress={() => setDLTarget(null)} />
        <Dialog.Button
          label="OK"
          onPress={() => {
            innerRef?.current?.injectJavaScript(
              `(() => { const e = document.createElement('a'); e.href = ${JSON.stringify(
                DLTarget
              )}; e.download = ''; e.target = '_blank'; e.click(); })();`
            );
            setDLTarget(null);
          }}
        />
      </Dialog.Container>
    </>
  );
};

export default Web;
