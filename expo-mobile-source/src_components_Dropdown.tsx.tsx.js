// Source: src/components/Dropdown.tsx
// Module ID: 833
// Extracted from Metro bundle (transpiled JS)

__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  "use strict";

  var _jsxFileName = "/app/frontend/src/components/Dropdown.tsx",
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
      return Dropdown;
    }
  });
  var _react = require(_dependencyMap[0], "react");
  var _reactNativeWebDistExportsModal = require(_dependencyMap[1], "react-native-web/dist/exports/Modal");
  var Modal = _interopDefault(_reactNativeWebDistExportsModal);
  var _reactNativeWebDistExportsView = require(_dependencyMap[2], "react-native-web/dist/exports/View");
  var View = _interopDefault(_reactNativeWebDistExportsView);
  var _reactNativeWebDistExportsText = require(_dependencyMap[3], "react-native-web/dist/exports/Text");
  var Text = _interopDefault(_reactNativeWebDistExportsText);
  var _reactNativeWebDistExportsPressable = require(_dependencyMap[4], "react-native-web/dist/exports/Pressable");
  var Pressable = _interopDefault(_reactNativeWebDistExportsPressable);
  var _reactNativeWebDistExportsScrollView = require(_dependencyMap[5], "react-native-web/dist/exports/ScrollView");
  var ScrollView = _interopDefault(_reactNativeWebDistExportsScrollView);
  var _reactNativeWebDistExportsStyleSheet = require(_dependencyMap[6], "react-native-web/dist/exports/StyleSheet");
  var StyleSheet = _interopDefault(_reactNativeWebDistExportsStyleSheet);
  var _reactNativeWebDistExportsTextInput = require(_dependencyMap[7], "react-native-web/dist/exports/TextInput");
  var TextInput = _interopDefault(_reactNativeWebDistExportsTextInput);
  var _expoVectorIcons = require(_dependencyMap[8], "@expo/vector-icons");
  var _theme = require(_dependencyMap[9], "../theme");
  var _reactJsxDevRuntime = require(_dependencyMap[10], "react/jsx-dev-runtime");
  function Dropdown({
    label,
    value,
    options,
    onChange,
    placeholder = 'Select…',
    searchable,
    testID
  }) {
    _s();
    const [open, setOpen] = (0, _react.useState)(false);
    const [q, setQ] = (0, _react.useState)('');
    const selected = options.find(o => o.value === value);
    const filtered = q ? options.filter(o => o.label.toLowerCase().includes(q.toLowerCase())) : options;
    return /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
      style: {
        marginBottom: _theme.theme.space.md
      },
      children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
        style: styles.label,
        children: label
      }, void 0, false, {
        fileName: _jsxFileName,
        lineNumber: 30,
        columnNumber: 7
      }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Pressable.default, {
        testID: testID,
        onPress: () => setOpen(true),
        style: styles.field,
        children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
          style: [styles.fieldText, !selected && {
            color: _theme.theme.color.onSurface3
          }],
          numberOfLines: 1,
          children: selected ? selected.label : placeholder
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 35,
          columnNumber: 9
        }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_expoVectorIcons.MaterialCommunityIcons, {
          name: "chevron-down",
          size: 20,
          color: _theme.theme.color.onSurface3
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 38,
          columnNumber: 9
        }, this)]
      }, void 0, true, {
        fileName: _jsxFileName,
        lineNumber: 31,
        columnNumber: 7
      }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Modal.default, {
        transparent: true,
        visible: open,
        animationType: "fade",
        onRequestClose: () => setOpen(false),
        children: /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Pressable.default, {
          style: styles.backdrop,
          onPress: () => setOpen(false),
          children: /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Pressable.default, {
            style: styles.sheet,
            onPress: () => {},
            children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
              style: styles.sheetHeader,
              children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
                style: styles.sheetTitle,
                children: label
              }, void 0, false, {
                fileName: _jsxFileName,
                lineNumber: 45,
                columnNumber: 15
              }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Pressable.default, {
                onPress: () => setOpen(false),
                testID: "dropdown-close",
                children: /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_expoVectorIcons.MaterialCommunityIcons, {
                  name: "close",
                  size: 22,
                  color: _theme.theme.color.onSurface
                }, void 0, false, {
                  fileName: _jsxFileName,
                  lineNumber: 47,
                  columnNumber: 17
                }, this)
              }, void 0, false, {
                fileName: _jsxFileName,
                lineNumber: 46,
                columnNumber: 15
              }, this)]
            }, void 0, true, {
              fileName: _jsxFileName,
              lineNumber: 44,
              columnNumber: 13
            }, this), searchable && /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(TextInput.default, {
              value: q,
              onChangeText: setQ,
              placeholder: "Search\u2026",
              placeholderTextColor: _theme.theme.color.onSurface3,
              style: styles.search
            }, void 0, false, {
              fileName: _jsxFileName,
              lineNumber: 51,
              columnNumber: 15
            }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(ScrollView.default, {
              style: {
                maxHeight: 380
              },
              children: filtered.length === 0 ? /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
                style: styles.empty,
                children: "No options"
              }, void 0, false, {
                fileName: _jsxFileName,
                lineNumber: 61,
                columnNumber: 17
              }, this) : filtered.map(o => {
                const sel = o.value === value;
                return /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Pressable.default, {
                  testID: `dropdown-opt-${o.value}`,
                  style: [styles.row, sel && styles.rowSel],
                  onPress: () => {
                    onChange(o.value);
                    setOpen(false);
                    setQ('');
                  },
                  children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
                    style: {
                      flex: 1
                    },
                    children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
                      style: styles.rowText,
                      children: o.label
                    }, void 0, false, {
                      fileName: _jsxFileName,
                      lineNumber: 71,
                      columnNumber: 23
                    }, this), o.sub ? /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
                      style: styles.rowSub,
                      children: o.sub
                    }, void 0, false, {
                      fileName: _jsxFileName,
                      lineNumber: 72,
                      columnNumber: 32
                    }, this) : null]
                  }, void 0, true, {
                    fileName: _jsxFileName,
                    lineNumber: 70,
                    columnNumber: 21
                  }, this), sel && /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_expoVectorIcons.MaterialCommunityIcons, {
                    name: "check",
                    size: 20,
                    color: _theme.theme.color.brand
                  }, void 0, false, {
                    fileName: _jsxFileName,
                    lineNumber: 74,
                    columnNumber: 29
                  }, this)]
                }, o.value, true, {
                  fileName: _jsxFileName,
                  lineNumber: 65,
                  columnNumber: 19
                }, this);
              })
            }, void 0, false, {
              fileName: _jsxFileName,
              lineNumber: 59,
              columnNumber: 13
            }, this)]
          }, void 0, true, {
            fileName: _jsxFileName,
            lineNumber: 43,
            columnNumber: 11
          }, this)
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 42,
          columnNumber: 9
        }, this)
      }, void 0, false, {
        fileName: _jsxFileName,
        lineNumber: 41,
        columnNumber: 7
      }, this)]
    }, void 0, true, {
      fileName: _jsxFileName,
      lineNumber: 29,
      columnNumber: 5
    }, this);
  }
  _s(Dropdown, "NXkenEukQqXtq0+Ljb0ZDRzRdv8=");
  _c = Dropdown;
  const styles = StyleSheet.default.create({
    label: {
      color: _theme.theme.color.onSurface2,
      fontSize: _theme.theme.font.sm,
      marginBottom: 6,
      fontWeight: '600',
      letterSpacing: 0.5,
      textTransform: 'uppercase'
    },
    field: {
      backgroundColor: _theme.theme.color.surface3,
      borderColor: _theme.theme.color.border,
      borderWidth: 1,
      borderRadius: _theme.theme.radius.md,
      paddingHorizontal: _theme.theme.space.md,
      height: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    fieldText: {
      color: _theme.theme.color.onSurface,
      fontSize: _theme.theme.font.lg,
      flex: 1
    },
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'flex-end'
    },
    sheet: {
      backgroundColor: _theme.theme.color.surface2,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      padding: _theme.theme.space.lg,
      paddingBottom: _theme.theme.space.xxl
    },
    sheetHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: _theme.theme.space.md
    },
    sheetTitle: {
      color: _theme.theme.color.onSurface,
      fontSize: _theme.theme.font.xl,
      fontWeight: '700'
    },
    search: {
      backgroundColor: _theme.theme.color.surface3,
      borderRadius: _theme.theme.radius.md,
      color: _theme.theme.color.onSurface,
      paddingHorizontal: _theme.theme.space.md,
      height: 44,
      borderWidth: 1,
      borderColor: _theme.theme.color.border,
      marginBottom: _theme.theme.space.md
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: _theme.theme.space.md,
      borderBottomWidth: 1,
      borderBottomColor: _theme.theme.color.divider
    },
    rowSel: {
      backgroundColor: _theme.theme.color.brandDim,
      borderRadius: _theme.theme.radius.sm,
      paddingHorizontal: _theme.theme.space.sm
    },
    rowText: {
      color: _theme.theme.color.onSurface,
      fontSize: _theme.theme.font.lg
    },
    rowSub: {
      color: _theme.theme.color.onSurface3,
      fontSize: _theme.theme.font.sm,
      marginTop: 2
    },
    empty: {
      color: _theme.theme.color.onSurface3,
      textAlign: 'center',
      paddingVertical: _theme.theme.space.lg
    }
  });
  var _c;
  $RefreshReg$(_c, "Dropdown");
},833,[9,519,110,138,143,36,55,436,732,827,33],"src/components/Dropdown.tsx");