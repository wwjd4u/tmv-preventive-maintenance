// Source: app/(admin)/dashboard.tsx
// Module ID: 828
// Extracted from Metro bundle (transpiled JS)

__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  "use strict";

  var _jsxFileName = "/app/frontend/app/(admin)/dashboard.tsx",
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
      return AdminDashboard;
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
  function AdminDashboard() {
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
        console.log('load', e);
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
    const active = tickets.filter(t => t.status !== 'completed').length;
    const completed = tickets.filter(t => t.status === 'completed').length;
    const unassigned = tickets.filter(t => !t.assigned_to).length;
    const tmvById = Object.fromEntries(tmvs.map(t => [t.id, t]));
    return /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_reactNativeSafeAreaContext.SafeAreaView, {
      style: styles.root,
      edges: ['top'],
      children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
        style: styles.header,
        children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
          children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
            style: styles.hi,
            children: "Welcome back,"
          }, void 0, false, {
            fileName: _jsxFileName,
            lineNumber: 48,
            columnNumber: 11
          }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
            style: styles.name,
            children: user?.full_name
          }, void 0, false, {
            fileName: _jsxFileName,
            lineNumber: 49,
            columnNumber: 11
          }, this)]
        }, void 0, true, {
          fileName: _jsxFileName,
          lineNumber: 47,
          columnNumber: 9
        }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(CuddLogo.default, {
          size: "sm"
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 51,
          columnNumber: 9
        }, this)]
      }, void 0, true, {
        fileName: _jsxFileName,
        lineNumber: 46,
        columnNumber: 7
      }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(ScrollView.default, {
        contentContainerStyle: styles.body,
        refreshControl: /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(RefreshControl.default, {
          refreshing: refreshing,
          onRefresh: onRefresh,
          tintColor: _srcTheme.theme.color.brand
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 56,
          columnNumber: 25
        }, this),
        children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
          style: styles.metricRow,
          children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Metric, {
            testID: "metric-tmv-fleet",
            icon: "truck",
            label: "TMV Fleet",
            value: String(tmvs.length),
            onPress: () => router.push('/(admin)/manage?tab=tmvs')
          }, void 0, false, {
            fileName: _jsxFileName,
            lineNumber: 59,
            columnNumber: 11
          }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Metric, {
            testID: "metric-districts",
            icon: "map-marker-radius",
            label: "Districts",
            value: String(districts.length),
            onPress: () => router.push('/(admin)/manage?tab=districts')
          }, void 0, false, {
            fileName: _jsxFileName,
            lineNumber: 61,
            columnNumber: 11
          }, this)]
        }, void 0, true, {
          fileName: _jsxFileName,
          lineNumber: 58,
          columnNumber: 9
        }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
          style: styles.metricRow,
          children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Metric, {
            testID: "metric-active",
            icon: "progress-wrench",
            label: "Active",
            value: String(active),
            accent: true,
            onPress: () => router.push('/(admin)/tickets?filter=active')
          }, void 0, false, {
            fileName: _jsxFileName,
            lineNumber: 65,
            columnNumber: 11
          }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Metric, {
            testID: "metric-completed",
            icon: "check-decagram",
            label: "Completed",
            value: String(completed),
            onPress: () => router.push('/(admin)/tickets?filter=completed')
          }, void 0, false, {
            fileName: _jsxFileName,
            lineNumber: 67,
            columnNumber: 11
          }, this)]
        }, void 0, true, {
          fileName: _jsxFileName,
          lineNumber: 64,
          columnNumber: 9
        }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
          style: styles.sectionHead,
          children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
            style: styles.sectionTitle,
            children: ["UNASSIGNED \xB7 ", unassigned]
          }, void 0, true, {
            fileName: _jsxFileName,
            lineNumber: 72,
            columnNumber: 11
          }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Pressable.default, {
            testID: "new-ticket-btn",
            onPress: () => router.push('/(admin)/new-ticket'),
            style: styles.newBtn,
            children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_expoVectorIcons.MaterialCommunityIcons, {
              name: "plus",
              size: 18,
              color: _srcTheme.theme.color.onBrand
            }, void 0, false, {
              fileName: _jsxFileName,
              lineNumber: 74,
              columnNumber: 13
            }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
              style: styles.newBtnTxt,
              children: "NEW TICKET"
            }, void 0, false, {
              fileName: _jsxFileName,
              lineNumber: 75,
              columnNumber: 13
            }, this)]
          }, void 0, true, {
            fileName: _jsxFileName,
            lineNumber: 73,
            columnNumber: 11
          }, this)]
        }, void 0, true, {
          fileName: _jsxFileName,
          lineNumber: 71,
          columnNumber: 9
        }, this), tickets.length === 0 ? /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
          style: styles.empty,
          children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_expoVectorIcons.MaterialCommunityIcons, {
            name: "clipboard-text-outline",
            size: 40,
            color: _srcTheme.theme.color.onSurface3
          }, void 0, false, {
            fileName: _jsxFileName,
            lineNumber: 81,
            columnNumber: 13
          }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
            style: styles.emptyTxt,
            children: "No tickets yet. Create your first PM ticket."
          }, void 0, false, {
            fileName: _jsxFileName,
            lineNumber: 82,
            columnNumber: 13
          }, this)]
        }, void 0, true, {
          fileName: _jsxFileName,
          lineNumber: 80,
          columnNumber: 11
        }, this) : tickets.slice(0, 6).map(t => {
          const tmv = tmvById[t.tmv_id];
          return /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Pressable.default, {
            testID: `ticket-row-${t.id}`,
            onPress: () => router.push(`/ticket/${t.id}`),
            style: styles.card,
            children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
              style: {
                flex: 1
              },
              children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
                style: styles.cardTitle,
                children: t.title
              }, void 0, false, {
                fileName: _jsxFileName,
                lineNumber: 93,
                columnNumber: 17
              }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
                style: styles.cardSub,
                children: tmv ? `${tmv.asset_number} · ${tmv.tmv_type}` : t.tmv_id
              }, void 0, false, {
                fileName: _jsxFileName,
                lineNumber: 94,
                columnNumber: 17
              }, this)]
            }, void 0, true, {
              fileName: _jsxFileName,
              lineNumber: 92,
              columnNumber: 15
            }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(StatusChip.default, {
              value: t.status
            }, void 0, false, {
              fileName: _jsxFileName,
              lineNumber: 96,
              columnNumber: 15
            }, this)]
          }, t.id, true, {
            fileName: _jsxFileName,
            lineNumber: 87,
            columnNumber: 13
          }, this);
        }), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
          style: {
            height: 40
          }
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 101,
          columnNumber: 9
        }, this)]
      }, void 0, true, {
        fileName: _jsxFileName,
        lineNumber: 54,
        columnNumber: 7
      }, this)]
    }, void 0, true, {
      fileName: _jsxFileName,
      lineNumber: 45,
      columnNumber: 5
    }, this);
  }
  _s(AdminDashboard, "t0zdKsxUdwhIeAGMMOrTdTSHKCI=", false, function () {
    return [_srcContextAuthContext.useAuth, _expoRouter.useRouter, _expoRouter.useFocusEffect];
  });
  _c = AdminDashboard;
  function Metric({
    icon,
    label,
    value,
    accent,
    onPress,
    testID
  }) {
    return /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Pressable.default, {
      testID: testID,
      onPress: onPress,
      style: ({
        pressed
      }) => [styles.metric, accent && {
        borderColor: _srcTheme.theme.color.brand
      }, pressed && {
        opacity: 0.7
      }],
      children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_expoVectorIcons.MaterialCommunityIcons, {
        name: icon,
        size: 22,
        color: accent ? _srcTheme.theme.color.brand : _srcTheme.theme.color.onSurface3
      }, void 0, false, {
        fileName: _jsxFileName,
        lineNumber: 113,
        columnNumber: 7
      }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
        style: styles.metricValue,
        children: value
      }, void 0, false, {
        fileName: _jsxFileName,
        lineNumber: 114,
        columnNumber: 7
      }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
        style: styles.metricLabel,
        children: label
      }, void 0, false, {
        fileName: _jsxFileName,
        lineNumber: 115,
        columnNumber: 7
      }, this)]
    }, void 0, true, {
      fileName: _jsxFileName,
      lineNumber: 109,
      columnNumber: 5
    }, this);
  }
  _c2 = Metric;
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
    body: {
      padding: _srcTheme.theme.space.lg
    },
    metricRow: {
      flexDirection: 'row',
      gap: _srcTheme.theme.space.md,
      marginBottom: _srcTheme.theme.space.md
    },
    metric: {
      flex: 1,
      backgroundColor: _srcTheme.theme.color.surface2,
      borderRadius: _srcTheme.theme.radius.md,
      padding: _srcTheme.theme.space.md,
      borderWidth: 1,
      borderColor: _srcTheme.theme.color.border
    },
    metricValue: {
      color: _srcTheme.theme.color.onSurface,
      fontSize: 28,
      fontWeight: '900',
      marginTop: 6
    },
    metricLabel: {
      color: _srcTheme.theme.color.onSurface3,
      fontSize: 10,
      letterSpacing: 1.5,
      fontWeight: '700',
      marginTop: 2
    },
    sectionHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: _srcTheme.theme.space.lg,
      marginBottom: _srcTheme.theme.space.md
    },
    sectionTitle: {
      color: _srcTheme.theme.color.onSurface2,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 1.5
    },
    newBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: _srcTheme.theme.color.brand,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: _srcTheme.theme.radius.md
    },
    newBtnTxt: {
      color: _srcTheme.theme.color.onBrand,
      fontWeight: '800',
      fontSize: 11,
      letterSpacing: 1
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: _srcTheme.theme.color.surface2,
      padding: _srcTheme.theme.space.md,
      borderRadius: _srcTheme.theme.radius.md,
      borderWidth: 1,
      borderColor: _srcTheme.theme.color.border,
      marginBottom: _srcTheme.theme.space.sm
    },
    cardTitle: {
      color: _srcTheme.theme.color.onSurface,
      fontSize: _srcTheme.theme.font.lg,
      fontWeight: '700'
    },
    cardSub: {
      color: _srcTheme.theme.color.onSurface3,
      fontSize: _srcTheme.theme.font.sm,
      marginTop: 2
    },
    empty: {
      alignItems: 'center',
      padding: _srcTheme.theme.space.xl,
      backgroundColor: _srcTheme.theme.color.surface2,
      borderRadius: _srcTheme.theme.radius.md,
      borderWidth: 1,
      borderColor: _srcTheme.theme.color.border
    },
    emptyTxt: {
      color: _srcTheme.theme.color.onSurface3,
      marginTop: _srcTheme.theme.space.sm,
      textAlign: 'center'
    }
  });
  var _c, _c2;
  $RefreshReg$(_c, "AdminDashboard");
  $RefreshReg$(_c2, "Metric");
},828,[9,110,138,36,55,176,143,423,246,732,820,819,827,829,830,33],"app/(admin)/dashboard.tsx");