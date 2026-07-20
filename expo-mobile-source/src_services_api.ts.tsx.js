// Source: src/services/api.ts
// Module ID: 820
// Extracted from Metro bundle (transpiled JS)

__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  "use strict";

  Object.defineProperty(exports, '__esModule', {
    value: true
  });
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
  function _interopDefault(e) {
    return e && e.__esModule ? e : {
      default: e
    };
  }
  Object.defineProperty(exports, "tokenStore", {
    enumerable: true,
    get: function () {
      return tokenStore;
    }
  });
  exports.api = api;
  var _expoVirtualEnv = require(_dependencyMap[0], "expo/virtual/env");
  var _expoSecureStore = require(_dependencyMap[1], "expo-secure-store");
  var SecureStore = _interopNamespace(_expoSecureStore);
  var _reactNativeWebDistExportsPlatform = require(_dependencyMap[2], "react-native-web/dist/exports/Platform");
  var Platform = _interopDefault(_reactNativeWebDistExportsPlatform);
  const KEY = 'tmv_auth_token';

  // SecureStore isn't available on web; fall back to localStorage.
  async function set(key, value) {
    if (Platform.default.OS === 'web') {
      try {
        localStorage.setItem(key, value);
      } catch {}
      return;
    }
    await SecureStore.setItemAsync(key, value);
  }
  async function get(key) {
    if (Platform.default.OS === 'web') {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    return SecureStore.getItemAsync(key);
  }
  async function del(key) {
    if (Platform.default.OS === 'web') {
      try {
        localStorage.removeItem(key);
      } catch {}
      return;
    }
    await SecureStore.deleteItemAsync(key);
  }
  const tokenStore = {
    save: t => set(KEY, t),
    get: () => get(KEY),
    clear: () => del(KEY)
  };
  const BASE = (_expoVirtualEnv.env.EXPO_PUBLIC_BACKEND_URL || '').replace(/\/$/, '');
  async function api(path, opts = {}) {
    const headers = {
      'Content-Type': 'application/json'
    };
    if (opts.auth !== false) {
      const token = await tokenStore.get();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${BASE}/api${path}`, {
      method: opts.method || 'GET',
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) {
      const detail = data && (data.detail || data.message) || `HTTP ${res.status}`;
      throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
    }
    return data;
  }
},820,[821,824,14],"src/services/api.ts");