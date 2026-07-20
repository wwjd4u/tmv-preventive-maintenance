// Source: app/ticket/[id].tsx
// Module ID: 847
// Extracted from Metro bundle (transpiled JS)

__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  "use strict";

  var _jsxFileName = "/app/frontend/app/ticket/[id].tsx",
    _s = $RefreshSig$();
  Object.defineProperty(exports, '__esModule', {
    value: true
  });
  function _interopDefault(e) {
    return e && e.__esModule ? e : {
      default: e
    };
  }
  function _interopNamespace(e) {
    if (e && e.__esModule) return e;
    var n = {};
    if (e) Object.keys(e).forEach(function (k) {
      var d = Object.getOwnPropertyDescriptor(e, k);
      Object.defineProperty(n, k, d.get ? d : {
        enumerable: true,
        get: function () {
          return e[k];
        }
      });
    });
    n.default = e;
    return n;
  }
  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function () {
      return TicketDetail;
    }
  });
  var _react = require(_dependencyMap[0], "react");
  var React = _interopDefault(_react);
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
  var _reactNativeWebDistExportsActivityIndicator = require(_dependencyMap[7], "react-native-web/dist/exports/ActivityIndicator");
  var ActivityIndicator = _interopDefault(_reactNativeWebDistExportsActivityIndicator);
  var _reactNativeWebDistExportsImage = require(_dependencyMap[8], "react-native-web/dist/exports/Image");
  var Image = _interopDefault(_reactNativeWebDistExportsImage);
  var _reactNativeWebDistExportsKeyboardAvoidingView = require(_dependencyMap[9], "react-native-web/dist/exports/KeyboardAvoidingView");
  var KeyboardAvoidingView = _interopDefault(_reactNativeWebDistExportsKeyboardAvoidingView);
  var _reactNativeWebDistExportsPlatform = require(_dependencyMap[10], "react-native-web/dist/exports/Platform");
  var Platform = _interopDefault(_reactNativeWebDistExportsPlatform);
  var _reactNativeSafeAreaContext = require(_dependencyMap[11], "react-native-safe-area-context");
  var _expoRouter = require(_dependencyMap[12], "expo-router");
  var _expoVectorIcons = require(_dependencyMap[13], "@expo/vector-icons");
  var _expoImagePicker = require(_dependencyMap[14], "expo-image-picker");
  var ImagePicker = _interopNamespace(_expoImagePicker);
  var _srcServicesApi = require(_dependencyMap[15], "@/src/services/api");
  var _srcContextAuthContext = require(_dependencyMap[16], "@/src/context/AuthContext");
  var _srcTheme = require(_dependencyMap[17], "@/src/theme");
  var _srcComponentsStatusChip = require(_dependencyMap[18], "@/src/components/StatusChip");
  var StatusChip = _interopDefault(_srcComponentsStatusChip);
  var _srcComponentsToast = require(_dependencyMap[19], "@/src/components/Toast");
  var Toast = _interopDefault(_srcComponentsToast);
  var _reactJsxDevRuntime = require(_dependencyMap[20], "react/jsx-dev-runtime");
  function TicketDetail() {
    _s();
    const {
      id
    } = (0, _expoRouter.useLocalSearchParams)();
    const router = (0, _expoRouter.useRouter)();
    const {
      user
    } = (0, _srcContextAuthContext.useAuth)();
    const [ticket, setTicket] = (0, _react.useState)(null);
    const [tmv, setTmv] = (0, _react.useState)(null);
    const [district, setDistrict] = (0, _react.useState)(null);
    const [equipment, setEquipment] = (0, _react.useState)([]);
    const [loading, setLoading] = (0, _react.useState)(true);
    const [saving, setSaving] = (0, _react.useState)(false);
    const [toast, setToast] = (0, _react.useState)(null);
    const [activeSection, setActiveSection] = (0, _react.useState)('');
    const load = (0, _react.useCallback)(async () => {
      if (!id) return;
      try {
        const t = await (0, _srcServicesApi.api)(`/tickets/${id}`);
        setTicket(t);
        const [tmvs, ds, eq] = await Promise.all([(0, _srcServicesApi.api)('/tmvs'), (0, _srcServicesApi.api)('/districts'), (0, _srcServicesApi.api)(`/equipment?tmv_id=${t.tmv_id}`)]);
        setTmv(tmvs.find(x => x.id === t.tmv_id));
        setDistrict(ds.find(x => x.id === t.district_id));
        setEquipment(eq);
        if (t.checklist[0]) setActiveSection(t.checklist[0].section);
      } catch (e) {
        setToast({
          msg: e.message || 'Failed to load',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    }, [id]);
    (0, _react.useEffect)(() => {
      load();
    }, [load]);
    const sections = (0, _react.useMemo)(() => {
      if (!ticket) return [];
      const seen = [];
      ticket.checklist.forEach(c => {
        if (!seen.includes(c.section)) seen.push(c.section);
      });
      return seen;
    }, [ticket]);
    const completeCount = (0, _react.useMemo)(() => {
      if (!ticket) return 0;
      return ticket.checklist.filter(c => c.response != null && c.response !== '').length;
    }, [ticket]);
    const progress = ticket ? completeCount / Math.max(1, ticket.checklist.length) : 0;

    // Grouped list keyed by section (built above the loading guard to keep hook order stable)
    const grouped = (0, _react.useMemo)(() => {
      const map = {};
      (ticket?.checklist || []).forEach(c => {
        (map[c.section] ||= []).push(c);
      });
      return Object.entries(map).map(([section, items]) => ({
        section,
        items
      }));
    }, [ticket]);

    // Refs for section anchors (for jump-to on chip tap)
    const sectionOffsets = React.default.useRef({});
    const scrollRef = React.default.useRef(null);
    const jumpTo = s => {
      setActiveSection(s);
      const y = sectionOffsets.current[s];
      if (typeof y === 'number' && scrollRef.current) {
        scrollRef.current.scrollTo({
          y: Math.max(0, y - 8),
          animated: true
        });
      }
    };
    const updateItem = (key, patch) => {
      if (!ticket) return;
      setTicket(Object.assign({}, ticket, {
        checklist: ticket.checklist.map(c => c.key === key ? Object.assign({}, c, patch) : c)
      }));
    };
    const pickPhoto = async (key, which) => {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setToast({
          msg: 'Photo permission needed',
          type: 'error'
        });
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        base64: true,
        quality: 0.5
      });
      if (res.canceled || !res.assets?.[0]?.base64) return;
      const b64 = `data:image/jpeg;base64,${res.assets[0].base64}`;
      updateItem(key, which === 'before' ? {
        photo_before: b64
      } : {
        photo_after: b64
      });
    };
    const saveTicket = async statusOverride => {
      if (!ticket) return;
      setSaving(true);
      try {
        const updated = await (0, _srcServicesApi.api)(`/tickets/${ticket.id}`, {
          method: 'PUT',
          body: {
            checklist: ticket.checklist,
            status: statusOverride ?? (ticket.status === 'assigned' ? 'in_progress' : ticket.status)
          }
        });
        setTicket(updated);
        setToast({
          msg: statusOverride === 'completed' ? 'Ticket completed' : 'Progress saved',
          type: 'success'
        });
      } catch (e) {
        setToast({
          msg: e.message || 'Save failed',
          type: 'error'
        });
      } finally {
        setSaving(false);
      }
    };
    if (loading || !ticket) {
      return /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_reactNativeSafeAreaContext.SafeAreaView, {
        style: styles.root,
        children: /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(ActivityIndicator.default, {
          style: {
            marginTop: 40
          },
          color: _srcTheme.theme.color.brand
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 127,
          columnNumber: 9
        }, this)
      }, void 0, false, {
        fileName: _jsxFileName,
        lineNumber: 126,
        columnNumber: 7
      }, this);
    }
    const readOnly = ticket.status === 'completed';
    return /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_reactNativeSafeAreaContext.SafeAreaView, {
      style: styles.root,
      edges: ['top'],
      children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
        style: styles.header,
        children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Pressable.default, {
          onPress: () => router.back(),
          testID: "ticket-back",
          hitSlop: 12,
          children: /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_expoVectorIcons.MaterialCommunityIcons, {
            name: "arrow-left",
            size: 24,
            color: _srcTheme.theme.color.onSurface
          }, void 0, false, {
            fileName: _jsxFileName,
            lineNumber: 138,
            columnNumber: 11
          }, this)
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 137,
          columnNumber: 9
        }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
          style: {
            flex: 1,
            marginHorizontal: _srcTheme.theme.space.md
          },
          children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
            numberOfLines: 1,
            style: styles.hTitle,
            children: ticket.title
          }, void 0, false, {
            fileName: _jsxFileName,
            lineNumber: 141,
            columnNumber: 11
          }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
            numberOfLines: 1,
            style: styles.hSub,
            children: [tmv ? `${tmv.asset_number} · ${tmv.tmv_type}` : '—', " ", district ? `· ${district.name}` : '']
          }, void 0, true, {
            fileName: _jsxFileName,
            lineNumber: 142,
            columnNumber: 11
          }, this)]
        }, void 0, true, {
          fileName: _jsxFileName,
          lineNumber: 140,
          columnNumber: 9
        }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(StatusChip.default, {
          value: ticket.status,
          size: "sm"
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 146,
          columnNumber: 9
        }, this)]
      }, void 0, true, {
        fileName: _jsxFileName,
        lineNumber: 136,
        columnNumber: 7
      }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Toast.default, {
        message: toast?.msg || null,
        type: toast?.type,
        onHide: () => setToast(null)
      }, void 0, false, {
        fileName: _jsxFileName,
        lineNumber: 149,
        columnNumber: 7
      }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
        style: styles.progressWrap,
        children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
          style: styles.progressBar,
          children: /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
            style: [styles.progressFill, {
              width: `${Math.round(progress * 100)}%`
            }]
          }, void 0, false, {
            fileName: _jsxFileName,
            lineNumber: 153,
            columnNumber: 11
          }, this)
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 152,
          columnNumber: 9
        }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
          style: styles.progressTxt,
          children: [completeCount, "/", ticket.checklist.length]
        }, void 0, true, {
          fileName: _jsxFileName,
          lineNumber: 155,
          columnNumber: 9
        }, this)]
      }, void 0, true, {
        fileName: _jsxFileName,
        lineNumber: 151,
        columnNumber: 7
      }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(ScrollView.default, {
        horizontal: true,
        showsHorizontalScrollIndicator: false,
        contentContainerStyle: styles.chipsRow,
        style: {
          maxHeight: 56
        },
        children: sections.map(s => {
          const active = s === activeSection;
          return /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Pressable.default, {
            testID: `section-${s}`,
            onPress: () => jumpTo(s),
            style: [styles.chip, active && styles.chipActive],
            children: /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
              style: [styles.chipTxt, active && styles.chipTxtActive],
              children: s
            }, void 0, false, {
              fileName: _jsxFileName,
              lineNumber: 169,
              columnNumber: 15
            }, this)
          }, s, false, {
            fileName: _jsxFileName,
            lineNumber: 164,
            columnNumber: 13
          }, this);
        })
      }, void 0, false, {
        fileName: _jsxFileName,
        lineNumber: 158,
        columnNumber: 7
      }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(KeyboardAvoidingView.default, {
        behavior: Platform.default.OS === 'ios' ? 'padding' : undefined,
        style: {
          flex: 1
        },
        children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(ScrollView.default, {
          ref: scrollRef,
          contentContainerStyle: {
            padding: _srcTheme.theme.space.lg,
            paddingBottom: 140
          },
          keyboardShouldPersistTaps: "handled",
          children: [equipment.length > 0 && /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
            style: styles.eqBlock,
            children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
              style: styles.eqTitle,
              children: ["ASSOCIATED EQUIPMENT \xB7 ", equipment.length]
            }, void 0, true, {
              fileName: _jsxFileName,
              lineNumber: 183,
              columnNumber: 15
            }, this), equipment.map(e => /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
              style: styles.eqRow,
              children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
                style: styles.eqName,
                children: [e.name, " ", /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
                  style: styles.eqCat,
                  children: ["\xB7 ", e.category]
                }, void 0, true, {
                  fileName: _jsxFileName,
                  lineNumber: 186,
                  columnNumber: 56
                }, this)]
              }, void 0, true, {
                fileName: _jsxFileName,
                lineNumber: 186,
                columnNumber: 19
              }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
                style: styles.eqIds,
                children: ["S/N ", e.serial_id, "  \xB7  SVC ", e.service_id]
              }, void 0, true, {
                fileName: _jsxFileName,
                lineNumber: 187,
                columnNumber: 19
              }, this)]
            }, e.id, true, {
              fileName: _jsxFileName,
              lineNumber: 185,
              columnNumber: 17
            }, this))]
          }, void 0, true, {
            fileName: _jsxFileName,
            lineNumber: 182,
            columnNumber: 13
          }, this), grouped.map(({
            section,
            items
          }) => /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
            onLayout: e => {
              sectionOffsets.current[section] = e.nativeEvent.layout.y;
            },
            children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
              style: styles.sectionHeader,
              children: section.toUpperCase()
            }, void 0, false, {
              fileName: _jsxFileName,
              lineNumber: 197,
              columnNumber: 15
            }, this), items.map(item => /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
              style: styles.itemCard,
              children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
                style: styles.itemLabel,
                children: item.label
              }, void 0, false, {
                fileName: _jsxFileName,
                lineNumber: 200,
                columnNumber: 15
              }, this), !!item.description && /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
                style: styles.itemDesc,
                children: item.description
              }, void 0, false, {
                fileName: _jsxFileName,
                lineNumber: 201,
                columnNumber: 38
              }, this), (item.input_type === 'pass_fail' || item.input_type === 'yes_no' || item.input_type === 'choice') && /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
                style: styles.segWrap,
                children: (item.input_type === 'pass_fail' ? ['pass', 'fail', 'na'] : item.input_type === 'yes_no' ? ['yes', 'no', 'na'] : item.choices).map(opt => {
                  const sel = item.response === opt;
                  const good = opt === 'pass' || opt === 'yes';
                  const bad = opt === 'fail' || opt === 'no';
                  const bg = sel ? good ? _srcTheme.theme.color.success : bad ? _srcTheme.theme.color.error : _srcTheme.theme.color.brand : _srcTheme.theme.color.surface3;
                  const fg = sel ? good ? '#00331A' : bad ? '#4D0000' : _srcTheme.theme.color.onBrand : _srcTheme.theme.color.onSurface2;
                  return /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Pressable.default, {
                    testID: `opt-${item.key}-${opt}`,
                    disabled: readOnly,
                    onPress: () => updateItem(item.key, {
                      response: opt
                    }),
                    style: [styles.segOpt, {
                      backgroundColor: bg,
                      borderColor: sel ? bg : _srcTheme.theme.color.border
                    }],
                    children: /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
                      style: [styles.segOptTxt, {
                        color: fg
                      }],
                      children: opt.toUpperCase()
                    }, void 0, false, {
                      fileName: _jsxFileName,
                      lineNumber: 221,
                      columnNumber: 25
                    }, this)
                  }, opt, false, {
                    fileName: _jsxFileName,
                    lineNumber: 215,
                    columnNumber: 23
                  }, this);
                })
              }, void 0, false, {
                fileName: _jsxFileName,
                lineNumber: 204,
                columnNumber: 17
              }, this), item.input_type === 'text' && /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(TextInput.default, {
                testID: `txt-${item.key}`,
                editable: !readOnly,
                value: item.response || '',
                onChangeText: v => updateItem(item.key, {
                  response: v
                }),
                placeholder: "Enter response\u2026",
                placeholderTextColor: _srcTheme.theme.color.onSurface3,
                style: styles.textInput
              }, void 0, false, {
                fileName: _jsxFileName,
                lineNumber: 229,
                columnNumber: 17
              }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(TextInput.default, {
                testID: `notes-${item.key}`,
                editable: !readOnly,
                value: item.notes,
                onChangeText: v => updateItem(item.key, {
                  notes: v
                }),
                placeholder: "Notes / observations\u2026",
                placeholderTextColor: _srcTheme.theme.color.onSurface3,
                multiline: true,
                style: [styles.textInput, {
                  height: 70,
                  textAlignVertical: 'top',
                  paddingVertical: 8
                }]
              }, void 0, false, {
                fileName: _jsxFileName,
                lineNumber: 240,
                columnNumber: 15
              }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
                style: styles.photoRow,
                children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(PhotoSlot, {
                  label: "BEFORE",
                  uri: item.photo_before,
                  onPress: () => !readOnly && pickPhoto(item.key, 'before'),
                  onClear: () => updateItem(item.key, {
                    photo_before: ''
                  }),
                  readOnly: readOnly,
                  testID: `photo-before-${item.key}`
                }, void 0, false, {
                  fileName: _jsxFileName,
                  lineNumber: 252,
                  columnNumber: 17
                }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(PhotoSlot, {
                  label: "AFTER",
                  uri: item.photo_after,
                  onPress: () => !readOnly && pickPhoto(item.key, 'after'),
                  onClear: () => updateItem(item.key, {
                    photo_after: ''
                  }),
                  readOnly: readOnly,
                  testID: `photo-after-${item.key}`
                }, void 0, false, {
                  fileName: _jsxFileName,
                  lineNumber: 259,
                  columnNumber: 17
                }, this)]
              }, void 0, true, {
                fileName: _jsxFileName,
                lineNumber: 251,
                columnNumber: 15
              }, this)]
            }, item.key, true, {
              fileName: _jsxFileName,
              lineNumber: 199,
              columnNumber: 13
            }, this))]
          }, section, true, {
            fileName: _jsxFileName,
            lineNumber: 194,
            columnNumber: 13
          }, this))]
        }, void 0, true, {
          fileName: _jsxFileName,
          lineNumber: 176,
          columnNumber: 9
        }, this), !readOnly && /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
          style: styles.bottomBar,
          children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Pressable.default, {
            testID: "save-progress-btn",
            onPress: () => saveTicket(),
            disabled: saving,
            style: [styles.saveBtn, saving && {
              opacity: 0.6
            }],
            children: saving ? /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(ActivityIndicator.default, {
              color: _srcTheme.theme.color.onSurface
            }, void 0, false, {
              fileName: _jsxFileName,
              lineNumber: 277,
              columnNumber: 25
            }, this) : /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
              style: styles.saveTxt,
              children: "SAVE"
            }, void 0, false, {
              fileName: _jsxFileName,
              lineNumber: 278,
              columnNumber: 19
            }, this)
          }, void 0, false, {
            fileName: _jsxFileName,
            lineNumber: 275,
            columnNumber: 13
          }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Pressable.default, {
            testID: "complete-btn",
            onPress: () => saveTicket('completed'),
            disabled: saving,
            style: [styles.completeBtn, saving && {
              opacity: 0.6
            }],
            children: /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
              style: styles.completeTxt,
              children: "COMPLETE"
            }, void 0, false, {
              fileName: _jsxFileName,
              lineNumber: 282,
              columnNumber: 15
            }, this)
          }, void 0, false, {
            fileName: _jsxFileName,
            lineNumber: 280,
            columnNumber: 13
          }, this)]
        }, void 0, true, {
          fileName: _jsxFileName,
          lineNumber: 274,
          columnNumber: 11
        }, this)]
      }, void 0, true, {
        fileName: _jsxFileName,
        lineNumber: 175,
        columnNumber: 7
      }, this)]
    }, void 0, true, {
      fileName: _jsxFileName,
      lineNumber: 135,
      columnNumber: 5
    }, this);
  }
  _s(TicketDetail, "4xZIVGJHPhdjY9QhFAorIigaUdQ=", false, function () {
    return [_expoRouter.useLocalSearchParams, _expoRouter.useRouter, _srcContextAuthContext.useAuth];
  });
  _c = TicketDetail;
  function PhotoSlot({
    label,
    uri,
    onPress,
    onClear,
    readOnly,
    testID
  }) {
    return /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
      style: {
        flex: 1
      },
      children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
        style: styles.photoLabel,
        children: label
      }, void 0, false, {
        fileName: _jsxFileName,
        lineNumber: 294,
        columnNumber: 7
      }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Pressable.default, {
        testID: testID,
        onPress: onPress,
        disabled: readOnly && !uri,
        style: styles.photoSlot,
        children: uri ? /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_reactJsxDevRuntime.Fragment, {
          children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Image.default, {
            source: {
              uri
            },
            style: styles.photoImg
          }, void 0, false, {
            fileName: _jsxFileName,
            lineNumber: 298,
            columnNumber: 13
          }, this), !readOnly && /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Pressable.default, {
            onPress: onClear,
            style: styles.photoX,
            hitSlop: 8,
            children: /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_expoVectorIcons.MaterialCommunityIcons, {
              name: "close-circle",
              size: 20,
              color: _srcTheme.theme.color.error
            }, void 0, false, {
              fileName: _jsxFileName,
              lineNumber: 301,
              columnNumber: 17
            }, this)
          }, void 0, false, {
            fileName: _jsxFileName,
            lineNumber: 300,
            columnNumber: 15
          }, this)]
        }, void 0, true) : /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
          style: styles.photoEmpty,
          children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_expoVectorIcons.MaterialCommunityIcons, {
            name: "camera-plus-outline",
            size: 26,
            color: _srcTheme.theme.color.onSurface3
          }, void 0, false, {
            fileName: _jsxFileName,
            lineNumber: 307,
            columnNumber: 13
          }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
            style: styles.photoEmptyTxt,
            children: "ADD PHOTO"
          }, void 0, false, {
            fileName: _jsxFileName,
            lineNumber: 308,
            columnNumber: 13
          }, this)]
        }, void 0, true, {
          fileName: _jsxFileName,
          lineNumber: 306,
          columnNumber: 11
        }, this)
      }, void 0, false, {
        fileName: _jsxFileName,
        lineNumber: 295,
        columnNumber: 7
      }, this)]
    }, void 0, true, {
      fileName: _jsxFileName,
      lineNumber: 293,
      columnNumber: 5
    }, this);
  }
  _c2 = PhotoSlot;
  const styles = StyleSheet.default.create({
    root: {
      flex: 1,
      backgroundColor: _srcTheme.theme.color.surface
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: _srcTheme.theme.space.lg,
      paddingVertical: _srcTheme.theme.space.md,
      borderBottomWidth: 1,
      borderBottomColor: _srcTheme.theme.color.divider
    },
    hTitle: {
      color: _srcTheme.theme.color.onSurface,
      fontSize: _srcTheme.theme.font.lg,
      fontWeight: '800'
    },
    hSub: {
      color: _srcTheme.theme.color.onSurface3,
      fontSize: _srcTheme.theme.font.sm,
      marginTop: 2
    },
    progressWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: _srcTheme.theme.space.md,
      paddingHorizontal: _srcTheme.theme.space.lg,
      paddingTop: _srcTheme.theme.space.md
    },
    progressBar: {
      flex: 1,
      height: 6,
      backgroundColor: _srcTheme.theme.color.surface3,
      borderRadius: 3,
      overflow: 'hidden'
    },
    progressFill: {
      height: '100%',
      backgroundColor: _srcTheme.theme.color.brand
    },
    progressTxt: {
      color: _srcTheme.theme.color.onSurface2,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1
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
    eqBlock: {
      backgroundColor: _srcTheme.theme.color.surface2,
      borderRadius: _srcTheme.theme.radius.md,
      borderWidth: 1,
      borderColor: _srcTheme.theme.color.border,
      padding: _srcTheme.theme.space.md,
      marginBottom: _srcTheme.theme.space.md
    },
    eqTitle: {
      color: _srcTheme.theme.color.brand,
      fontSize: 10,
      letterSpacing: 1.5,
      fontWeight: '800',
      marginBottom: 6
    },
    eqRow: {
      borderTopWidth: 1,
      borderTopColor: _srcTheme.theme.color.divider,
      paddingVertical: 6
    },
    eqName: {
      color: _srcTheme.theme.color.onSurface,
      fontWeight: '600',
      fontSize: _srcTheme.theme.font.base
    },
    eqCat: {
      color: _srcTheme.theme.color.onSurface3,
      fontWeight: '400'
    },
    eqIds: {
      color: _srcTheme.theme.color.onSurface3,
      fontSize: _srcTheme.theme.font.sm,
      fontFamily: 'monospace',
      marginTop: 2
    },
    itemCard: {
      backgroundColor: _srcTheme.theme.color.surface2,
      borderRadius: _srcTheme.theme.radius.md,
      borderWidth: 1,
      borderColor: _srcTheme.theme.color.border,
      padding: _srcTheme.theme.space.md,
      marginBottom: _srcTheme.theme.space.md
    },
    sectionHeader: {
      color: _srcTheme.theme.color.brand,
      fontSize: 12,
      fontWeight: '900',
      letterSpacing: 2,
      marginTop: _srcTheme.theme.space.md,
      marginBottom: _srcTheme.theme.space.sm,
      paddingBottom: 4,
      borderBottomWidth: 2,
      borderBottomColor: _srcTheme.theme.color.brand
    },
    itemLabel: {
      color: _srcTheme.theme.color.onSurface,
      fontSize: _srcTheme.theme.font.lg,
      fontWeight: '700'
    },
    itemDesc: {
      color: _srcTheme.theme.color.onSurface3,
      fontSize: _srcTheme.theme.font.sm,
      marginTop: 4,
      lineHeight: 18
    },
    segWrap: {
      flexDirection: 'row',
      gap: _srcTheme.theme.space.sm,
      marginTop: _srcTheme.theme.space.md,
      flexWrap: 'wrap'
    },
    segOpt: {
      flex: 1,
      minWidth: 70,
      height: 44,
      borderRadius: _srcTheme.theme.radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1
    },
    segOptTxt: {
      fontWeight: '800',
      letterSpacing: 1,
      fontSize: 11
    },
    textInput: {
      marginTop: _srcTheme.theme.space.md,
      backgroundColor: _srcTheme.theme.color.surface3,
      borderColor: _srcTheme.theme.color.border,
      borderWidth: 1,
      borderRadius: _srcTheme.theme.radius.md,
      color: _srcTheme.theme.color.onSurface,
      minHeight: 44,
      paddingHorizontal: _srcTheme.theme.space.md,
      fontSize: _srcTheme.theme.font.base
    },
    photoRow: {
      flexDirection: 'row',
      gap: _srcTheme.theme.space.sm,
      marginTop: _srcTheme.theme.space.md
    },
    photoLabel: {
      color: _srcTheme.theme.color.onSurface3,
      fontSize: 10,
      letterSpacing: 1.5,
      fontWeight: '800',
      marginBottom: 4
    },
    photoSlot: {
      height: 100,
      borderRadius: _srcTheme.theme.radius.md,
      backgroundColor: _srcTheme.theme.color.surface3,
      borderWidth: 1,
      borderColor: _srcTheme.theme.color.border,
      overflow: 'hidden'
    },
    photoEmpty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4
    },
    photoEmptyTxt: {
      color: _srcTheme.theme.color.onSurface3,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1
    },
    photoImg: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover'
    },
    photoX: {
      position: 'absolute',
      top: 4,
      right: 4,
      backgroundColor: _srcTheme.theme.color.surface,
      borderRadius: 12
    },
    bottomBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: 'row',
      gap: _srcTheme.theme.space.sm,
      padding: _srcTheme.theme.space.md,
      paddingBottom: _srcTheme.theme.space.lg,
      backgroundColor: _srcTheme.theme.color.surface2,
      borderTopWidth: 1,
      borderTopColor: _srcTheme.theme.color.border
    },
    saveBtn: {
      flex: 1,
      height: 52,
      backgroundColor: _srcTheme.theme.color.surface3,
      borderRadius: _srcTheme.theme.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: _srcTheme.theme.color.border
    },
    saveTxt: {
      color: _srcTheme.theme.color.onSurface,
      fontWeight: '800',
      letterSpacing: 1.5
    },
    completeBtn: {
      flex: 1.4,
      height: 52,
      backgroundColor: _srcTheme.theme.color.brand,
      borderRadius: _srcTheme.theme.radius.md,
      alignItems: 'center',
      justifyContent: 'center'
    },
    completeTxt: {
      color: _srcTheme.theme.color.onBrand,
      fontWeight: '900',
      letterSpacing: 1.5
    }
  });
  var _c, _c2;
  $RefreshReg$(_c, "TicketDetail");
  $RefreshReg$(_c2, "PhotoSlot");
},847,[9,110,138,36,55,143,436,513,155,518,14,423,246,732,848,820,819,827,829,834,33],"app/ticket/[id].tsx");