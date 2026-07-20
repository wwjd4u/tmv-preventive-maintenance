// Source: src/components/CuddLogo.tsx
// Module ID: 830
// Extracted from Metro bundle (transpiled JS)

__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  "use strict";

  var _jsxFileName = "/app/frontend/src/components/CuddLogo.tsx";
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
      return CuddLogo;
    }
  });
  require(_dependencyMap[0], "react");
  var _reactNativeWebDistExportsView = require(_dependencyMap[1], "react-native-web/dist/exports/View");
  var View = _interopDefault(_reactNativeWebDistExportsView);
  var _reactNativeWebDistExportsImage = require(_dependencyMap[2], "react-native-web/dist/exports/Image");
  var Image = _interopDefault(_reactNativeWebDistExportsImage);
  var _reactNativeWebDistExportsStyleSheet = require(_dependencyMap[3], "react-native-web/dist/exports/StyleSheet");
  var StyleSheet = _interopDefault(_reactNativeWebDistExportsStyleSheet);
  var _reactJsxDevRuntime = require(_dependencyMap[4], "react/jsx-dev-runtime");
  const LOGO = require(_dependencyMap[5], "../../assets/images/cudd-logo.png");
  // Native aspect ratio of the source image (~292 x 130) => 2.25
  const RATIO = 2.25;
  function CuddLogo({
    size = 'md'
  }) {
    const w = size === 'lg' ? 220 : size === 'md' ? 150 : 100;
    const h = w / RATIO;
    return /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
      style: {
        width: w,
        height: h,
        alignItems: 'center',
        justifyContent: 'center'
      },
      children: /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Image.default, {
        source: LOGO,
        style: [styles.img, {
          width: w,
          height: h
        }],
        resizeMode: "contain",
        testID: "cudd-logo"
      }, void 0, false, {
        fileName: _jsxFileName,
        lineNumber: 13,
        columnNumber: 7
      }, this)
    }, void 0, false, {
      fileName: _jsxFileName,
      lineNumber: 12,
      columnNumber: 5
    }, this);
  }
  _c = CuddLogo;
  const styles = StyleSheet.default.create({
    img: {}
  });
  var _c;
  $RefreshReg$(_c, "CuddLogo");
},830,[9,110,155,55,33,831],"src/components/CuddLogo.tsx");