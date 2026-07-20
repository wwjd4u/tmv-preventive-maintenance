// Source: src/hooks/use-icon-fonts.ts
// Module ID: 844
// Extracted from Metro bundle (transpiled JS)

__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  "use strict";

  var _s = $RefreshSig$(); // Icon font loader for Expo apps. Fonts are loaded from a CDN only under
  // Expo Go (StoreClient) — that's where @expo/vector-icons' .ttf files come
  // back as 0 bytes from Metro's asset resolver on Android. Native dev/prod
  // builds and web pass an empty map, so useFonts resolves to [true, null]
  // immediately via react-native-vector-icons autolinking / web stubs.
  // ICON_VECTOR_VERSION must match @expo/vector-icons in package.json.
  // Usage: const [loaded, error] = useIconFonts();
  Object.defineProperty(exports, '__esModule', {
    value: true
  });
  function _interopDefault(e) {
    return e && e.__esModule ? e : {
      default: e
    };
  }
  Object.defineProperty(exports, "useIconFonts", {
    enumerable: true,
    get: function () {
      return useIconFonts;
    }
  });
  var _expoConstants = require(_dependencyMap[0], "expo-constants");
  var Constants = _interopDefault(_expoConstants);
  var _expoFont = require(_dependencyMap[1], "expo-font");
  const ICON_VECTOR_VERSION = "15.1.1";

  // short internal fontName (what the library queries) -> CDN .ttf file name
  const ICON_FAMILIES = {
    anticon: "AntDesign",
    entypo: "Entypo",
    evilicons: "EvilIcons",
    feather: "Feather",
    FontAwesome: "FontAwesome",
    Fontisto: "Fontisto",
    foundation: "Foundation",
    ionicons: "Ionicons",
    "material-community": "MaterialCommunityIcons",
    material: "MaterialIcons",
    octicons: "Octicons",
    "simple-line-icons": "SimpleLineIcons",
    zocial: "Zocial",
    // FontAwesome5 style variants (key = `FontAwesome5Free-<style>`)
    "FontAwesome5Free-Regular": "FontAwesome5_Regular",
    "FontAwesome5Free-Solid": "FontAwesome5_Solid",
    "FontAwesome5Free-Brand": "FontAwesome5_Brands",
    // FontAwesome6 style variants (key = `FontAwesome6Free-<style>`)
    "FontAwesome6Free-Regular": "FontAwesome6_Regular",
    "FontAwesome6Free-Solid": "FontAwesome6_Solid",
    "FontAwesome6Free-Brand": "FontAwesome6_Brands"
  };
  const cdnUrl = file => `https://cdn.jsdelivr.net/npm/@expo/vector-icons@${ICON_VECTOR_VERSION}/build/vendor/react-native-vector-icons/Fonts/${file}.ttf`;
  const iconFontMap = () => Object.fromEntries(Object.entries(ICON_FAMILIES).map(([key, file]) => [key, cdnUrl(file)]));
  const useIconFonts = () => {
    _s();
    return (0, _expoFont.useFonts)(Constants.default.executionEnvironment === _expoConstants.ExecutionEnvironment.StoreClient ? iconFontMap() : {});
  };
  _s(useIconFonts, "FH2KzKrVyzloOESO1LaD/NBSqH8=", false, function () {
    return [_expoFont.useFonts];
  });
},844,[636,735],"src/hooks/use-icon-fonts.ts");