// Source: app/(admin)/tickets.tsx
// Module ID: 837
// Extracted from Metro bundle (transpiled JS)

__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  "use strict";

  var _jsxFileName = "/app/frontend/app/(admin)/tickets.tsx",
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
      return AdminTickets;
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
  var _reactNativeWebDistExportsTextInput = require(_dependencyMap[7], "react-native-web/dist/exports/TextInput");
  var TextInput = _interopDefault(_reactNativeWebDistExportsTextInput);
  var _reactNativeSafeAreaContext = require(_dependencyMap[8], "react-native-safe-area-context");
  var _expoRouter = require(_dependencyMap[9], "expo-router");
  var _expoVectorIcons = require(_dependencyMap[10], "@expo/vector-icons");
  var _srcServicesApi = require(_dependencyMap[11], "@/src/services/api");
  var _srcTheme = require(_dependencyMap[12], "@/src/theme");
  var _srcComponentsStatusChip = require(_dependencyMap[13], "@/src/components/StatusChip");
  var StatusChip = _interopDefault(_srcComponentsStatusChip);
  var _reactJsxDevRuntime = require(_dependencyMap[14], "react/jsx-dev-runtime");
  const FILTERS = ['all', 'active', 'assigned', 'in_progress', 'completed'];
  function AdminTickets() {
    _s();
    const router = (0, _expoRouter.useRouter)();
    const params = (0, _expoRouter.useLocalSearchParams)();
    const [tickets, setTickets] = (0, _react.useState)([]);
    const [tmvs, setTmvs] = (0, _react.useState)([]);
    const [districts, setDistricts] = (0, _react.useState)([]);
    const [users, setUsers] = (0, _react.useState)([]);
    const [filter, setFilter] = (0, _react.useState)('all');
    (0, _react.useEffect)(() => {
      if (params.filter && FILTERS.includes(params.filter)) setFilter(params.filter);
    }, [params.filter]);
    const [q, setQ] = (0, _react.useState)('');
    const [refreshing, setRefreshing] = (0, _react.useState)(false);
    const load = (0, _react.useCallback)(async () => {
      try {
        const [t, m, d, u] = await Promise.all([(0, _srcServicesApi.api)('/tickets'), (0, _srcServicesApi.api)('/tmvs'), (0, _srcServicesApi.api)('/districts'), (0, _srcServicesApi.api)('/auth/users')]);
        setTickets(t);
        setTmvs(m);
        setDistricts(d);
        setUsers(u);
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
    const userById = (0, _react.useMemo)(() => Object.fromEntries(users.map(u => [u.id, u])), [users]);
    const filtered = tickets.filter(t => {
      if (filter !== 'all' && t.status !== filter) return false;
      if (q) {
        const tmv = tmvById[t.tmv_id];
        const hay = `${t.title} ${tmv?.asset_number || ''}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
    return /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_reactNativeSafeAreaContext.SafeAreaView, {
      style: styles.root,
      edges: ['top'],
      children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
        style: styles.header,
        children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
          style: styles.title,
          children: "TICKETS"
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 60,
          columnNumber: 9
        }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Pressable.default, {
          testID: "new-ticket-fab",
          onPress: () => router.push('/(admin)/new-ticket'),
          style: styles.newBtn,
          children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_expoVectorIcons.MaterialCommunityIcons, {
            name: "plus",
            size: 18,
            color: _srcTheme.theme.color.onBrand
          }, void 0, false, {
            fileName: _jsxFileName,
            lineNumber: 62,
            columnNumber: 11
          }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
            style: styles.newBtnTxt,
            children: "NEW"
          }, void 0, false, {
            fileName: _jsxFileName,
            lineNumber: 63,
            columnNumber: 11
          }, this)]
        }, void 0, true, {
          fileName: _jsxFileName,
          lineNumber: 61,
          columnNumber: 9
        }, this)]
      }, void 0, true, {
        fileName: _jsxFileName,
        lineNumber: 59,
        columnNumber: 7
      }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
        style: styles.searchWrap,
        children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_expoVectorIcons.MaterialCommunityIcons, {
          name: "magnify",
          size: 20,
          color: _srcTheme.theme.color.onSurface3
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 68,
          columnNumber: 9
        }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(TextInput.default, {
          value: q,
          onChangeText: setQ,
          placeholder: "Search title or asset #",
          placeholderTextColor: _srcTheme.theme.color.onSurface3,
          style: styles.searchInput
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 69,
          columnNumber: 9
        }, this)]
      }, void 0, true, {
        fileName: _jsxFileName,
        lineNumber: 67,
        columnNumber: 7
      }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(ScrollView.default, {
        horizontal: true,
        showsHorizontalScrollIndicator: false,
        contentContainerStyle: styles.chipsRow,
        style: {
          maxHeight: 56
        },
        children: FILTERS.map(f => /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Pressable.default, {
          testID: `filter-${f}`,
          onPress: () => setFilter(f),
          style: [styles.chip, filter === f && styles.chipActive],
          children: /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
            style: [styles.chipTxt, filter === f && styles.chipTxtActive],
            children: f.replace('_', ' ').toUpperCase()
          }, void 0, false, {
            fileName: _jsxFileName,
            lineNumber: 85,
            columnNumber: 13
          }, this)
        }, f, false, {
          fileName: _jsxFileName,
          lineNumber: 80,
          columnNumber: 11
        }, this))
      }, void 0, false, {
        fileName: _jsxFileName,
        lineNumber: 77,
        columnNumber: 7
      }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(ScrollView.default, {
        contentContainerStyle: {
          padding: _srcTheme.theme.space.lg,
          paddingTop: 0
        },
        refreshControl: /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(RefreshControl.default, {
          refreshing: refreshing,
          onRefresh: onRefresh,
          tintColor: _srcTheme.theme.color.brand
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 92,
          columnNumber: 25
        }, this),
        children: [filtered.length === 0 ? /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
          style: styles.empty,
          children: "No tickets match your filter."
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 94,
          columnNumber: 11
        }, this) : filtered.map(t => {
          const tmv = tmvById[t.tmv_id];
          const dist = distById[t.district_id];
          const assignee = t.assigned_to ? userById[t.assigned_to] : null;
          return /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Pressable.default, {
            testID: `ticket-row-${t.id}`,
            onPress: () => router.push(`/ticket/${t.id}`),
            style: styles.card,
            children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
              style: styles.cardHead,
              children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
                style: styles.cardTitle,
                children: t.title
              }, void 0, false, {
                fileName: _jsxFileName,
                lineNumber: 106,
                columnNumber: 17
              }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(StatusChip.default, {
                value: t.status,
                size: "sm"
              }, void 0, false, {
                fileName: _jsxFileName,
                lineNumber: 107,
                columnNumber: 17
              }, this)]
            }, void 0, true, {
              fileName: _jsxFileName,
              lineNumber: 105,
              columnNumber: 15
            }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
              style: styles.metaRow,
              children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Meta, {
                icon: "server",
                text: tmv ? `${tmv.asset_number} · ${tmv.tmv_type}` : '—'
              }, void 0, false, {
                fileName: _jsxFileName,
                lineNumber: 110,
                columnNumber: 17
              }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Meta, {
                icon: "map-marker",
                text: dist?.name || '—'
              }, void 0, false, {
                fileName: _jsxFileName,
                lineNumber: 111,
                columnNumber: 17
              }, this)]
            }, void 0, true, {
              fileName: _jsxFileName,
              lineNumber: 109,
              columnNumber: 15
            }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
              style: styles.metaRow,
              children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Meta, {
                icon: "account",
                text: assignee ? assignee.full_name : 'Unassigned'
              }, void 0, false, {
                fileName: _jsxFileName,
                lineNumber: 114,
                columnNumber: 17
              }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(StatusChip.default, {
                value: t.priority,
                size: "sm"
              }, void 0, false, {
                fileName: _jsxFileName,
                lineNumber: 115,
                columnNumber: 17
              }, this)]
            }, void 0, true, {
              fileName: _jsxFileName,
              lineNumber: 113,
              columnNumber: 15
            }, this)]
          }, t.id, true, {
            fileName: _jsxFileName,
            lineNumber: 100,
            columnNumber: 13
          }, this);
        }), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
          style: {
            height: 40
          }
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 120,
          columnNumber: 9
        }, this)]
      }, void 0, true, {
        fileName: _jsxFileName,
        lineNumber: 90,
        columnNumber: 7
      }, this)]
    }, void 0, true, {
      fileName: _jsxFileName,
      lineNumber: 58,
      columnNumber: 5
    }, this);
  }
  _s(AdminTickets, "a64LNhljutbcFMO36hNSe/pDs1M=", false, function () {
    return [_expoRouter.useRouter, _expoRouter.useLocalSearchParams, _expoRouter.useFocusEffect];
  });
  _c = AdminTickets;
  function Meta({
    icon,
    text
  }) {
    return /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
      style: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flex: 1
      },
      children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_expoVectorIcons.MaterialCommunityIcons, {
        name: icon,
        size: 14,
        color: _srcTheme.theme.color.onSurface3
      }, void 0, false, {
        fileName: _jsxFileName,
        lineNumber: 129,
        columnNumber: 7
      }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
        numberOfLines: 1,
        style: {
          color: _srcTheme.theme.color.onSurface2,
          fontSize: _srcTheme.theme.font.sm
        },
        children: text
      }, void 0, false, {
        fileName: _jsxFileName,
        lineNumber: 130,
        columnNumber: 7
      }, this)]
    }, void 0, true, {
      fileName: _jsxFileName,
      lineNumber: 128,
      columnNumber: 5
    }, this);
  }
  _c2 = Meta;
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
      paddingVertical: _srcTheme.theme.space.md
    },
    title: {
      color: _srcTheme.theme.color.onSurface,
      fontSize: _srcTheme.theme.font.xxl,
      fontWeight: '900',
      letterSpacing: 2
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
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginHorizontal: _srcTheme.theme.space.lg,
      backgroundColor: _srcTheme.theme.color.surface3,
      borderRadius: _srcTheme.theme.radius.md,
      borderWidth: 1,
      borderColor: _srcTheme.theme.color.border,
      paddingHorizontal: _srcTheme.theme.space.md,
      height: 44
    },
    searchInput: {
      flex: 1,
      color: _srcTheme.theme.color.onSurface,
      fontSize: _srcTheme.theme.font.base
    },
    chipsRow: {
      paddingHorizontal: _srcTheme.theme.space.lg,
      gap: _srcTheme.theme.space.sm,
      alignItems: 'center',
      paddingVertical: _srcTheme.theme.space.md
    },
    chip: {
      height: 36,
      paddingHorizontal: 14,
      borderRadius: _srcTheme.theme.radius.pill,
      backgroundColor: _srcTheme.theme.color.surface2,
      borderWidth: 1,
      borderColor: _srcTheme.theme.color.border,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    },
    chipActive: {
      backgroundColor: _srcTheme.theme.color.brand,
      borderColor: _srcTheme.theme.color.brand
    },
    chipTxt: {
      color: _srcTheme.theme.color.onSurface2,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.8
    },
    chipTxtActive: {
      color: _srcTheme.theme.color.onBrand
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
      marginBottom: 6
    },
    cardTitle: {
      color: _srcTheme.theme.color.onSurface,
      fontSize: _srcTheme.theme.font.lg,
      fontWeight: '700',
      flex: 1,
      marginRight: _srcTheme.theme.space.sm
    },
    metaRow: {
      flexDirection: 'row',
      gap: _srcTheme.theme.space.md,
      marginTop: 4
    },
    empty: {
      color: _srcTheme.theme.color.onSurface3,
      textAlign: 'center',
      marginTop: _srcTheme.theme.space.xl
    }
  });
  var _c, _c2;
  $RefreshReg$(_c, "AdminTickets");
  $RefreshReg$(_c2, "Meta");
},837,[9,110,138,36,55,176,143,436,423,246,732,820,827,829,33],"app/(admin)/tickets.tsx");