// Source: src/context/AuthContext.tsx
// Module ID: 819
// Extracted from Metro bundle (transpiled JS)

__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  "use strict";

  var _jsxFileName = "/app/frontend/src/context/AuthContext.tsx",
    _s = $RefreshSig$(),
    _s2 = $RefreshSig$();
  Object.defineProperty(exports, '__esModule', {
    value: true
  });
  Object.defineProperty(exports, "AuthProvider", {
    enumerable: true,
    get: function () {
      return AuthProvider;
    }
  });
  exports.useAuth = useAuth;
  var _react = require(_dependencyMap[0], "react");
  var _servicesApi = require(_dependencyMap[1], "../services/api");
  var _reactJsxDevRuntime = require(_dependencyMap[2], "react/jsx-dev-runtime");
  const Ctx = /*#__PURE__*/(0, _react.createContext)(undefined);
  const AuthProvider = ({
    children
  }) => {
    _s();
    const [user, setUser] = (0, _react.useState)(null);
    const [loading, setLoading] = (0, _react.useState)(true);
    const bootstrap = (0, _react.useCallback)(async () => {
      try {
        const token = await _servicesApi.tokenStore.get();
        if (!token) {
          setUser(null);
          return;
        }
        const me = await (0, _servicesApi.api)('/auth/me');
        setUser(me);
      } catch {
        await _servicesApi.tokenStore.clear();
        setUser(null);
      } finally {
        setLoading(false);
      }
    }, []);
    (0, _react.useEffect)(() => {
      bootstrap();
    }, [bootstrap]);
    const login = async (identifier, password) => {
      const res = await (0, _servicesApi.api)('/auth/login', {
        method: 'POST',
        body: {
          identifier,
          password
        },
        auth: false
      });
      await _servicesApi.tokenStore.save(res.access_token);
      setUser(res.user);
      return res.user;
    };
    const logout = async () => {
      await _servicesApi.tokenStore.clear();
      setUser(null);
    };
    const refresh = async () => {
      const me = await (0, _servicesApi.api)('/auth/me');
      setUser(me);
    };
    return /*#__PURE__*/(0, _reactJsxDevRuntime.jsxDEV)(Ctx.Provider, {
      value: {
        user,
        loading,
        login,
        logout,
        refresh
      },
      children: children
    }, void 0, false, {
      fileName: _jsxFileName,
      lineNumber: 62,
      columnNumber: 10
    }, this);
  };
  _s(AuthProvider, "aJfXisOseWlBW1eXXmOTd+qNp9c=");
  _c = AuthProvider;
  function useAuth() {
    _s2();
    const ctx = (0, _react.useContext)(Ctx);
    if (!ctx) throw new Error('useAuth must be within AuthProvider');
    return ctx;
  }
  _s2(useAuth, "/dMy7t63NXD4eYACoT93CePwGrg=");
  var _c;
  $RefreshReg$(_c, "AuthProvider");
},819,[9,820,33],"src/context/AuthContext.tsx");