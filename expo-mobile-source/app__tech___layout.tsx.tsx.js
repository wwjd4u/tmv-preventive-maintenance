// Source: app/(tech)/_layout.tsx
// Module ID: 838
// Extracted from Metro bundle (transpiled JS)

__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  "use strict";

  var _jsxFileName = "/app/frontend/app/(tech)/_layout.tsx",
    _s = $RefreshSig$();
  Object.defineProperty(exports, '__esModule', {
    value: true
  });
  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function () {
      return TechLayout;
    }
  });
  var _expoRouter = require(_dependencyMap[0], "expo-router");
  var _expoVectorIcons = require(_dependencyMap[1], "@expo/vector-icons");
  var _srcContextAuthContext = require(_dependencyMap[2], "@/src/context/AuthContext");
  var _srcTheme = require(_dependencyMap[3], "@/src/theme");
  var _reactJsxDevRuntime = require(_dependencyMap[4], "react/jsx-dev-runtime");
  function TechLayout() {
    _s();
    const {
      user,
      loading
    } = (0, _srcContextAuthContext.useAuth)();
    if (loading) return null;
    if (!user) return /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_expoRouter.Redirect, {
      href: "/login"
    }, void 0, false, {
      fileName: _jsxFileName,
      lineNumber: 9,
      columnNumber: 21
    }, this);
    if (user.role === 'admin') return /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_expoRouter.Redirect, {
      href: "/(admin)/dashboard"
    }, void 0, false, {
      fileName: _jsxFileName,
      lineNumber: 10,
      columnNumber: 37
    }, this);
    return /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_expoRouter.Tabs, {
      screenOptions: {
        headerShown: false,
        tabBarStyle: {
          backgroundColor: _srcTheme.theme.color.surface2,
          borderTopColor: _srcTheme.theme.color.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6
        },
        tabBarActiveTintColor: _srcTheme.theme.color.brand,
        tabBarInactiveTintColor: _srcTheme.theme.color.onSurface3,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.5
        }
      },
      children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_expoRouter.Tabs.Screen, {
        name: "tickets",
        options: {
          title: 'My Tickets',
          tabBarIcon: ({
            color,
            size
          }) => /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_expoVectorIcons.MaterialCommunityIcons, {
            name: "clipboard-check-outline",
            size: size,
            color: color
          }, void 0, false, {
            fileName: _jsxFileName,
            lineNumber: 30,
            columnNumber: 44
          }, this)
        }
      }, void 0, false, {
        fileName: _jsxFileName,
        lineNumber: 26,
        columnNumber: 7
      }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_expoRouter.Tabs.Screen, {
        name: "fleet",
        options: {
          title: 'Fleet',
          tabBarIcon: ({
            color,
            size
          }) => /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_expoVectorIcons.MaterialCommunityIcons, {
            name: "truck-outline",
            size: size,
            color: color
          }, void 0, false, {
            fileName: _jsxFileName,
            lineNumber: 37,
            columnNumber: 44
          }, this)
        }
      }, void 0, false, {
        fileName: _jsxFileName,
        lineNumber: 33,
        columnNumber: 7
      }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_expoRouter.Tabs.Screen, {
        name: "profile",
        options: {
          title: 'Profile',
          tabBarIcon: ({
            color,
            size
          }) => /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_expoVectorIcons.MaterialCommunityIcons, {
            name: "account-circle-outline",
            size: size,
            color: color
          }, void 0, false, {
            fileName: _jsxFileName,
            lineNumber: 44,
            columnNumber: 44
          }, this)
        }
      }, void 0, false, {
        fileName: _jsxFileName,
        lineNumber: 40,
        columnNumber: 7
      }, this)]
    }, void 0, true, {
      fileName: _jsxFileName,
      lineNumber: 13,
      columnNumber: 5
    }, this);
  }
  _s(TechLayout, "EmJkapf7qiLC5Br5eCoEq4veZes=", false, function () {
    return [_srcContextAuthContext.useAuth];
  });
  _c = TechLayout;
  var _c;
  $RefreshReg$(_c, "TechLayout");
},838,[246,732,819,827,33],"app/(tech)/_layout.tsx");