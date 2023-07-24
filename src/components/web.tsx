import React from "react";
import { BackHandler } from "react-native";
import { WebView } from "react-native-webview";

interface WebProps {
  uri: string;
  onBGColorChange: (color: string) => void;
}

const Web: React.FC<WebProps & React.ComponentProps<typeof WebView>> = ({
  uri,
  onBGColorChange,
  ...props
}) => {
  const webViewRef = React.useRef<WebView>(null);

  const handleBack = React.useCallback(() => {
    console.log("handleBack");
    try {
      const c = webViewRef.current;
      if (c) {
        c.goBack();
        return true;
      }
    } catch (err) {
      console.log(err);
    }
    // BackHandler.exitApp();
    return undefined;
  }, [webViewRef]);

  React.useEffect(() => {
    BackHandler.addEventListener("hardwareBackPress", handleBack);
    return () => {
      BackHandler.removeEventListener("hardwareBackPress", handleBack);
    };
  }, []);

  return (
    <WebView
      {...props}
      ref={webViewRef}
      source={{ uri }}
      scrollEnabled={false}
      applicationNameForUserAgent="Pskey mobile" // including 'mobile' to use mobile layout
      injectedJavaScript={`
      (() => {
        let value = '#fff';
        const styleObserver = new MutationObserver((mutations) => {
          const currentValue = mutations[0].target.style.getPropertyValue('--bg');

          if (currentValue !== value) {
            value = currentValue;
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'bgcolor', value }))
          }
        });

        styleObserver.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ['style'],
        });
      })();

      true
      `}
      onMessage={(event) => {
        const { type, value } = JSON.parse(event.nativeEvent.data) as {
          type: string;
          value: string;
        };
        console.log({ type, value });

        if (type === "bgcolor") onBGColorChange(value);
      }}
    />
  );
};

export default Web;
