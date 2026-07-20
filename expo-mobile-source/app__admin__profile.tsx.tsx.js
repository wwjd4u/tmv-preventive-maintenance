// Source: app/(admin)/profile.tsx
// Module ID: 836
// Extracted from Metro bundle (transpiled JS)

__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  "use strict";

  var _jsxFileName = "/app/frontend/app/(admin)/profile.tsx",
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
      return Profile;
    }
  });
  require(_dependencyMap[0], "react");
  var _reactNativeWebDistExportsView = require(_dependencyMap[1], "react-native-web/dist/exports/View");
  var View = _interopDefault(_reactNativeWebDistExportsView);
  var _reactNativeWebDistExportsText = require(_dependencyMap[2], "react-native-web/dist/exports/Text");
  var Text = _interopDefault(_reactNativeWebDistExportsText);
  var _reactNativeWebDistExportsStyleSheet = require(_dependencyMap[3], "react-native-web/dist/exports/StyleSheet");
  var StyleSheet = _interopDefault(_reactNativeWebDistExportsStyleSheet);
  var _reactNativeWebDistExportsPressable = require(_dependencyMap[4], "react-native-web/dist/exports/Pressable");
  var Pressable = _interopDefault(_reactNativeWebDistExportsPressable);
  var _reactNativeWebDistExportsScrollView = require(_dependencyMap[5], "react-native-web/dist/exports/ScrollView");
  var ScrollView = _interopDefault(_reactNativeWebDistExportsScrollView);
  var _reactNativeSafeAreaContext = require(_dependencyMap[6], "react-native-safe-area-context");
  var _expoRouter = require(_dependencyMap[7], "expo-router");
  var _expoVectorIcons = require(_dependencyMap[8], "@expo/vector-icons");
  var _srcContextAuthContext = require(_dependencyMap[9], "@/src/context/AuthContext");
  var _srcTheme = require(_dependencyMap[10], "@/src/theme");
  var _srcComponentsStatusChip = require(_dependencyMap[11], "@/src/components/StatusChip");
  var StatusChip = _interopDefault(_srcComponentsStatusChip);
  var _srcComponentsCuddLogo = require(_dependencyMap[12], "@/src/components/CuddLogo");
  var CuddLogo = _interopDefault(_srcComponentsCuddLogo);
  var _reactJsxDevRuntime = require(_dependencyMap[13], "react/jsx-dev-runtime");
  function Profile() {
    _s();
    const {
      user,
      logout
    } = (0, _srcContextAuthContext.useAuth)();
    const router = (0, _expoRouter.useRouter)();
    const onLogout = async () => {
      await logout();
      router.replace('/login');
    };
    return /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_reactNativeSafeAreaContext.SafeAreaView, {
      style: styles.root,
      edges: ['top'],
      children: /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(ScrollView.default, {
        contentContainerStyle: {
          padding: _srcTheme.theme.space.lg
        },
        children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
          style: styles.brand,
          children: /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(CuddLogo.default, {
            size: "md"
          }, void 0, false, {
            fileName: _jsxFileName,
            lineNumber: 23,
            columnNumber: 36
          }, this)
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 23,
          columnNumber: 9
        }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
          style: styles.avatar,
          children: /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_expoVectorIcons.MaterialCommunityIcons, {
            name: "account-circle",
            size: 80,
            color: _srcTheme.theme.color.brand
          }, void 0, false, {
            fileName: _jsxFileName,
            lineNumber: 26,
            columnNumber: 11
          }, this)
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 25,
          columnNumber: 9
        }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
          style: styles.name,
          children: user?.full_name
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 28,
          columnNumber: 9
        }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
          style: styles.uname,
          children: ["@", user?.username]
        }, void 0, true, {
          fileName: _jsxFileName,
          lineNumber: 29,
          columnNumber: 9
        }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
          style: styles.chipWrap,
          children: /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(StatusChip.default, {
            value: user?.role || ''
          }, void 0, false, {
            fileName: _jsxFileName,
            lineNumber: 30,
            columnNumber: 39
          }, this)
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 30,
          columnNumber: 9
        }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
          style: styles.card,
          children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Row, {
            icon: "email-outline",
            label: "Email",
            value: user?.email || '—'
          }, void 0, false, {
            fileName: _jsxFileName,
            lineNumber: 33,
            columnNumber: 11
          }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Row, {
            icon: "shield-account",
            label: "Role",
            value: user?.role === 'admin' ? 'Administrator' : 'Field Technician'
          }, void 0, false, {
            fileName: _jsxFileName,
            lineNumber: 34,
            columnNumber: 11
          }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Row, {
            icon: "identifier",
            label: "User ID",
            value: user?.id?.slice(0, 8) + '…'
          }, void 0, false, {
            fileName: _jsxFileName,
            lineNumber: 35,
            columnNumber: 11
          }, this)]
        }, void 0, true, {
          fileName: _jsxFileName,
          lineNumber: 32,
          columnNumber: 9
        }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Pressable.default, {
          testID: "logout-btn",
          onPress: onLogout,
          style: styles.logout,
          children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_expoVectorIcons.MaterialCommunityIcons, {
            name: "logout",
            size: 18,
            color: _srcTheme.theme.color.error
          }, void 0, false, {
            fileName: _jsxFileName,
            lineNumber: 39,
            columnNumber: 11
          }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
            style: styles.logoutTxt,
            children: "SIGN OUT"
          }, void 0, false, {
            fileName: _jsxFileName,
            lineNumber: 40,
            columnNumber: 11
          }, this)]
        }, void 0, true, {
          fileName: _jsxFileName,
          lineNumber: 38,
          columnNumber: 9
        }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
          style: styles.footer,
          children: "TMV Inspector \xB7 CUDD Energy Services"
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 43,
          columnNumber: 9
        }, this)]
      }, void 0, true, {
        fileName: _jsxFileName,
        lineNumber: 22,
        columnNumber: 7
      }, this)
    }, void 0, false, {
      fileName: _jsxFileName,
      lineNumber: 21,
      columnNumber: 5
    }, this);
  }
  _s(Profile, "mU4omnRdQA8PySeBpGE/lWg2WMg=", false, function () {
    return [_srcContextAuthContext.useAuth, _expoRouter.useRouter];
  });
  _c = Profile;
  function Row({
    icon,
    label,
    value
  }) {
    return /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
      style: styles.row,
      children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_expoVectorIcons.MaterialCommunityIcons, {
        name: icon,
        size: 20,
        color: _srcTheme.theme.color.onSurface3
      }, void 0, false, {
        fileName: _jsxFileName,
        lineNumber: 52,
        columnNumber: 7
      }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
        style: {
          flex: 1
        },
        children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
          style: styles.rowL,
          children: label
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 54,
          columnNumber: 9
        }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
          style: styles.rowV,
          children: value
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 55,
          columnNumber: 9
        }, this)]
      }, void 0, true, {
        fileName: _jsxFileName,
        lineNumber: 53,
        columnNumber: 7
      }, this)]
    }, void 0, true, {
      fileName: _jsxFileName,
      lineNumber: 51,
      columnNumber: 5
    }, this);
  }
  _c2 = Row;
  const styles = StyleSheet.default.create({
    root: {
      flex: 1,
      backgroundColor: _srcTheme.theme.color.surface
    },
    brand: {
      alignItems: 'center',
      marginBottom: _srcTheme.theme.space.lg
    },
    avatar: {
      alignItems: 'center',
      marginTop: _srcTheme.theme.space.sm
    },
    name: {
      textAlign: 'center',
      color: _srcTheme.theme.color.onSurface,
      fontSize: _srcTheme.theme.font.xxl,
      fontWeight: '800',
      marginTop: _srcTheme.theme.space.sm
    },
    uname: {
      textAlign: 'center',
      color: _srcTheme.theme.color.onSurface3,
      fontSize: _srcTheme.theme.font.base,
      marginTop: 2
    },
    chipWrap: {
      alignItems: 'center',
      marginTop: _srcTheme.theme.space.sm
    },
    card: {
      backgroundColor: _srcTheme.theme.color.surface2,
      borderRadius: _srcTheme.theme.radius.md,
      borderWidth: 1,
      borderColor: _srcTheme.theme.color.border,
      marginTop: _srcTheme.theme.space.xl,
      padding: _srcTheme.theme.space.md
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: _srcTheme.theme.space.md,
      paddingVertical: _srcTheme.theme.space.sm,
      borderBottomWidth: 1,
      borderBottomColor: _srcTheme.theme.color.divider
    },
    rowL: {
      color: _srcTheme.theme.color.onSurface3,
      fontSize: 10,
      letterSpacing: 1,
      fontWeight: '700',
      textTransform: 'uppercase'
    },
    rowV: {
      color: _srcTheme.theme.color.onSurface,
      fontSize: _srcTheme.theme.font.base,
      marginTop: 2
    },
    logout: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: _srcTheme.theme.space.xl,
      borderWidth: 1,
      borderColor: _srcTheme.theme.color.error,
      backgroundColor: _srcTheme.theme.color.surface2,
      borderRadius: _srcTheme.theme.radius.md,
      height: 48
    },
    logoutTxt: {
      color: _srcTheme.theme.color.error,
      fontWeight: '800',
      letterSpacing: 1.5
    },
    footer: {
      textAlign: 'center',
      color: _srcTheme.theme.color.onSurface3,
      marginTop: _srcTheme.theme.space.xl,
      fontSize: _srcTheme.theme.font.sm
    }
  });
  var _c, _c2;
  $RefreshReg$(_c, "Profile");
  $RefreshReg$(_c2, "Row");
},836,[9,110,138,55,143,36,423,246,732,819,827,829,830,33],"app/(admin)/profile.tsx");