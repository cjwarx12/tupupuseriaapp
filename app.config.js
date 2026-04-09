export default {
  expo: {
    name: "TuPupuseriaApp",
    slug: "tupupuseriaapp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#FDF6EE"
    },
    ios: {
      supportsTablet: true
    },
    android: {
      package: "com.cjwarx12.tupupuseriaapp",
      versionCode: 2,
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY
        }
      },
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON,
      adaptiveIcon: {
        backgroundColor: "#FDF6EE",
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png"
      },
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE"
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      [
        "expo-notifications",
        {
          icon: "./assets/icon.png",
          color: "#D4850A",
          sounds: []
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "0e8bb595-d919-426b-ba18-6d6717627795"
      }
    }
  }
};