// Source: src/components/Toast.tsx
// Module ID: 834
// Extracted from Metro bundle (transpiled JS)

__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  "use strict";

  var _jsxFileName = "/app/frontend/src/components/Toast.tsx",
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
      return Toast;
    }
  });
  var _react = require(_dependencyMap[0], "react");
  var React = _interopDefault(_react);
  var _reactNativeWebDistExportsAnimated = require(_dependencyMap[1], "react-native-web/dist/exports/Animated");
  var Animated = _interopDefault(_reactNativeWebDistExportsAnimated);
  var _reactNativeWebDistExportsStyleSheet = require(_dependencyMap[2], "react-native-web/dist/exports/StyleSheet");
  var StyleSheet = _interopDefault(_reactNativeWebDistExportsStyleSheet);
  var _reactNativeWebDistExportsText = require(_dependencyMap[3], "react-native-web/dist/exports/Text");
  var Text = _interopDefault(_reactNativeWebDistExportsText);
  var _reactNativeWebDistExportsView = require(_dependencyMap[4], "react-native-web/dist/exports/View");
  var View = _interopDefault(_reactNativeWebDistExportsView);
  var _theme = require(_dependencyMap[5], "../theme");
  var _reactJsxDevRuntime = require(_dependencyMap[6], "react/jsx-dev-runtime");
  function Toast({
    message,
    type = 'info',
    onHide
  }) {
    _s();
    const opacity = React.default.useRef(new Animated.default.Value(0)).current;
    (0, _react.useEffect)(() => {
      if (!message) return;
      Animated.default.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      }).start();
      const t = setTimeout(() => {
        Animated.default.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true
        }).start(() => onHide?.());
      }, 2600);
      return () => clearTimeout(t);
    }, [message, onHide, opacity]);
    if (!message) return null;
    const bg = type === 'error' ? _theme.theme.color.error : type === 'success' ? _theme.theme.color.success : _theme.theme.color.info;
    return /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Animated.default.View, {
      pointerEvents: "none",
      style: [styles.wrap, {
        opacity
      }],
      children: /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
        style: [styles.box, {
          borderLeftColor: bg
        }],
        testID: "toast",
        children: /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
          style: styles.txt,
          children: message
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 26,
          columnNumber: 9
        }, this)
      }, void 0, false, {
        fileName: _jsxFileName,
        lineNumber: 25,
        columnNumber: 7
      }, this)
    }, void 0, false, {
      fileName: _jsxFileName,
      lineNumber: 24,
      columnNumber: 5
    }, this);
  }
  _s(Toast, "HI2rmkDStaXKpoO1B+Q8/ihvhA0=");
  _c = Toast;
  const styles = StyleSheet.default.create({
    wrap: {
      position: 'absolute',
      top: 60,
      left: 16,
      right: 16,
      zIndex: 999,
      alignItems: 'center'
    },
    box: {
      backgroundColor: _theme.theme.color.surface2,
      borderLeftWidth: 4,
      paddingHorizontal: _theme.theme.space.lg,
      paddingVertical: _theme.theme.space.md,
      borderRadius: _theme.theme.radius.md,
      maxWidth: '100%'
    },
    txt: {
      color: _theme.theme.color.onSurface,
      fontSize: _theme.theme.font.base
    }
  });
  var _c;
  $RefreshReg$(_c, "Toast");
},834,[9,166,55,138,110,827,33],"src/components/Toast.tsx");