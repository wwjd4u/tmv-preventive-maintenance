// Source: app/(admin)/new-ticket.tsx
// Module ID: 835
// Extracted from Metro bundle (transpiled JS)

__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  "use strict";

  var _jsxFileName = "/app/frontend/app/(admin)/new-ticket.tsx",
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
      return NewTicket;
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
  var _reactNativeSafeAreaContext = require(_dependencyMap[8], "react-native-safe-area-context");
  var _expoRouter = require(_dependencyMap[9], "expo-router");
  var _expoVectorIcons = require(_dependencyMap[10], "@expo/vector-icons");
  var _srcServicesApi = require(_dependencyMap[11], "@/src/services/api");
  var _srcTheme = require(_dependencyMap[12], "@/src/theme");
  var _srcComponentsDropdown = require(_dependencyMap[13], "@/src/components/Dropdown");
  var Dropdown = _interopDefault(_srcComponentsDropdown);
  var _srcComponentsToast = require(_dependencyMap[14], "@/src/components/Toast");
  var Toast = _interopDefault(_srcComponentsToast);
  var _reactJsxDevRuntime = require(_dependencyMap[15], "react/jsx-dev-runtime");
  function NewTicket() {
    _s();
    const router = (0, _expoRouter.useRouter)();
    const [title, setTitle] = (0, _react.useState)('Monthly PM inspection');
    const [tmvId, setTmvId] = (0, _react.useState)('');
    const [districtId, setDistrictId] = (0, _react.useState)('');
    const [assignee, setAssignee] = (0, _react.useState)('');
    const [priority, setPriority] = (0, _react.useState)('normal');
    const [interval, setInterval] = (0, _react.useState)('90_day');
    const [tmvs, setTmvs] = (0, _react.useState)([]);
    const [dists, setDists] = (0, _react.useState)([]);
    const [users, setUsers] = (0, _react.useState)([]);
    const [saving, setSaving] = (0, _react.useState)(false);
    const [err, setErr] = (0, _react.useState)(null);
    const load = (0, _react.useCallback)(async () => {
      const [t, d, u] = await Promise.all([(0, _srcServicesApi.api)('/tmvs'), (0, _srcServicesApi.api)('/districts'), (0, _srcServicesApi.api)('/auth/users')]);
      setTmvs(t);
      setDists(d);
      setUsers(u);
    }, []);
    React.default.useEffect(() => {
      load();
    }, [load]);
    const onSelectTMV = id => {
      setTmvId(id);
      const tmv = tmvs.find(x => x.id === id);
      if (tmv?.district_id) setDistrictId(tmv.district_id);
    };
    const submit = async () => {
      if (!title || !tmvId || !districtId) {
        setErr('Fill title, TMV and district');
        return;
      }
      setSaving(true);
      setErr(null);
      try {
        const t = await (0, _srcServicesApi.api)('/tickets', {
          method: 'POST',
          body: {
            title,
            tmv_id: tmvId,
            district_id: districtId,
            assigned_to: assignee || null,
            priority,
            interval,
            checklist_template: 'full'
          }
        });
        router.replace(`/ticket/${t.id}`);
      } catch (e) {
        setErr(e.message || 'Failed to create');
        setSaving(false);
      }
    };
    const techs = users.filter(u => u.role === 'technician');
    return /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_reactNativeSafeAreaContext.SafeAreaView, {
      style: styles.root,
      edges: ['top'],
      children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
        style: styles.header,
        children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Pressable.default, {
          onPress: () => router.back(),
          testID: "new-ticket-back",
          children: /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(_expoVectorIcons.MaterialCommunityIcons, {
            name: "arrow-left",
            size: 24,
            color: _srcTheme.theme.color.onSurface
          }, void 0, false, {
            fileName: _jsxFileName,
            lineNumber: 59,
            columnNumber: 11
          }, this)
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 58,
          columnNumber: 9
        }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
          style: styles.title,
          children: "NEW TICKET"
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 61,
          columnNumber: 9
        }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
          style: {
            width: 24
          }
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 62,
          columnNumber: 9
        }, this)]
      }, void 0, true, {
        fileName: _jsxFileName,
        lineNumber: 57,
        columnNumber: 7
      }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Toast.default, {
        message: err,
        type: "error",
        onHide: () => setErr(null)
      }, void 0, false, {
        fileName: _jsxFileName,
        lineNumber: 64,
        columnNumber: 7
      }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(ScrollView.default, {
        contentContainerStyle: {
          padding: _srcTheme.theme.space.lg
        },
        keyboardShouldPersistTaps: "handled",
        children: [/*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
          style: styles.label,
          children: "Title"
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 67,
          columnNumber: 9
        }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(TextInput.default, {
          testID: "new-ticket-title",
          value: title,
          onChangeText: setTitle,
          placeholder: "e.g. Monthly PM inspection",
          placeholderTextColor: _srcTheme.theme.color.onSurface3,
          style: styles.input
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 68,
          columnNumber: 9
        }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Dropdown.default, {
          label: "TMV Asset",
          value: tmvId,
          testID: "new-ticket-tmv",
          options: tmvs.map(t => ({
            value: t.id,
            label: t.asset_number
          })),
          onChange: onSelectTMV,
          searchable: true
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 76,
          columnNumber: 9
        }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Dropdown.default, {
          label: "District",
          value: districtId,
          testID: "new-ticket-district",
          options: dists.map(d => ({
            value: d.id,
            label: d.name,
            sub: d.region
          })),
          onChange: setDistrictId
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 88,
          columnNumber: 9
        }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Dropdown.default, {
          label: "Assign To",
          value: assignee,
          testID: "new-ticket-assignee",
          options: [{
            value: '',
            label: '— Unassigned —'
          }, ...techs.map(u => ({
            value: u.id,
            label: u.full_name,
            sub: `@${u.username}`
          }))],
          onChange: setAssignee
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 96,
          columnNumber: 9
        }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Dropdown.default, {
          label: "Priority",
          value: priority,
          testID: "new-ticket-priority",
          options: [{
            value: 'low',
            label: 'Low'
          }, {
            value: 'normal',
            label: 'Normal'
          }, {
            value: 'high',
            label: 'High'
          }],
          onChange: setPriority
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 106,
          columnNumber: 9
        }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Dropdown.default, {
          label: "Inspection Interval",
          value: interval,
          testID: "new-ticket-interval",
          options: [{
            value: '30_day',
            label: '30 Day'
          }, {
            value: '90_day',
            label: '90 Day'
          }, {
            value: '6_month',
            label: '6 Month'
          }, {
            value: 'yearly',
            label: 'Yearly'
          }],
          onChange: setInterval
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 118,
          columnNumber: 9
        }, this), /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Pressable.default, {
          testID: "new-ticket-submit",
          onPress: submit,
          disabled: saving,
          style: [styles.cta, saving && {
            opacity: 0.6
          }],
          children: saving ? /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(ActivityIndicator.default, {
            color: _srcTheme.theme.color.onBrand
          }, void 0, false, {
            fileName: _jsxFileName,
            lineNumber: 135,
            columnNumber: 21
          }, this) : /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
            style: styles.ctaTxt,
            children: "CREATE TICKET"
          }, void 0, false, {
            fileName: _jsxFileName,
            lineNumber: 135,
            columnNumber: 73
          }, this)
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 131,
          columnNumber: 9
        }, this)]
      }, void 0, true, {
        fileName: _jsxFileName,
        lineNumber: 66,
        columnNumber: 7
      }, this)]
    }, void 0, true, {
      fileName: _jsxFileName,
      lineNumber: 56,
      columnNumber: 5
    }, this);
  }
  _s(NewTicket, "Tegj6oCDk/hs85F0p0EskUYxU9I=", false, function () {
    return [_expoRouter.useRouter];
  });
  _c = NewTicket;
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
    title: {
      color: _srcTheme.theme.color.onSurface,
      fontSize: _srcTheme.theme.font.xl,
      fontWeight: '900',
      letterSpacing: 2
    },
    label: {
      color: _srcTheme.theme.color.onSurface2,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.8,
      marginBottom: 6,
      textTransform: 'uppercase'
    },
    input: {
      backgroundColor: _srcTheme.theme.color.surface3,
      borderColor: _srcTheme.theme.color.border,
      borderWidth: 1,
      borderRadius: _srcTheme.theme.radius.md,
      color: _srcTheme.theme.color.onSurface,
      height: 48,
      paddingHorizontal: _srcTheme.theme.space.md,
      marginBottom: _srcTheme.theme.space.md,
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
    }
  });
  var _c;
  $RefreshReg$(_c, "NewTicket");
},835,[9,110,138,36,55,143,436,513,423,246,732,820,827,833,834,33],"app/(admin)/new-ticket.tsx");