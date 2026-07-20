// Source: app/(tech)/tickets.tsx
// Module ID: 841
// Extracted from Metro bundle (transpiled JS)

__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  "use strict";

  var _jsxFileName = "/app/frontend/app/(tech)/tickets.tsx",
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
      return TechTickets;
    }
  });
  var _react = require(_dependencyMap[0], "react");
  var _reactNativeWebDistExportsView = require(_dependencyMap[1], "react-native-web/dist/exports/View");
  var View = _interopDefault(_reactNativeWebDistExportsView);
  var _reactNativeWebDistExportsText = require(_dependencyMap[2], "react-native-web/dist/exports/Text");
  var Text = _interopDefault(_reactNativeWebDistExportsText);
  var _reactNativeWebDistExportsScrollView = require(_dependencyMap[3], "react-native-web/dist/exports/ScrollView");
  var ScrollView = _interopDefault(_reactNativeWebDistExportsScrollView);
  var _reactNativeWebDistExportsStyleSheet = require(_dependencyMap[4], "react-native-web/dist/exports/StyleSheet");
  var StyleSheet = _interopDefault(_reactNativeWebDistExportsStyleSheet);
  var _reactNativeWebDistExportsRefreshControl = require(_dependencyMap[5], "react-native-web/dist/exports/RefreshControl");
  var RefreshControl = _interopDefault(_reactNativeWebDistExportsRefreshControl);
  var _reactNativeWebDistExportsPressable = require(_dependencyMap[6], "react-native-web/dist/exports/Pressable");
  var Pressable = _interopDefault(_reactNativeWebDistExportsPressable);
  var _reactNativeSafeAreaContext = require(_dependencyMap[7], "react-native-safe-area-context");
  var _expoRouter = require(_dependencyMap[8], "expo-router");
  var _expoVectorIcons = require(_dependencyMap[9], "@expo/vector-icons");
  var _srcServicesApi = require(_dependencyMap[10], "@/src/services/api");
  var _srcContextAuthContext = require(_dependencyMap[11], "@/src/context/AuthContext");
  var _srcTheme = require(_dependencyMap[12], "@/src/theme");
  var _srcComponentsStatusChip = require(_dependencyMap[13], "@/src/components/StatusChip");
  var StatusChip = _interopDefault(_srcComponentsStatusChip);
  var _srcComponentsCuddLogo = require(_dependencyMap[14], "@/src/components/CuddLogo");
  var CuddLogo = _interopDefault(_srcComponentsCuddLogo);
  var _reactJsxDevRuntime = require(_dependencyMap[15], "react/jsx-dev-runtime");
  function TechTickets() {
    _s();
    const {
      user
    } = (0, _srcContextAuthContext.useAuth)();
    const router = (0, _expoRouter.useRouter)();
    const [tickets, setTickets] = (0, _react.useState)([]);
    const [tmvs, setTmvs] = (0, _react.useState)([]);
    const [districts, setDistricts] = (0, _react.useState)([]);
    const [refreshing, setRefreshing] = (0, _react.useState)(false);
    const load = (0, _react.useCallback)(async () => {
      try {
        const [t, m, d] = await Promise.all([(0, _srcServicesApi.api)('/tickets'), (0, _srcServicesApi.api)('/tmvs'), (0, _srcServicesApi.api)('/districts')]);
        setTickets(t);
        setTmvs(m);
        setDistricts(d);
      } catch (e) {
        console.log(e);
      }
    }, []);
    (0, _expoRouter.useFocusEffect)((0, _react.useCallback)(() => {
      load();
    }, [load]));
    const onRefresh = async () => {
      setRefreshing(true);
      await load();
      setRefreshing(false);
    };
    const tmvById = (0, _react.useMemo)(() => Object.fromEntries(tmvs.map(t => [t.id, t])), [tmvs]);
    const distById = (0, _react.useMemo)(() => Object.fromEntries(districts.map(d => [d.id, d])), [districts]);
    const active = tickets.filter(t => t.status !== 'completed');
    const done = tickets.filter(t => t.status === 'completed');
    return /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_reactNativeSafeAreaContext.SafeAreaView, {
      style: styles.root,
      edges: ['top'],
      children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
        style: styles.header,
        children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
          children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
            style: styles.hi,
            children: "Field Ops"
          }, void 0, false, {
            fileName: _jsxFileName,
            lineNumber: 41,
            columnNumber: 11
          }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
            style: styles.name,
            children: user?.full_name
          }, void 0, false, {
            fileName: _jsxFileName,
            lineNumber: 42,
            columnNumber: 11
          }, this)]
        }, void 0, true, {
          fileName: _jsxFileName,
          lineNumber: 40,
          columnNumber: 9
        }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(CuddLogo.default, {
          size: "sm"
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 44,
          columnNumber: 9
        }, this)]
      }, void 0, true, {
        fileName: _jsxFileName,
        lineNumber: 39,
        columnNumber: 7
      }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(ScrollView.default, {
        contentContainerStyle: {
          padding: _srcTheme.theme.space.lg
        },
        refreshControl: /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(RefreshControl.default, {
          refreshing: refreshing,
          onRefresh: onRefresh,
          tintColor: _srcTheme.theme.color.brand
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 48,
          columnNumber: 25
        }, this),
        children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
          style: styles.geoCard,
          children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_expoVectorIcons.MaterialCommunityIcons, {
            name: "crosshairs-gps",
            size: 22,
            color: _srcTheme.theme.color.brand
          }, void 0, false, {
            fileName: _jsxFileName,
            lineNumber: 51,
            columnNumber: 11
          }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
            style: {
              flex: 1
            },
            children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
              style: styles.geoTitle,
              children: "TMV Geo-Tracker"
            }, void 0, false, {
              fileName: _jsxFileName,
              lineNumber: 53,
              columnNumber: 13
            }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
              style: styles.geoSub,
              children: "Live location tracking coming soon"
            }, void 0, false, {
              fileName: _jsxFileName,
              lineNumber: 54,
              columnNumber: 13
            }, this)]
          }, void 0, true, {
            fileName: _jsxFileName,
            lineNumber: 52,
            columnNumber: 11
          }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
            style: styles.soonBadge,
            children: /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
              style: styles.soonTxt,
              children: "SOON"
            }, void 0, false, {
              fileName: _jsxFileName,
              lineNumber: 56,
              columnNumber: 42
            }, this)
          }, void 0, false, {
            fileName: _jsxFileName,
            lineNumber: 56,
            columnNumber: 11
          }, this)]
        }, void 0, true, {
          fileName: _jsxFileName,
          lineNumber: 50,
          columnNumber: 9
        }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
          style: styles.section,
          children: ["ACTIVE \xB7 ", active.length]
        }, void 0, true, {
          fileName: _jsxFileName,
          lineNumber: 59,
          columnNumber: 9
        }, this), active.length === 0 ? /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
          style: styles.empty,
          children: "All caught up for today."
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 61,
          columnNumber: 13
        }, this) : active.map(t => {
          const tmv = tmvById[t.tmv_id];
          const dist = distById[t.district_id];
          return /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Pressable.default, {
            testID: `tech-ticket-${t.id}`,
            onPress: () => router.push(`/ticket/${t.id}`),
            style: styles.card,
            children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
              style: styles.cardHead,
              children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
                style: styles.cardTitle,
                children: t.title
              }, void 0, false, {
                fileName: _jsxFileName,
                lineNumber: 72,
                columnNumber: 19
              }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(StatusChip.default, {
                value: t.status,
                size: "sm"
              }, void 0, false, {
                fileName: _jsxFileName,
                lineNumber: 73,
                columnNumber: 19
              }, this)]
            }, void 0, true, {
              fileName: _jsxFileName,
              lineNumber: 71,
              columnNumber: 17
            }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
              style: styles.metaRow,
              children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_expoVectorIcons.MaterialCommunityIcons, {
                name: "server",
                size: 14,
                color: _srcTheme.theme.color.onSurface3
              }, void 0, false, {
                fileName: _jsxFileName,
                lineNumber: 76,
                columnNumber: 19
              }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
                style: styles.meta,
                children: tmv ? `${tmv.asset_number} · ${tmv.tmv_type}` : '—'
              }, void 0, false, {
                fileName: _jsxFileName,
                lineNumber: 77,
                columnNumber: 19
              }, this)]
            }, void 0, true, {
              fileName: _jsxFileName,
              lineNumber: 75,
              columnNumber: 17
            }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
              style: styles.metaRow,
              children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_expoVectorIcons.MaterialCommunityIcons, {
                name: "map-marker",
                size: 14,
                color: _srcTheme.theme.color.onSurface3
              }, void 0, false, {
                fileName: _jsxFileName,
                lineNumber: 80,
                columnNumber: 19
              }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
                style: styles.meta,
                children: [dist?.name || '—', tmv?.last_known_location ? ` · ${tmv.last_known_location}` : '']
              }, void 0, true, {
                fileName: _jsxFileName,
                lineNumber: 81,
                columnNumber: 19
              }, this)]
            }, void 0, true, {
              fileName: _jsxFileName,
              lineNumber: 79,
              columnNumber: 17
            }, this)]
          }, t.id, true, {
            fileName: _jsxFileName,
            lineNumber: 66,
            columnNumber: 15
          }, this);
        }), done.length > 0 && /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_reactJsxDevRuntime.Fragment, {
          children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
            style: styles.section,
            children: ["COMPLETED \xB7 ", done.length]
          }, void 0, true, {
            fileName: _jsxFileName,
            lineNumber: 89,
            columnNumber: 13
          }, this), done.map(t => /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Pressable.default, {
            testID: `tech-ticket-${t.id}`,
            onPress: () => router.push(`/ticket/${t.id}`),
            style: [styles.card, {
              opacity: 0.7
            }],
            children: /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
              style: styles.cardHead,
              children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
                style: styles.cardTitle,
                children: t.title
              }, void 0, false, {
                fileName: _jsxFileName,
                lineNumber: 97,
                columnNumber: 19
              }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(StatusChip.default, {
                value: t.status,
                size: "sm"
              }, void 0, false, {
                fileName: _jsxFileName,
                lineNumber: 98,
                columnNumber: 19
              }, this)]
            }, void 0, true, {
              fileName: _jsxFileName,
              lineNumber: 96,
              columnNumber: 17
            }, this)
          }, t.id, false, {
            fileName: _jsxFileName,
            lineNumber: 91,
            columnNumber: 15
          }, this))]
        }, void 0, true), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
          style: {
            height: 40
          }
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 104,
          columnNumber: 9
        }, this)]
      }, void 0, true, {
        fileName: _jsxFileName,
        lineNumber: 47,
        columnNumber: 7
      }, this)]
    }, void 0, true, {
      fileName: _jsxFileName,
      lineNumber: 38,
      columnNumber: 5
    }, this);
  }
  _s(TechTickets, "rxK4H/kKwKRQaBEg0qr6Yi239qs=", false, function () {
    return [_srcContextAuthContext.useAuth, _expoRouter.useRouter, _expoRouter.useFocusEffect];
  });
  _c = TechTickets;
  const styles = StyleSheet.default.create({
    root: {
      flex: 1,
      backgroundColor: _srcTheme.theme.color.surface
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: _srcTheme.theme.space.lg,
      paddingVertical: _srcTheme.theme.space.md,
      borderBottomWidth: 1,
      borderBottomColor: _srcTheme.theme.color.divider
    },
    hi: {
      color: _srcTheme.theme.color.onSurface3,
      fontSize: _srcTheme.theme.font.sm,
      letterSpacing: 1
    },
    name: {
      color: _srcTheme.theme.color.onSurface,
      fontSize: _srcTheme.theme.font.xl,
      fontWeight: '800'
    },
    geoCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: _srcTheme.theme.space.md,
      backgroundColor: _srcTheme.theme.color.surface2,
      padding: _srcTheme.theme.space.md,
      borderRadius: _srcTheme.theme.radius.md,
      borderWidth: 1,
      borderColor: _srcTheme.theme.color.brand,
      borderStyle: 'dashed',
      marginBottom: _srcTheme.theme.space.lg
    },
    geoTitle: {
      color: _srcTheme.theme.color.onSurface,
      fontWeight: '700',
      fontSize: _srcTheme.theme.font.lg
    },
    geoSub: {
      color: _srcTheme.theme.color.onSurface3,
      fontSize: _srcTheme.theme.font.sm,
      marginTop: 2
    },
    soonBadge: {
      backgroundColor: _srcTheme.theme.color.brand,
      borderRadius: _srcTheme.theme.radius.sm,
      paddingHorizontal: 8,
      paddingVertical: 3
    },
    soonTxt: {
      color: _srcTheme.theme.color.onBrand,
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 1
    },
    section: {
      color: _srcTheme.theme.color.onSurface2,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 1.5,
      marginTop: _srcTheme.theme.space.md,
      marginBottom: _srcTheme.theme.space.sm
    },
    card: {
      backgroundColor: _srcTheme.theme.color.surface2,
      padding: _srcTheme.theme.space.md,
      borderRadius: _srcTheme.theme.radius.md,
      borderWidth: 1,
      borderColor: _srcTheme.theme.color.border,
      marginBottom: _srcTheme.theme.space.sm
    },
    cardHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4
    },
    cardTitle: {
      color: _srcTheme.theme.color.onSurface,
      fontSize: _srcTheme.theme.font.lg,
      fontWeight: '700',
      flex: 1
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 4
    },
    meta: {
      color: _srcTheme.theme.color.onSurface2,
      fontSize: _srcTheme.theme.font.sm
    },
    empty: {
      color: _srcTheme.theme.color.onSurface3,
      textAlign: 'center',
      marginVertical: _srcTheme.theme.space.xl
    }
  });
  var _c;
  $RefreshReg$(_c, "TechTickets");
},841,[9,110,138,36,55,176,143,423,246,732,820,819,827,829,830,33],"app/(tech)/tickets.tsx");