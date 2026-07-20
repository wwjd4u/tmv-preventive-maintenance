// Source: app/login.tsx
// Module ID: 846
// Extracted from Metro bundle (transpiled JS)

__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  "use strict";

  var _jsxFileName = "/app/frontend/app/login.tsx",
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
      return Login;
    }
  });
  var _react = require(_dependencyMap[0], "react");
  var _reactNativeWebDistExportsView = require(_dependencyMap[1], "react-native-web/dist/exports/View");
  var View = _interopDefault(_reactNativeWebDistExportsView);
  var _reactNativeWebDistExportsText = require(_dependencyMap[2], "react-native-web/dist/exports/Text");
  var Text = _interopDefault(_reactNativeWebDistExportsText);
  var _reactNativeWebDistExportsTextInput = require(_dependencyMap[3], "react-native-web/dist/exports/TextInput");
  var TextInput = _interopDefault(_reactNativeWebDistExportsTextInput);
  var _reactNativeWebDistExportsPressable = require(_dependencyMap[4], "react-native-web/dist/exports/Pressable");
  var Pressable = _interopDefault(_reactNativeWebDistExportsPressable);
  var _reactNativeWebDistExportsStyleSheet = require(_dependencyMap[5], "react-native-web/dist/exports/StyleSheet");
  var StyleSheet = _interopDefault(_reactNativeWebDistExportsStyleSheet);
  var _reactNativeWebDistExportsKeyboardAvoidingView = require(_dependencyMap[6], "react-native-web/dist/exports/KeyboardAvoidingView");
  var KeyboardAvoidingView = _interopDefault(_reactNativeWebDistExportsKeyboardAvoidingView);
  var _reactNativeWebDistExportsPlatform = require(_dependencyMap[7], "react-native-web/dist/exports/Platform");
  var Platform = _interopDefault(_reactNativeWebDistExportsPlatform);
  var _reactNativeWebDistExportsScrollView = require(_dependencyMap[8], "react-native-web/dist/exports/ScrollView");
  var ScrollView = _interopDefault(_reactNativeWebDistExportsScrollView);
  var _reactNativeWebDistExportsActivityIndicator = require(_dependencyMap[9], "react-native-web/dist/exports/ActivityIndicator");
  var ActivityIndicator = _interopDefault(_reactNativeWebDistExportsActivityIndicator);
  var _expoRouter = require(_dependencyMap[10], "expo-router");
  var _expoVectorIcons = require(_dependencyMap[11], "@expo/vector-icons");
  var _reactNativeSafeAreaContext = require(_dependencyMap[12], "react-native-safe-area-context");
  var _srcContextAuthContext = require(_dependencyMap[13], "@/src/context/AuthContext");
  var _srcTheme = require(_dependencyMap[14], "@/src/theme");
  var _srcComponentsCuddLogo = require(_dependencyMap[15], "@/src/components/CuddLogo");
  var CuddLogo = _interopDefault(_srcComponentsCuddLogo);
  var _srcComponentsToast = require(_dependencyMap[16], "@/src/components/Toast");
  var Toast = _interopDefault(_srcComponentsToast);
  var _reactJsxDevRuntime = require(_dependencyMap[17], "react/jsx-dev-runtime");
  function Login() {
    _s();
    const {
      login
    } = (0, _srcContextAuthContext.useAuth)();
    const router = (0, _expoRouter.useRouter)();
    const [identifier, setIdentifier] = (0, _react.useState)('');
    const [password, setPassword] = (0, _react.useState)('');
    const [loading, setLoading] = (0, _react.useState)(false);
    const [err, setErr] = (0, _react.useState)(null);
    const [showPw, setShowPw] = (0, _react.useState)(false);
    const submit = async () => {
      if (!identifier || !password) {
        setErr('Enter username/email and password');
        return;
      }
      setLoading(true);
      setErr(null);
      try {
        const u = await login(identifier.trim(), password);
        router.replace(u.role === 'admin' ? '/(admin)/dashboard' : '/(tech)/tickets');
      } catch (e) {
        setErr(e.message || 'Login failed');
      } finally {
        setLoading(false);
      }
    };
    return /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
      style: styles.root,
      children: /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_reactNativeSafeAreaContext.SafeAreaView, {
        style: {
          flex: 1
        },
        edges: ['top', 'bottom'],
        children: /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(KeyboardAvoidingView.default, {
          behavior: Platform.default.OS === 'ios' ? 'padding' : undefined,
          style: {
            flex: 1
          },
          children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Toast.default, {
            message: err,
            type: "error",
            onHide: () => setErr(null)
          }, void 0, false, {
            fileName: _jsxFileName,
            lineNumber: 40,
            columnNumber: 11
          }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(ScrollView.default, {
            contentContainerStyle: styles.scroll,
            keyboardShouldPersistTaps: "handled",
            children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
              style: styles.brandWrap,
              children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(CuddLogo.default, {
                size: "lg"
              }, void 0, false, {
                fileName: _jsxFileName,
                lineNumber: 43,
                columnNumber: 15
              }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
                style: styles.divider
              }, void 0, false, {
                fileName: _jsxFileName,
                lineNumber: 44,
                columnNumber: 15
              }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
                style: styles.title,
                children: "TMV PREVENTIVE MAINTENANCE"
              }, void 0, false, {
                fileName: _jsxFileName,
                lineNumber: 45,
                columnNumber: 15
              }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
                style: styles.subtitle,
                children: "Van Inspections"
              }, void 0, false, {
                fileName: _jsxFileName,
                lineNumber: 46,
                columnNumber: 15
              }, this)]
            }, void 0, true, {
              fileName: _jsxFileName,
              lineNumber: 42,
              columnNumber: 13
            }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
              style: styles.card,
              children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
                style: styles.cardTitle,
                children: "Sign In"
              }, void 0, false, {
                fileName: _jsxFileName,
                lineNumber: 50,
                columnNumber: 15
              }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
                style: styles.label,
                children: "Username or Email"
              }, void 0, false, {
                fileName: _jsxFileName,
                lineNumber: 52,
                columnNumber: 15
              }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
                style: styles.inputWrap,
                children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_expoVectorIcons.MaterialCommunityIcons, {
                  name: "account-outline",
                  size: 20,
                  color: _srcTheme.theme.color.onSurface3
                }, void 0, false, {
                  fileName: _jsxFileName,
                  lineNumber: 54,
                  columnNumber: 17
                }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(TextInput.default, {
                  testID: "login-identifier",
                  value: identifier,
                  onChangeText: setIdentifier,
                  placeholder: "admin",
                  placeholderTextColor: _srcTheme.theme.color.onSurface3,
                  autoCapitalize: "none",
                  style: styles.input
                }, void 0, false, {
                  fileName: _jsxFileName,
                  lineNumber: 55,
                  columnNumber: 17
                }, this)]
              }, void 0, true, {
                fileName: _jsxFileName,
                lineNumber: 53,
                columnNumber: 15
              }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
                style: styles.label,
                children: "Password"
              }, void 0, false, {
                fileName: _jsxFileName,
                lineNumber: 66,
                columnNumber: 15
              }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
                style: styles.inputWrap,
                children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_expoVectorIcons.MaterialCommunityIcons, {
                  name: "lock-outline",
                  size: 20,
                  color: _srcTheme.theme.color.onSurface3
                }, void 0, false, {
                  fileName: _jsxFileName,
                  lineNumber: 68,
                  columnNumber: 17
                }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(TextInput.default, {
                  testID: "login-password",
                  value: password,
                  onChangeText: setPassword,
                  placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
                  placeholderTextColor: _srcTheme.theme.color.onSurface3,
                  secureTextEntry: !showPw,
                  style: styles.input
                }, void 0, false, {
                  fileName: _jsxFileName,
                  lineNumber: 69,
                  columnNumber: 17
                }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Pressable.default, {
                  onPress: () => setShowPw(!showPw),
                  hitSlop: 12,
                  children: /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_expoVectorIcons.MaterialCommunityIcons, {
                    name: showPw ? 'eye-off-outline' : 'eye-outline',
                    size: 20,
                    color: _srcTheme.theme.color.onSurface3
                  }, void 0, false, {
                    fileName: _jsxFileName,
                    lineNumber: 79,
                    columnNumber: 19
                  }, this)
                }, void 0, false, {
                  fileName: _jsxFileName,
                  lineNumber: 78,
                  columnNumber: 17
                }, this)]
              }, void 0, true, {
                fileName: _jsxFileName,
                lineNumber: 67,
                columnNumber: 15
              }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Pressable.default, {
                testID: "login-submit-button",
                disabled: loading,
                onPress: submit,
                style: ({
                  pressed
                }) => [styles.cta, pressed && {
                  opacity: 0.85
                }, loading && {
                  opacity: 0.6
                }],
                children: loading ? /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(ActivityIndicator.default, {
                  color: _srcTheme.theme.color.onBrand
                }, void 0, false, {
                  fileName: _jsxFileName,
                  lineNumber: 91,
                  columnNumber: 21
                }, this) : /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
                  style: styles.ctaTxt,
                  children: "SIGN IN"
                }, void 0, false, {
                  fileName: _jsxFileName,
                  lineNumber: 92,
                  columnNumber: 21
                }, this)
              }, void 0, false, {
                fileName: _jsxFileName,
                lineNumber: 85,
                columnNumber: 15
              }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
                style: styles.hintBox,
                children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
                  style: styles.hintTitle,
                  children: "DEMO ACCOUNTS"
                }, void 0, false, {
                  fileName: _jsxFileName,
                  lineNumber: 96,
                  columnNumber: 17
                }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
                  style: styles.hint,
                  children: ["Admin: ", /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
                    style: styles.hintV,
                    children: "admin / Admin@123"
                  }, void 0, false, {
                    fileName: _jsxFileName,
                    lineNumber: 97,
                    columnNumber: 50
                  }, this)]
                }, void 0, true, {
                  fileName: _jsxFileName,
                  lineNumber: 97,
                  columnNumber: 17
                }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
                  style: styles.hint,
                  children: ["Tech: ", /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
                    style: styles.hintV,
                    children: "tech1 / Tech@123"
                  }, void 0, false, {
                    fileName: _jsxFileName,
                    lineNumber: 98,
                    columnNumber: 49
                  }, this)]
                }, void 0, true, {
                  fileName: _jsxFileName,
                  lineNumber: 98,
                  columnNumber: 17
                }, this)]
              }, void 0, true, {
                fileName: _jsxFileName,
                lineNumber: 95,
                columnNumber: 15
              }, this)]
            }, void 0, true, {
              fileName: _jsxFileName,
              lineNumber: 49,
              columnNumber: 13
            }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
              style: styles.footer,
              children: "\xA9 CUDD Energy Services \xB7 TMV Preventive Maintenance"
            }, void 0, false, {
              fileName: _jsxFileName,
              lineNumber: 102,
              columnNumber: 13
            }, this)]
          }, void 0, true, {
            fileName: _jsxFileName,
            lineNumber: 41,
            columnNumber: 11
          }, this)]
        }, void 0, true, {
          fileName: _jsxFileName,
          lineNumber: 37,
          columnNumber: 9
        }, this)
      }, void 0, false, {
        fileName: _jsxFileName,
        lineNumber: 36,
        columnNumber: 7
      }, this)
    }, void 0, false, {
      fileName: _jsxFileName,
      lineNumber: 35,
      columnNumber: 5
    }, this);
  }
  _s(Login, "AwvN1TvcrG14rm4B3XPFzWgCmLU=", false, function () {
    return [_srcContextAuthContext.useAuth, _expoRouter.useRouter];
  });
  _c = Login;
  const styles = StyleSheet.default.create({
    root: {
      flex: 1,
      backgroundColor: _srcTheme.theme.color.surface
    },
    scroll: {
      flexGrow: 1,
      padding: _srcTheme.theme.space.lg,
      justifyContent: 'center'
    },
    brandWrap: {
      alignItems: 'center',
      marginBottom: _srcTheme.theme.space.xl
    },
    divider: {
      height: 2,
      width: 60,
      backgroundColor: _srcTheme.theme.color.brand,
      marginVertical: _srcTheme.theme.space.md
    },
    title: {
      color: _srcTheme.theme.color.onSurface,
      fontSize: 20,
      fontWeight: '900',
      letterSpacing: 2,
      textAlign: 'center'
    },
    subtitle: {
      color: _srcTheme.theme.color.onSurface3,
      marginTop: 6,
      fontSize: 12,
      letterSpacing: 1.5
    },
    card: {
      backgroundColor: _srcTheme.theme.color.surface2,
      borderRadius: _srcTheme.theme.radius.lg,
      padding: _srcTheme.theme.space.lg,
      borderWidth: 1,
      borderColor: _srcTheme.theme.color.border
    },
    cardTitle: {
      color: _srcTheme.theme.color.onSurface,
      fontSize: _srcTheme.theme.font.xl,
      fontWeight: '800',
      marginBottom: _srcTheme.theme.space.lg
    },
    label: {
      color: _srcTheme.theme.color.onSurface2,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.8,
      marginBottom: 6,
      textTransform: 'uppercase'
    },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: _srcTheme.theme.space.sm,
      backgroundColor: _srcTheme.theme.color.surface3,
      borderRadius: _srcTheme.theme.radius.md,
      borderWidth: 1,
      borderColor: _srcTheme.theme.color.border,
      paddingHorizontal: _srcTheme.theme.space.md,
      height: 50,
      marginBottom: _srcTheme.theme.space.md
    },
    input: {
      flex: 1,
      color: _srcTheme.theme.color.onSurface,
      fontSize: _srcTheme.theme.font.lg
    },
    cta: {
      height: 52,
      backgroundColor: _srcTheme.theme.color.brand,
      borderRadius: _srcTheme.theme.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: _srcTheme.theme.space.sm
    },
    ctaTxt: {
      color: _srcTheme.theme.color.onBrand,
      fontWeight: '900',
      fontSize: _srcTheme.theme.font.lg,
      letterSpacing: 2
    },
    hintBox: {
      marginTop: _srcTheme.theme.space.lg,
      padding: _srcTheme.theme.space.md,
      borderRadius: _srcTheme.theme.radius.md,
      backgroundColor: _srcTheme.theme.color.surface3,
      borderWidth: 1,
      borderColor: _srcTheme.theme.color.divider
    },
    hintTitle: {
      color: _srcTheme.theme.color.onSurface3,
      fontSize: 10,
      letterSpacing: 1.5,
      fontWeight: '800',
      marginBottom: 4
    },
    hint: {
      color: _srcTheme.theme.color.onSurface2,
      fontSize: _srcTheme.theme.font.sm,
      marginTop: 2
    },
    hintV: {
      color: _srcTheme.theme.color.brand,
      fontWeight: '700'
    },
    footer: {
      textAlign: 'center',
      color: _srcTheme.theme.color.onSurface3,
      fontSize: _srcTheme.theme.font.sm,
      marginTop: _srcTheme.theme.space.xl
    }
  });
  var _c;
  $RefreshReg$(_c, "Login");
},846,[9,110,138,436,143,55,518,14,36,513,246,732,423,819,827,830,834,33],"app/login.tsx");