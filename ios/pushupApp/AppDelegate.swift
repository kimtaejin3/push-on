import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import KakaoSDKCommon   // Kakao SDK 초기화용
import KakaoSDKAuth     // Kakao 로그인 처리용

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {

    // ✅ 1. Kakao SDK 초기화 (반드시 가장 먼저)
    KakaoSDK.initSDK(appKey: "6857d8aa2f0467a3366f37ea36f7260f") // 네이티브 앱 키

    // 2. React Native Delegate/Factory 초기화
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    // 3. UIWindow 생성 및 React Native 시작
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "pushupApp",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }

  // ✅ 4. 카카오 로그인 딥링크 처리
  func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
    if AuthApi.isKakaoTalkLoginUrl(url) {
      return AuthController.handleOpenUrl(url: url)
    }
    // 필요한 경우 다른 URL 처리 로직 추가 가능
    return false
  }
}

// ==============================
// React Native Delegate (기존 구조 그대로)
// ==============================
class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
