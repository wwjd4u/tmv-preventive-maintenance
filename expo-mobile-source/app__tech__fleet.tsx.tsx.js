// Source: app/(tech)/fleet.tsx
// Module ID: 839
// Extracted from Metro bundle (transpiled JS)

__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  "use strict";

  var _jsxFileName = "/app/frontend/app/(tech)/fleet.tsx",
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
      return TechFleet;
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
  var _reactNativeWebDistExportsPressable = require(_dependencyMap[5], "react-native-web/dist/exports/Pressable");
  var Pressable = _interopDefault(_reactNativeWebDistExportsPressable);
  var _reactNativeWebDistExportsTextInput = require(_dependencyMap[6], "react-native-web/dist/exports/TextInput");
  var TextInput = _interopDefault(_reactNativeWebDistExportsTextInput);
  var _reactNativeSafeAreaContext = require(_dependencyMap[7], "react-native-safe-area-context");
  var _expoRouter = require(_dependencyMap[8], "expo-router");
  var _expoVectorIcons = require(_dependencyMap[9], "@expo/vector-icons");
  var _srcServicesApi = require(_dependencyMap[10], "@/src/services/api");
  var _srcTheme = require(_dependencyMap[11], "@/src/theme");
  var _reactJsxDevRuntime = require(_dependencyMap[12], "react/jsx-dev-runtime");
  function TechFleet() {
    _s();
    const [tmvs, setTmvs] = (0, _react.useState)([]);
    const [districts, setDistricts] = (0, _react.useState)([]);
    const [equipment, setEquipment] = (0, _react.useState)([]);
    const [q, setQ] = (0, _react.useState)('');
    const [expanded, setExpanded] = (0, _react.useState)(null);
    const load = (0, _react.useCallback)(async () => {
      try {
        const [t, d, e] = await Promise.all([(0, _srcServicesApi.api)('/tmvs'), (0, _srcServicesApi.api)('/districts'), (0, _srcServicesApi.api)('/equipment')]);
        setTmvs(t);
        setDistricts(d);
        setEquipment(e);
      } catch (err) {
        console.log(err);
      }
    }, []);
    (0, _expoRouter.useFocusEffect)((0, _react.useCallback)(() => {
      load();
    }, [load]));
    const distById = (0, _react.useMemo)(() => Object.fromEntries(districts.map(d => [d.id, d])), [districts]);
    const eqByTmv = (0, _react.useMemo)(() => {
      const m = {};
      equipment.forEach(e => {
        (m[e.tmv_id] ||= []).push(e);
      });
      return m;
    }, [equipment]);
    const filtered = tmvs.filter(t => {
      if (!q) return true;
      const dn = distById[t.district_id]?.name || '';
      return `${t.asset_number} ${t.tmv_type} ${dn}`.toLowerCase().includes(q.toLowerCase());
    });
    return /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_reactNativeSafeAreaContext.SafeAreaView, {
      style: styles.root,
      edges: ['top'],
      children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
        style: styles.header,
        children: /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
          style: styles.title,
          children: "FLEET DIRECTORY"
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 42,
          columnNumber: 9
        }, this)
      }, void 0, false, {
        fileName: _jsxFileName,
        lineNumber: 41,
        columnNumber: 7
      }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
        style: styles.searchWrap,
        children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_expoVectorIcons.MaterialCommunityIcons, {
          name: "magnify",
          size: 20,
          color: _srcTheme.theme.color.onSurface3
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 45,
          columnNumber: 9
        }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(TextInput.default, {
          value: q,
          onChangeText: setQ,
          placeholder: "Search asset # / district",
          placeholderTextColor: _srcTheme.theme.color.onSurface3,
          style: styles.searchInput
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 46,
          columnNumber: 9
        }, this)]
      }, void 0, true, {
        fileName: _jsxFileName,
        lineNumber: 44,
        columnNumber: 7
      }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(ScrollView.default, {
        contentContainerStyle: {
          padding: _srcTheme.theme.space.lg
        },
        children: [filtered.map(t => {
          const dist = distById[t.district_id];
          const eqs = eqByTmv[t.id] || [];
          const isOpen = expanded === t.id;
          return /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
            style: styles.card,
            children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Pressable.default, {
              testID: `fleet-${t.id}`,
              onPress: () => setExpanded(isOpen ? null : t.id),
              style: styles.cardHead,
              children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
                style: {
                  flex: 1
                },
                children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
                  style: styles.cardTitle,
                  children: t.asset_number
                }, void 0, false, {
                  fileName: _jsxFileName,
                  lineNumber: 61,
                  columnNumber: 19
                }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
                  style: styles.cardSub,
                  children: [t.tmv_type, " \xB7 ", dist?.name || '—']
                }, void 0, true, {
                  fileName: _jsxFileName,
                  lineNumber: 62,
                  columnNumber: 19
                }, this), t.last_known_location ? /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
                  style: styles.cardSub,
                  children: ["\uD83D\uDCCD ", t.last_known_location]
                }, void 0, true, {
                  fileName: _jsxFileName,
                  lineNumber: 63,
                  columnNumber: 44
                }, this) : null]
              }, void 0, true, {
                fileName: _jsxFileName,
                lineNumber: 60,
                columnNumber: 17
              }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_expoVectorIcons.MaterialCommunityIcons, {
                name: isOpen ? 'chevron-up' : 'chevron-down',
                size: 22,
                color: _srcTheme.theme.color.onSurface3
              }, void 0, false, {
                fileName: _jsxFileName,
                lineNumber: 65,
                columnNumber: 17
              }, this)]
            }, void 0, true, {
              fileName: _jsxFileName,
              lineNumber: 59,
              columnNumber: 15
            }, this), isOpen && /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
              style: styles.eqList,
              children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
                style: styles.eqHead,
                children: ["EQUIPMENT \xB7 ", eqs.length]
              }, void 0, true, {
                fileName: _jsxFileName,
                lineNumber: 69,
                columnNumber: 19
              }, this), eqs.length === 0 ? /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
                style: styles.eqEmpty,
                children: "No equipment records yet."
              }, void 0, false, {
                fileName: _jsxFileName,
                lineNumber: 71,
                columnNumber: 23
              }, this) : eqs.map(e => /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
                style: styles.eqRow,
                children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_expoVectorIcons.MaterialCommunityIcons, {
                  name: "chip",
                  size: 16,
                  color: _srcTheme.theme.color.brand
                }, void 0, false, {
                  fileName: _jsxFileName,
                  lineNumber: 74,
                  columnNumber: 25
                }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
                  style: {
                    flex: 1
                  },
                  children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
                    style: styles.eqName,
                    children: [e.name, " \xB7 ", e.category]
                  }, void 0, true, {
                    fileName: _jsxFileName,
                    lineNumber: 76,
                    columnNumber: 27
                  }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
                    style: styles.eqIds,
                    children: ["S/N ", e.serial_id, "  \xB7  SVC ", e.service_id]
                  }, void 0, true, {
                    fileName: _jsxFileName,
                    lineNumber: 77,
                    columnNumber: 27
                  }, this)]
                }, void 0, true, {
                  fileName: _jsxFileName,
                  lineNumber: 75,
                  columnNumber: 25
                }, this)]
              }, e.id, true, {
                fileName: _jsxFileName,
                lineNumber: 73,
                columnNumber: 23
              }, this))]
            }, void 0, true, {
              fileName: _jsxFileName,
              lineNumber: 68,
              columnNumber: 17
            }, this)]
          }, t.id, true, {
            fileName: _jsxFileName,
            lineNumber: 58,
            columnNumber: 13
          }, this);
        }), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
          style: {
            height: 40
          }
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 86,
          columnNumber: 9
        }, this)]
      }, void 0, true, {
        fileName: _jsxFileName,
        lineNumber: 52,
        columnNumber: 7
      }, this)]
    }, void 0, true, {
      fileName: _jsxFileName,
      lineNumber: 40,
      columnNumber: 5
    }, this);
  }
  _s(TechFleet, "tJPhSGECnQa1ABSRQE6RdwvFkWI=", false, function () {
    return [_expoRouter.useFocusEffect];
  });
  _c = TechFleet;
  const styles = StyleSheet.default.create({
    root: {
      flex: 1,
      backgroundColor: _srcTheme.theme.color.surface
    },
    header: {
      paddingHorizontal: _srcTheme.theme.space.lg,
      paddingVertical: _srcTheme.theme.space.md
    },
    title: {
      color: _srcTheme.theme.color.onSurface,
      fontSize: _srcTheme.theme.font.xxl,
      fontWeight: '900',
      letterSpacing: 2
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
      height: 44,
      marginBottom: _srcTheme.theme.space.md
    },
    searchInput: {
      flex: 1,
      color: _srcTheme.theme.color.onSurface,
      fontSize: _srcTheme.theme.font.base
    },
    card: {
      backgroundColor: _srcTheme.theme.color.surface2,
      borderRadius: _srcTheme.theme.radius.md,
      borderWidth: 1,
      borderColor: _srcTheme.theme.color.border,
      marginBottom: _srcTheme.theme.space.sm,
      overflow: 'hidden'
    },
    cardHead: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: _srcTheme.theme.space.md
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
    eqList: {
      borderTopWidth: 1,
      borderTopColor: _srcTheme.theme.color.divider,
      padding: _srcTheme.theme.space.md,
      backgroundColor: _srcTheme.theme.color.surface
    },
    eqHead: {
      color: _srcTheme.theme.color.onSurface3,
      fontSize: 10,
      letterSpacing: 1.5,
      fontWeight: '800',
      marginBottom: _srcTheme.theme.space.sm
    },
    eqRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: _srcTheme.theme.space.sm,
      paddingVertical: 6
    },
    eqName: {
      color: _srcTheme.theme.color.onSurface,
      fontWeight: '600',
      fontSize: _srcTheme.theme.font.base
    },
    eqIds: {
      color: _srcTheme.theme.color.onSurface3,
      fontSize: _srcTheme.theme.font.sm,
      fontFamily: 'monospace'
    },
    eqEmpty: {
      color: _srcTheme.theme.color.onSurface3,
      fontStyle: 'italic',
      fontSize: _srcTheme.theme.font.sm
    }
  });
  var _c;
  $RefreshReg$(_c, "TechFleet");
},839,[9,110,138,36,55,143,436,423,246,732,820,827,33],"app/(tech)/fleet.tsx");