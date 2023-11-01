import React from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, Share } from "react-native";
import Dialog from "react-native-dialog";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { MKTheme } from "@/theme";

interface WebProps {
  uri: string;
  onThemeChange: (newTheme: MKTheme) => void;
  onOpenExternalURL?: (url: string) => void;
  userScripts?: string[];
  innerKey?: string;
}
type Props = WebProps & React.ComponentProps<typeof WebView>;

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

function useForwardedRef<T>(ref: React.ForwardedRef<T>) {
  const innerRef = React.useRef<T>(null);

  React.useEffect(() => {
    if (!ref) return;
    if (typeof ref === "function") {
      ref(innerRef.current);
    } else {
      ref.current = innerRef.current;
    }
  }, [ref]);

  return innerRef;
}

interface WebShareAPIParam {
  // ref https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share
  url?: string;
  text?: string;
  title?: string;
  // files unhandled
}

const Web: React.ForwardRefRenderFunction<WebView, Props> = (
  { uri, onThemeChange, onOpenExternalURL, userScripts, innerKey, ...props },
  webViewRef
) => {
  const { t } = useTranslation();

  const innerRef = useForwardedRef(webViewRef);

  const [wvKey, refreshWv] = React.useReducer((x) => x + 1, 0);

  const [DLTarget, setDLTarget] = React.useState<string | null>(null);

  const handleBack = React.useCallback(() => {
    console.log("handleBack");
    try {
      const c = innerRef.current;
      if (c) {
        c.goBack();
        return true;
      }
    } catch (err) {
      console.log(err);
    }
    // BackHandler.exitApp();
    return undefined;
  }, [innerRef.current]);

  React.useEffect(() => {
    BackHandler.addEventListener("hardwareBackPress", handleBack);
    return () => {
      BackHandler.removeEventListener("hardwareBackPress", handleBack);
    };
  }, []);

  const onMsg = React.useCallback(
    (event: WebViewMessageEvent) => {
      const { type, value } = JSON.parse(event.nativeEvent.data) as {
        type: string;
        value: unknown;
      };
      console.log({ type, value });

      switch (type) {
        case "theme":
          const [fg, bg] = (value as string).split(";");
          onThemeChange({ foreground: fg, background: bg });
          break;
        case "pressImage":
          console.log("pressImage", value);
          setDLTarget(value as string);
          break;
        case "share":
          console.log("share", value);
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
        default:
          console.log("got unknown message type", type);
      }
    },
    [onThemeChange, setDLTarget]
  );

  return (
    <>
      <WebView
        {...props}
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
                .map((s) => "try {\n" + s + "} catch (e) {alert(e);}")
                .join("\n\n\n")
            : "") +
          "\n\n\ntrue\n"
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
            innerRef.current?.injectJavaScript(
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

export default React.forwardRef<WebView, Props>(Web);
