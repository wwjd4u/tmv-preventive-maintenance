// Source: app/_layout.tsx
// Module ID: 842
// Extracted from Metro bundle (transpiled JS)

__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  "use strict";

  var _jsxFileName = "/app/frontend/app/_layout.tsx",
    _s = $RefreshSig$();
  Object.defineProperty(exports, '__esModule', {
    value: true
  });
  function _interopNamespace(e) {
    if (e && e.__esModule) return e;
    var n = {};
    if (e) Object.keys(e).forEach(function (k) {
      var d = Object.getOwnPropertyDescriptor(e, k);
      Object.defineProperty(n, k, d.get ? d : {
        enumerable: true,
        get: function () {
          return e[k];
        }
      });
    });
    n.default = e;
    return n;
  }
  function _interopDefault(e) {
    return e && e.__esModule ? e : {
      default: e
    };
  }
  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function () {
      return RootLayout;
    }
  });
  var _expoRouter = require(_dependencyMap[0], "expo-router");
  var _expoSplashScreen = require(_dependencyMap[1], "expo-splash-screen");
  var SplashScreen = _interopNamespace(_expoSplashScreen);
  var _react = require(_dependencyMap[2], "react");
  var _reactNativeWebDistExportsLogBox = require(_dependencyMap[3], "react-native-web/dist/exports/LogBox");
  var LogBox = _interopDefault(_reactNativeWebDistExportsLogBox);
  var _reactNativeWebDistExportsStatusBar = require(_dependencyMap[4], "react-native-web/dist/exports/StatusBar");
  var StatusBar = _interopDefault(_reactNativeWebDistExportsStatusBar);
  var _reactNativeSafeAreaContext = require(_dependencyMap[5], "react-native-safe-area-context");
  var _srcHooksUseIconFonts = require(_dependencyMap[6], "@/src/hooks/use-icon-fonts");
  var _srcContextAuthContext = require(_dependencyMap[7], "@/src/context/AuthContext");
  var _srcTheme = require(_dependencyMap[8], "@/src/theme");
  var _reactJsxDevRuntime = require(_dependencyMap[9], "react/jsx-dev-runtime");
  LogBox.default.ignoreAllLogs(true);
  SplashScreen.preventAutoHideAsync();
  function RootLayout() {
    _s();
    const [loaded, error] = (0, _srcHooksUseIconFonts.useIconFonts)();
    (0, _react.useEffect)(() => {
      if (loaded || error) SplashScreen.hideAsync();
    }, [loaded, error]);
    if (!loaded && !error) return null;
    return /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_reactNativeSafeAreaContext.SafeAreaProvider, {
      children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(StatusBar.default, {
        barStyle: "dark-content",
        backgroundColor: _srcTheme.theme.color.surface
      }, void 0, false, {
        fileName: _jsxFileName,
        lineNumber: 25,
        columnNumber: 7
      }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_srcContextAuthContext.AuthProvider, {
        children: /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_expoRouter.Stack, {
          screenOptions: {
            headerShown: false,
            contentStyle: {
              backgroundColor: _srcTheme.theme.color.surface
            }
          }
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 27,
          columnNumber: 9
        }, this)
      }, void 0, false, {
        fileName: _jsxFileName,
        lineNumber: 26,
        columnNumber: 7
      }, this)]
    }, void 0, true, {
      fileName: _jsxFileName,
      lineNumber: 24,
      columnNumber: 5
    }, this);
  }
  _s(RootLayout, "iQjjlyoJJyWnH/EznqmjcL9o3Gw=", false, function () {
    return [_srcHooksUseIconFonts.useIconFonts];
  });
  _c = RootLayout;
  var _c;
  $RefreshReg$(_c, "RootLayout");
},842,[246,843,9,540,159,423,844,819,827,33],"app/_layout.tsx");