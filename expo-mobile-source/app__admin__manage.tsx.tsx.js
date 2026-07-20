// Source: app/(admin)/manage.tsx
// Module ID: 832
// Extracted from Metro bundle (transpiled JS)

__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  "use strict";

  var _jsxFileName = "/app/frontend/app/(admin)/manage.tsx",
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
      return Manage;
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
  var _reactNativeWebDistExportsModal = require(_dependencyMap[7], "react-native-web/dist/exports/Modal");
  var Modal = _interopDefault(_reactNativeWebDistExportsModal);
  var _reactNativeWebDistExportsKeyboardAvoidingView = require(_dependencyMap[8], "react-native-web/dist/exports/KeyboardAvoidingView");
  var KeyboardAvoidingView = _interopDefault(_reactNativeWebDistExportsKeyboardAvoidingView);
  var _reactNativeWebDistExportsPlatform = require(_dependencyMap[9], "react-native-web/dist/exports/Platform");
  var Platform = _interopDefault(_reactNativeWebDistExportsPlatform);
  var _reactNativeSafeAreaContext = require(_dependencyMap[10], "react-native-safe-area-context");
  var _expoRouter = require(_dependencyMap[11], "expo-router");
  var _expoVectorIcons = require(_dependencyMap[12], "@expo/vector-icons");
  var _srcServicesApi = require(_dependencyMap[13], "@/src/services/api");
  var _srcTheme = require(_dependencyMap[14], "@/src/theme");
  var _srcComponentsDropdown = require(_dependencyMap[15], "@/src/components/Dropdown");
  var Dropdown = _interopDefault(_srcComponentsDropdown);
  var _srcComponentsToast = require(_dependencyMap[16], "@/src/components/Toast");
  var Toast = _interopDefault(_srcComponentsToast);
  var _reactJsxDevRuntime = require(_dependencyMap[17], "react/jsx-dev-runtime");
  function Manage() {
    _s();
    const params = (0, _expoRouter.useLocalSearchParams)();
    const [tab, setTab] = (0, _react.useState)('districts');
    (0, _react.useEffect)(() => {
      if (params.tab && ['districts', 'tmvs', 'equipment'].includes(params.tab)) {
        setTab(params.tab);
      }
    }, [params.tab]);
    const [districts, setDistricts] = (0, _react.useState)([]);
    const [tmvs, setTmvs] = (0, _react.useState)([]);
    const [equipment, setEquipment] = (0, _react.useState)([]);
    const [editing, setEditing] = (0, _react.useState)(null);
    const [toast, setToast] = (0, _react.useState)(null);
    const load = (0, _react.useCallback)(async () => {
      try {
        const [d, t, e] = await Promise.all([(0, _srcServicesApi.api)('/districts'), (0, _srcServicesApi.api)('/tmvs'), (0, _srcServicesApi.api)('/equipment')]);
        setDistricts(d);
        setTmvs(t);
        setEquipment(e);
      } catch (err) {
        console.log(err);
      }
    }, []);
    (0, _expoRouter.useFocusEffect)((0, _react.useCallback)(() => {
      load();
    }, [load]));
    const distById = (0, _react.useMemo)(() => Object.fromEntries(districts.map(d => [d.id, d])), [districts]);
    const tmvById = (0, _react.useMemo)(() => Object.fromEntries(tmvs.map(t => [t.id, t])), [tmvs]);
    const openNew = () => {
      if (tab === 'districts') setEditing({
        _kind: 'district',
        name: '',
        region: ''
      });else if (tab === 'tmvs') setEditing({
        _kind: 'tmv',
        asset_number: '',
        tmv_type: '',
        district_id: districts[0]?.id || '',
        notes: '',
        last_known_location: ''
      });else setEditing({
        _kind: 'equipment',
        tmv_id: tmvs[0]?.id || '',
        name: '',
        serial_id: '',
        service_id: '',
        category: 'Server',
        notes: ''
      });
    };
    const save = async () => {
      try {
        if (editing._kind === 'tmv' && !editing.tmv_type) {
          setToast({
            msg: 'Select a TMV type',
            type: 'error'
          });
          return;
        }
        if (editing._kind === 'district') {
          if (editing.id) await (0, _srcServicesApi.api)(`/districts/${editing.id}`, {
            method: 'DELETE'
          }); // no PUT — simple recreate
          await (0, _srcServicesApi.api)('/districts', {
            method: 'POST',
            body: {
              name: editing.name,
              region: editing.region
            }
          });
        } else if (editing._kind === 'tmv') {
          const payload = {
            asset_number: editing.asset_number,
            tmv_type: editing.tmv_type,
            district_id: editing.district_id,
            notes: editing.notes,
            last_known_location: editing.last_known_location
          };
          if (editing.id) await (0, _srcServicesApi.api)(`/tmvs/${editing.id}`, {
            method: 'PUT',
            body: payload
          });else await (0, _srcServicesApi.api)('/tmvs', {
            method: 'POST',
            body: payload
          });
        } else {
          const payload = {
            tmv_id: editing.tmv_id,
            name: editing.name,
            serial_id: editing.serial_id,
            service_id: editing.service_id,
            category: editing.category,
            notes: editing.notes
          };
          if (editing.id) await (0, _srcServicesApi.api)(`/equipment/${editing.id}`, {
            method: 'PUT',
            body: payload
          });else await (0, _srcServicesApi.api)('/equipment', {
            method: 'POST',
            body: payload
          });
        }
        setToast({
          msg: 'Saved',
          type: 'success'
        });
        setEditing(null);
        await load();
      } catch (e) {
        setToast({
          msg: e.message || 'Failed',
          type: 'error'
        });
      }
    };
    const del = async (kind, id) => {
      try {
        await (0, _srcServicesApi.api)(`/${kind}/${id}`, {
          method: 'DELETE'
        });
        await load();
        setToast({
          msg: 'Deleted',
          type: 'success'
        });
      } catch (e) {
        setToast({
          msg: e.message,
          type: 'error'
        });
      }
    };
    return /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_reactNativeSafeAreaContext.SafeAreaView, {
      style: styles.root,
      edges: ['top'],
      children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
        style: styles.header,
        children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
          style: styles.title,
          children: "MANAGE FLEET"
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 80,
          columnNumber: 9
        }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Pressable.default, {
          testID: "add-item-btn",
          onPress: openNew,
          style: styles.newBtn,
          children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_expoVectorIcons.MaterialCommunityIcons, {
            name: "plus",
            size: 18,
            color: _srcTheme.theme.color.onBrand
          }, void 0, false, {
            fileName: _jsxFileName,
            lineNumber: 82,
            columnNumber: 11
          }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
            style: styles.newBtnTxt,
            children: "ADD"
          }, void 0, false, {
            fileName: _jsxFileName,
            lineNumber: 83,
            columnNumber: 11
          }, this)]
        }, void 0, true, {
          fileName: _jsxFileName,
          lineNumber: 81,
          columnNumber: 9
        }, this)]
      }, void 0, true, {
        fileName: _jsxFileName,
        lineNumber: 79,
        columnNumber: 7
      }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Toast.default, {
        message: toast?.msg || null,
        type: toast?.type,
        onHide: () => setToast(null)
      }, void 0, false, {
        fileName: _jsxFileName,
        lineNumber: 86,
        columnNumber: 7
      }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
        style: styles.segRow,
        children: ['districts', 'tmvs', 'equipment'].map(t => /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Pressable.default, {
          testID: `tab-${t}`,
          onPress: () => setTab(t),
          style: [styles.seg, tab === t && styles.segActive],
          children: /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
            style: [styles.segTxt, tab === t && styles.segTxtActive],
            children: t.toUpperCase()
          }, void 0, false, {
            fileName: _jsxFileName,
            lineNumber: 95,
            columnNumber: 13
          }, this)
        }, t, false, {
          fileName: _jsxFileName,
          lineNumber: 90,
          columnNumber: 11
        }, this))
      }, void 0, false, {
        fileName: _jsxFileName,
        lineNumber: 88,
        columnNumber: 7
      }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(ScrollView.default, {
        contentContainerStyle: {
          padding: _srcTheme.theme.space.lg
        },
        children: [tab === 'districts' && districts.map(d => /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
          style: styles.row,
          children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
            style: {
              flex: 1
            },
            children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
              style: styles.rowTitle,
              children: d.name
            }, void 0, false, {
              fileName: _jsxFileName,
              lineNumber: 104,
              columnNumber: 15
            }, this), d.region ? /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
              style: styles.rowSub,
              children: d.region
            }, void 0, false, {
              fileName: _jsxFileName,
              lineNumber: 105,
              columnNumber: 27
            }, this) : null]
          }, void 0, true, {
            fileName: _jsxFileName,
            lineNumber: 103,
            columnNumber: 13
          }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Pressable.default, {
            testID: `del-district-${d.id}`,
            onPress: () => del('districts', d.id),
            children: /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_expoVectorIcons.MaterialCommunityIcons, {
              name: "trash-can-outline",
              size: 20,
              color: _srcTheme.theme.color.error
            }, void 0, false, {
              fileName: _jsxFileName,
              lineNumber: 108,
              columnNumber: 15
            }, this)
          }, void 0, false, {
            fileName: _jsxFileName,
            lineNumber: 107,
            columnNumber: 13
          }, this)]
        }, d.id, true, {
          fileName: _jsxFileName,
          lineNumber: 102,
          columnNumber: 11
        }, this)), tab === 'tmvs' && tmvs.map(t => /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Pressable.default, {
          testID: `tmv-${t.id}`,
          onPress: () => setEditing(Object.assign({}, t, {
            _kind: 'tmv'
          })),
          style: styles.row,
          children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
            style: {
              flex: 1
            },
            children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
              style: styles.rowTitle,
              children: t.asset_number
            }, void 0, false, {
              fileName: _jsxFileName,
              lineNumber: 116,
              columnNumber: 15
            }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
              style: styles.rowSub,
              children: distById[t.district_id]?.name || '—'
            }, void 0, false, {
              fileName: _jsxFileName,
              lineNumber: 117,
              columnNumber: 15
            }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
              style: [styles.typeBadge, {
                backgroundColor: typeBadgeBg(t.tmv_type)
              }],
              children: /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
                style: [styles.typeBadgeTxt, {
                  color: typeBadgeFg(t.tmv_type)
                }],
                children: (t.tmv_type || '—').toUpperCase()
              }, void 0, false, {
                fileName: _jsxFileName,
                lineNumber: 119,
                columnNumber: 17
              }, this)
            }, void 0, false, {
              fileName: _jsxFileName,
              lineNumber: 118,
              columnNumber: 15
            }, this)]
          }, void 0, true, {
            fileName: _jsxFileName,
            lineNumber: 115,
            columnNumber: 13
          }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Pressable.default, {
            testID: `del-tmv-${t.id}`,
            onPress: () => del('tmvs', t.id),
            hitSlop: 12,
            children: /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_expoVectorIcons.MaterialCommunityIcons, {
              name: "trash-can-outline",
              size: 20,
              color: _srcTheme.theme.color.error
            }, void 0, false, {
              fileName: _jsxFileName,
              lineNumber: 123,
              columnNumber: 15
            }, this)
          }, void 0, false, {
            fileName: _jsxFileName,
            lineNumber: 122,
            columnNumber: 13
          }, this)]
        }, t.id, true, {
          fileName: _jsxFileName,
          lineNumber: 114,
          columnNumber: 11
        }, this)), tab === 'equipment' && equipment.map(e => /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Pressable.default, {
          testID: `eq-${e.id}`,
          onPress: () => setEditing(Object.assign({}, e, {
            _kind: 'equipment'
          })),
          style: styles.row,
          children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
            style: {
              flex: 1
            },
            children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
              style: styles.rowTitle,
              children: e.name
            }, void 0, false, {
              fileName: _jsxFileName,
              lineNumber: 131,
              columnNumber: 15
            }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
              style: styles.rowSub,
              children: ["S/N ", e.serial_id, " \xB7 SVC ", e.service_id]
            }, void 0, true, {
              fileName: _jsxFileName,
              lineNumber: 132,
              columnNumber: 15
            }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
              style: styles.rowSub,
              children: [tmvById[e.tmv_id]?.asset_number || '—', " \xB7 ", e.category]
            }, void 0, true, {
              fileName: _jsxFileName,
              lineNumber: 133,
              columnNumber: 15
            }, this)]
          }, void 0, true, {
            fileName: _jsxFileName,
            lineNumber: 130,
            columnNumber: 13
          }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Pressable.default, {
            testID: `del-eq-${e.id}`,
            onPress: () => del('equipment', e.id),
            hitSlop: 12,
            children: /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_expoVectorIcons.MaterialCommunityIcons, {
              name: "trash-can-outline",
              size: 20,
              color: _srcTheme.theme.color.error
            }, void 0, false, {
              fileName: _jsxFileName,
              lineNumber: 136,
              columnNumber: 15
            }, this)
          }, void 0, false, {
            fileName: _jsxFileName,
            lineNumber: 135,
            columnNumber: 13
          }, this)]
        }, e.id, true, {
          fileName: _jsxFileName,
          lineNumber: 129,
          columnNumber: 11
        }, this)), (tab === 'districts' && districts.length === 0 || tab === 'tmvs' && tmvs.length === 0 || tab === 'equipment' && equipment.length === 0) && /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
          style: styles.empty,
          children: ["No ", tab, " yet. Tap ADD to create one."]
        }, void 0, true, {
          fileName: _jsxFileName,
          lineNumber: 144,
          columnNumber: 11
        }, this)]
      }, void 0, true, {
        fileName: _jsxFileName,
        lineNumber: 100,
        columnNumber: 7
      }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Modal.default, {
        visible: !!editing,
        transparent: true,
        animationType: "slide",
        onRequestClose: () => setEditing(null),
        children: /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(KeyboardAvoidingView.default, {
          behavior: Platform.default.OS === 'ios' ? 'padding' : undefined,
          style: styles.modalWrap,
          children: /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
            style: styles.modalCard,
            children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
              style: styles.modalHead,
              children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
                style: styles.modalTitle,
                children: [editing?._kind === 'district' ? 'District' : editing?._kind === 'tmv' ? 'TMV Asset' : 'Equipment', " \xB7 ", editing?.id ? 'Edit' : 'New']
              }, void 0, true, {
                fileName: _jsxFileName,
                lineNumber: 152,
                columnNumber: 15
              }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Pressable.default, {
                onPress: () => setEditing(null),
                testID: "modal-close",
                children: /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_expoVectorIcons.MaterialCommunityIcons, {
                  name: "close",
                  size: 22,
                  color: _srcTheme.theme.color.onSurface
                }, void 0, false, {
                  fileName: _jsxFileName,
                  lineNumber: 158,
                  columnNumber: 17
                }, this)
              }, void 0, false, {
                fileName: _jsxFileName,
                lineNumber: 157,
                columnNumber: 15
              }, this)]
            }, void 0, true, {
              fileName: _jsxFileName,
              lineNumber: 151,
              columnNumber: 13
            }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(ScrollView.default, {
              children: [editing?._kind === 'district' && /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_reactJsxDevRuntime.Fragment, {
                children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Field, {
                  label: "Name",
                  value: editing.name,
                  onChange: v => setEditing(Object.assign({}, editing, {
                    name: v
                  })),
                  testID: "fld-name"
                }, void 0, false, {
                  fileName: _jsxFileName,
                  lineNumber: 164,
                  columnNumber: 19
                }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Field, {
                  label: "Region",
                  value: editing.region,
                  onChange: v => setEditing(Object.assign({}, editing, {
                    region: v
                  })),
                  testID: "fld-region"
                }, void 0, false, {
                  fileName: _jsxFileName,
                  lineNumber: 165,
                  columnNumber: 19
                }, this)]
              }, void 0, true), editing?._kind === 'tmv' && /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_reactJsxDevRuntime.Fragment, {
                children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Field, {
                  label: "Asset Number",
                  value: editing.asset_number,
                  onChange: v => setEditing(Object.assign({}, editing, {
                    asset_number: v
                  })),
                  testID: "fld-asset"
                }, void 0, false, {
                  fileName: _jsxFileName,
                  lineNumber: 170,
                  columnNumber: 19
                }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Dropdown.default, {
                  label: "TMV Type",
                  value: editing.tmv_type,
                  testID: "fld-tmv-type",
                  placeholder: "Select TMV type\u2026",
                  options: [{
                    value: 'Legacy',
                    label: 'Legacy'
                  }, {
                    value: 'Virtual',
                    label: 'Virtual'
                  }, {
                    value: 'Twinfrac',
                    label: 'Twinfrac'
                  }],
                  onChange: v => setEditing(Object.assign({}, editing, {
                    tmv_type: v
                  }))
                }, void 0, false, {
                  fileName: _jsxFileName,
                  lineNumber: 171,
                  columnNumber: 19
                }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Dropdown.default, {
                  label: "District",
                  value: editing.district_id,
                  options: districts.map(d => ({
                    value: d.id,
                    label: d.name
                  })),
                  onChange: v => setEditing(Object.assign({}, editing, {
                    district_id: v
                  })),
                  testID: "fld-tmv-district"
                }, void 0, false, {
                  fileName: _jsxFileName,
                  lineNumber: 183,
                  columnNumber: 19
                }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Field, {
                  label: "Last Known Location (placeholder)",
                  value: editing.last_known_location,
                  onChange: v => setEditing(Object.assign({}, editing, {
                    last_known_location: v
                  })),
                  testID: "fld-loc"
                }, void 0, false, {
                  fileName: _jsxFileName,
                  lineNumber: 186,
                  columnNumber: 19
                }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Field, {
                  label: "Notes",
                  value: editing.notes,
                  onChange: v => setEditing(Object.assign({}, editing, {
                    notes: v
                  })),
                  multi: true
                }, void 0, false, {
                  fileName: _jsxFileName,
                  lineNumber: 187,
                  columnNumber: 19
                }, this)]
              }, void 0, true), editing?._kind === 'equipment' && /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_reactJsxDevRuntime.Fragment, {
                children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Dropdown.default, {
                  label: "TMV",
                  value: editing.tmv_id,
                  options: tmvs.map(t => ({
                    value: t.id,
                    label: `${t.asset_number} · ${t.tmv_type}`
                  })),
                  onChange: v => setEditing(Object.assign({}, editing, {
                    tmv_id: v
                  })),
                  testID: "fld-eq-tmv",
                  searchable: true
                }, void 0, false, {
                  fileName: _jsxFileName,
                  lineNumber: 192,
                  columnNumber: 19
                }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Field, {
                  label: "Name",
                  value: editing.name,
                  onChange: v => setEditing(Object.assign({}, editing, {
                    name: v
                  })),
                  testID: "fld-eq-name"
                }, void 0, false, {
                  fileName: _jsxFileName,
                  lineNumber: 195,
                  columnNumber: 19
                }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Field, {
                  label: "Serial ID",
                  value: editing.serial_id,
                  onChange: v => setEditing(Object.assign({}, editing, {
                    serial_id: v
                  })),
                  testID: "fld-eq-serial"
                }, void 0, false, {
                  fileName: _jsxFileName,
                  lineNumber: 196,
                  columnNumber: 19
                }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Field, {
                  label: "Service ID",
                  value: editing.service_id,
                  onChange: v => setEditing(Object.assign({}, editing, {
                    service_id: v
                  })),
                  testID: "fld-eq-svc"
                }, void 0, false, {
                  fileName: _jsxFileName,
                  lineNumber: 197,
                  columnNumber: 19
                }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Dropdown.default, {
                  label: "Category",
                  value: editing.category,
                  options: ['Server', 'UPS', 'Network', 'AC', 'IoT', 'Sensor', 'Other'].map(v => ({
                    value: v,
                    label: v
                  })),
                  onChange: v => setEditing(Object.assign({}, editing, {
                    category: v
                  })),
                  testID: "fld-eq-cat"
                }, void 0, false, {
                  fileName: _jsxFileName,
                  lineNumber: 198,
                  columnNumber: 19
                }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Field, {
                  label: "Notes",
                  value: editing.notes,
                  onChange: v => setEditing(Object.assign({}, editing, {
                    notes: v
                  })),
                  multi: true
                }, void 0, false, {
                  fileName: _jsxFileName,
                  lineNumber: 201,
                  columnNumber: 19
                }, this)]
              }, void 0, true)]
            }, void 0, true, {
              fileName: _jsxFileName,
              lineNumber: 161,
              columnNumber: 13
            }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Pressable.default, {
              testID: "modal-save",
              onPress: save,
              style: styles.cta,
              children: /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
                style: styles.ctaTxt,
                children: "SAVE"
              }, void 0, false, {
                fileName: _jsxFileName,
                lineNumber: 206,
                columnNumber: 15
              }, this)
            }, void 0, false, {
              fileName: _jsxFileName,
              lineNumber: 205,
              columnNumber: 13
            }, this)]
          }, void 0, true, {
            fileName: _jsxFileName,
            lineNumber: 150,
            columnNumber: 11
          }, this)
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 149,
          columnNumber: 9
        }, this)
      }, void 0, false, {
        fileName: _jsxFileName,
        lineNumber: 148,
        columnNumber: 7
      }, this)]
    }, void 0, true, {
      fileName: _jsxFileName,
      lineNumber: 78,
      columnNumber: 5
    }, this);
  }
  _s(Manage, "e3AyBJMzkm/0GgI0OS5bus9UkFc=", false, function () {
    return [_expoRouter.useLocalSearchParams, _expoRouter.useFocusEffect];
  });
  _c = Manage;
  function Field({
    label,
    value,
    onChange,
    multi,
    testID
  }) {
    return /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
      style: {
        marginBottom: _srcTheme.theme.space.md
      },
      children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
        style: styles.flabel,
        children: label
      }, void 0, false, {
        fileName: _jsxFileName,
        lineNumber: 218,
        columnNumber: 7
      }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(TextInput.default, {
        testID: testID,
        value: value || '',
        onChangeText: onChange,
        placeholderTextColor: _srcTheme.theme.color.onSurface3,
        multiline: multi,
        style: [styles.finput, multi && {
          height: 80,
          textAlignVertical: 'top',
          paddingVertical: 8
        }]
      }, void 0, false, {
        fileName: _jsxFileName,
        lineNumber: 219,
        columnNumber: 7
      }, this)]
    }, void 0, true, {
      fileName: _jsxFileName,
      lineNumber: 217,
      columnNumber: 5
    }, this);
  }
  _c2 = Field;
  function typeBadgeBg(t) {
    return t === 'Twinfrac' ? '#FCE7EA' : t === 'Virtual' ? '#E0F2FE' : t === 'Legacy' ? '#FEF3C7' : '#EEF2F7';
  }
  function typeBadgeFg(t) {
    return t === 'Twinfrac' ? '#B7222B' : t === 'Virtual' ? '#0369A1' : t === 'Legacy' ? '#8A5A00' : '#64748B';
  }
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
    segRow: {
      flexDirection: 'row',
      margin: _srcTheme.theme.space.lg,
      marginTop: 0,
      backgroundColor: _srcTheme.theme.color.surface2,
      borderRadius: _srcTheme.theme.radius.md,
      borderWidth: 1,
      borderColor: _srcTheme.theme.color.border,
      padding: 4
    },
    seg: {
      flex: 1,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: _srcTheme.theme.radius.sm
    },
    segActive: {
      backgroundColor: _srcTheme.theme.color.brand
    },
    segTxt: {
      color: _srcTheme.theme.color.onSurface3,
      fontWeight: '800',
      fontSize: 11,
      letterSpacing: 1
    },
    segTxtActive: {
      color: _srcTheme.theme.color.onBrand
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: _srcTheme.theme.color.surface2,
      padding: _srcTheme.theme.space.md,
      borderRadius: _srcTheme.theme.radius.md,
      borderWidth: 1,
      borderColor: _srcTheme.theme.color.border,
      marginBottom: _srcTheme.theme.space.sm,
      gap: _srcTheme.theme.space.md
    },
    rowTitle: {
      color: _srcTheme.theme.color.onSurface,
      fontSize: _srcTheme.theme.font.lg,
      fontWeight: '700'
    },
    rowSub: {
      color: _srcTheme.theme.color.onSurface3,
      fontSize: _srcTheme.theme.font.sm,
      marginTop: 2
    },
    empty: {
      color: _srcTheme.theme.color.onSurface3,
      textAlign: 'center',
      marginTop: _srcTheme.theme.space.xl
    },
    modalWrap: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.7)'
    },
    modalCard: {
      backgroundColor: _srcTheme.theme.color.surface2,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      padding: _srcTheme.theme.space.lg,
      maxHeight: '90%'
    },
    modalHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: _srcTheme.theme.space.md
    },
    modalTitle: {
      color: _srcTheme.theme.color.onSurface,
      fontSize: _srcTheme.theme.font.xl,
      fontWeight: '800'
    },
    flabel: {
      color: _srcTheme.theme.color.onSurface2,
      fontSize: 11,
      letterSpacing: 0.8,
      fontWeight: '700',
      marginBottom: 6,
      textTransform: 'uppercase'
    },
    finput: {
      backgroundColor: _srcTheme.theme.color.surface3,
      borderColor: _srcTheme.theme.color.border,
      borderWidth: 1,
      borderRadius: _srcTheme.theme.radius.md,
      color: _srcTheme.theme.color.onSurface,
      height: 48,
      paddingHorizontal: _srcTheme.theme.space.md,
      fontSize: _srcTheme.theme.font.lg
    },
    cta: {
      height: 52,
      backgroundColor: _srcTheme.theme.color.brand,
      borderRadius: _srcTheme.theme.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: _srcTheme.theme.space.md
    },
    ctaTxt: {
      color: _srcTheme.theme.color.onBrand,
      fontWeight: '900',
      fontSize: _srcTheme.theme.font.lg,
      letterSpacing: 2
    },
    typeRow: {
      flexDirection: 'row',
      gap: _srcTheme.theme.space.sm,
      marginBottom: _srcTheme.theme.space.sm
    },
    typeBtn: {
      flex: 1,
      height: 44,
      borderRadius: _srcTheme.theme.radius.md,
      backgroundColor: _srcTheme.theme.color.surface3,
      borderWidth: 1,
      borderColor: _srcTheme.theme.color.border,
      alignItems: 'center',
      justifyContent: 'center'
    },
    typeBtnActive: {
      backgroundColor: _srcTheme.theme.color.brand,
      borderColor: _srcTheme.theme.color.brand
    },
    typeBtnTxt: {
      color: _srcTheme.theme.color.onSurface2,
      fontWeight: '800',
      letterSpacing: 1,
      fontSize: 11
    },
    typeBtnTxtActive: {
      color: _srcTheme.theme.color.onBrand
    },
    typeBadge: {
      borderRadius: _srcTheme.theme.radius.sm,
      paddingHorizontal: 8,
      paddingVertical: 3,
      alignSelf: 'flex-start',
      marginTop: 4
    },
    typeBadgeTxt: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.8
    }
  });
  var _c, _c2;
  $RefreshReg$(_c, "Manage");
  $RefreshReg$(_c2, "Field");
},832,[9,110,138,36,55,143,436,519,518,14,423,246,732,820,827,833,834,33],"app/(admin)/manage.tsx");