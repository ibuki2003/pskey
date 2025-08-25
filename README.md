# PSkey

Pluggable Misskey client

Visit [Wiki](https://github.com/ibuki2003/pskey/wiki) for more information.

## How to build / run

Development

```sh
# start dev server
npx react-native start
# build app for development
npx react-native run-android --mode=debug
```

Release

```sh
# build app
npx react-native build-android --mode=release
# copy the file
mv android/app/build/outputs/bundle/release/app-release.aab a/artifacts/pskey-v1.8.5.aab
```

## LICENSE

This project is licensed under the MIT License.

- react-native-template
  Copyright (c) 2020 Gabriel Moncea

### Icon

<img src="https://raw.githubusercontent.com/ibuki2003/pskey/master/assets/icon.png" width="100px" height="100px" />

PSkey icon is in the public domain.
You are free to use it.
