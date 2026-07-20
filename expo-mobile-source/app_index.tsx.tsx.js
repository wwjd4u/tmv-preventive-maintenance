// Source: app/index.tsx
// Module ID: 845
// Extracted from Metro bundle (transpiled JS)

__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  "use strict";

  var _jsxFileName = "/app/frontend/app/index.tsx",
    _s = $RefreshSig$();
  Object.defineProperty(exports, '__esModule', {
    value: true
  });
  function _interopDefault(e) {
    return e && e.__esModule ? e : {
      default: e
    };
  }
  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function () {
      return Index;
    }
  });
  var _expoRouter = require(_dependencyMap[0], "expo-router");
  var _reactNativeWebDistExportsView = require(_dependencyMap[1], "react-native-web/dist/exports/View");
  var View = _interopDefault(_reactNativeWebDistExportsView);
  var _reactNativeWebDistExportsActivityIndicator = require(_dependencyMap[2], "react-native-web/dist/exports/ActivityIndicator");
  var ActivityIndicator = _interopDefault(_reactNativeWebDistExportsActivityIndicator);
  var _reactNativeWebDistExportsStyleSheet = require(_dependencyMap[3], "react-native-web/dist/exports/StyleSheet");
  var StyleSheet = _interopDefault(_reactNativeWebDistExportsStyleSheet);
  var _srcContextAuthContext = require(_dependencyMap[4], "@/src/context/AuthContext");
  var _srcTheme = require(_dependencyMap[5], "@/src/theme");
  var _reactJsxDevRuntime = require(_dependencyMap[6], "react/jsx-dev-runtime");
  function Index() {
    _s();
    const {
      user,
      loading
    } = (0, _srcContextAuthContext.useAuth)();
    if (loading) {
      return /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
        style: styles.c,
        children: /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(ActivityIndicator.default, {
          size: "large",
          color: _srcTheme.theme.color.brand
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 11,
          columnNumber: 9
        }, this)
      }, void 0, false, {
        fileName: _jsxFileName,
        lineNumber: 10,
        columnNumber: 7
      }, this);
    }
    if (!user) return /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_expoRouter.Redirect, {
      href: "/login"
    }, void 0, false, {
      fileName: _jsxFileName,
      lineNumber: 15,
      columnNumber: 21
    }, this);
    if (user.role === 'admin') return /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_expoRouter.Redirect, {
      href: "/(admin)/dashboard"
    }, void 0, false, {
      fileName: _jsxFileName,
      lineNumber: 16,
      columnNumber: 37
    }, this);
    return /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_expoRouter.Redirect, {
      href: "/(tech)/tickets"
    }, void 0, false, {
      fileName: _jsxFileName,
      lineNumber: 17,
      columnNumber: 10
    }, this);
  }
  _s(Index, "EmJkapf7qiLC5Br5eCoEq4veZes=", false, function () {
    return [_srcContextAuthContext.useAuth];
  });
  _c = Index;
  const styles = StyleSheet.default.create({
    c: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: _srcTheme.theme.color.surface
    }
  });
  var _c;
  $RefreshReg$(_c, "Index");
},845,[246,110,513,55,819,827,33],"app/index.tsx");