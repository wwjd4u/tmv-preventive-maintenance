// Source: src/components/StatusChip.tsx
// Module ID: 829
// Extracted from Metro bundle (transpiled JS)

__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  "use strict";

  var _jsxFileName = "/app/frontend/src/components/StatusChip.tsx";
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
      return StatusChip;
    }
  });
  require(_dependencyMap[0], "react");
  var _reactNativeWebDistExportsView = require(_dependencyMap[1], "react-native-web/dist/exports/View");
  var View = _interopDefault(_reactNativeWebDistExportsView);
  var _reactNativeWebDistExportsText = require(_dependencyMap[2], "react-native-web/dist/exports/Text");
  var Text = _interopDefault(_reactNativeWebDistExportsText);
  var _reactNativeWebDistExportsStyleSheet = require(_dependencyMap[3], "react-native-web/dist/exports/StyleSheet");
  var StyleSheet = _interopDefault(_reactNativeWebDistExportsStyleSheet);
  var _theme = require(_dependencyMap[4], "../theme");
  var _reactJsxDevRuntime = require(_dependencyMap[5], "react/jsx-dev-runtime");
  const COLORS = {
    assigned: {
      bg: '#E0F2FE',
      fg: '#0369A1',
      label: 'Assigned'
    },
    // blue
    in_progress: {
      bg: '#FEE4C2',
      fg: '#B45309',
      label: 'In Progress'
    },
    // amber
    completed: {
      bg: '#D1FADF',
      fg: '#166534',
      label: 'Completed'
    },
    // green
    high: {
      bg: '#FEE2E2',
      fg: '#B91C1C',
      label: 'High'
    },
    normal: {
      bg: '#E2E8F0',
      fg: '#475569',
      label: 'Normal'
    },
    low: {
      bg: '#F1F5F9',
      fg: '#64748B',
      label: 'Low'
    },
    admin: {
      bg: '#FCE7EA',
      fg: '#B7222B',
      label: 'ADMIN'
    },
    technician: {
      bg: '#E0F2FE',
      fg: '#0369A1',
      label: 'TECH'
    }
  };
  function StatusChip({
    value,
    size = 'md'
  }) {
    const c = COLORS[value] || {
      bg: _theme.theme.color.surface3,
      fg: _theme.theme.color.onSurface2,
      label: value
    };
    const pad = size === 'sm' ? {
      paddingHorizontal: 6,
      paddingVertical: 2
    } : {
      paddingHorizontal: 10,
      paddingVertical: 4
    };
    return /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(View.default, {
      style: [styles.chip, pad, {
        backgroundColor: c.bg
      }],
      children: /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Text.default, {
        style: [styles.txt, {
          color: c.fg,
          fontSize: size === 'sm' ? 10 : 11
        }],
        children: c.label
      }, void 0, false, {
        fileName: _jsxFileName,
        lineNumber: 21,
        columnNumber: 7
      }, this)
    }, void 0, false, {
      fileName: _jsxFileName,
      lineNumber: 20,
      columnNumber: 5
    }, this);
  }
  _c = StatusChip;
  const styles = StyleSheet.default.create({
    chip: {
      borderRadius: _theme.theme.radius.sm,
      alignSelf: 'flex-start'
    },
    txt: {
      fontWeight: '700',
      letterSpacing: 0.6
    }
  });
  var _c;
  $RefreshReg$(_c, "StatusChip");
},829,[9,110,138,55,827,33],"src/components/StatusChip.tsx");