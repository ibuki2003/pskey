import React from "react";
import { BackHandler } from "react-native";
import { WebView } from "react-native-webview";
import { MKTheme } from "@/theme";

interface WebProps {
  uri: string;
  onThemeChange: (newTheme: MKTheme) => void;
  onOpenExternalURL?: (url: string) => void;
  userScripts?: string[];
  innerKey?: string;
}
type Props = WebProps & React.ComponentProps<typeof WebView>;

const BASE_SCRIPT = `
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
  });

  const itv = setInterval(() => {
    const e = document.getElementById('splash');
    if (e !== null && e.style.opacity === '0') {
      clearInterval(itv);
      window.dispatchEvent(new Event('MKReady'));
    }
  }, 10);
})();

`
  // simple "minifier"
  .replace(/\/\/.*$/gm, "")
  .replace(/[ \t\r\n]+/gs, " ");

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

const Web: React.ForwardRefRenderFunction<WebView, Props> = (
  { uri, onThemeChange, onOpenExternalURL, userScripts, innerKey, ...props },
  webViewRef
) => {
  const innerRef = useForwardedRef(webViewRef);

  const [wvKey, refreshWv] = React.useReducer((x) => x + 1, 0);

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

  return (
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
      onMessage={(event) => {
        const { type, value } = JSON.parse(event.nativeEvent.data) as {
          type: string;
          value: string;
        };
        console.log({ type, value });

        if (type === "theme") {
          const [fg, bg] = value.split(";");
          onThemeChange({ foreground: fg, background: bg });
        } else {
          console.log("got unknown message type", type);
        }
      }}
    />
  );
};

export default React.forwardRef<WebView, Props>(Web);
