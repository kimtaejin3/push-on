import Foundation
import ARKit

@objc(PushupManager)
class PushupManager: NSObject {

  private var pushupRecognition: PushupRecognition?
  private var arView: ARSCNView?

  @objc func startPushupSession() {
    DispatchQueue.main.async {
      guard let rootViewController = UIApplication.shared.windows.first?.rootViewController else {
        print("Could not find root view controller")
        return
      }
      
      // Create AR view
      let arView = ARSCNView(frame: rootViewController.view.bounds)
      arView.automaticallyUpdatesLighting = true
      
      // Configure AR session
      let configuration = ARFaceTrackingConfiguration()
      arView.session.run(configuration)
      
      // Set up pushup recognition
      self.pushupRecognition = PushupRecognition()
      arView.delegate = self.pushupRecognition
      
      // Add AR view to view hierarchy
      rootViewController.view.addSubview(arView)
      self.arView = arView
      
      print("Pushup session started")
    }
  }

  @objc func stopPushupSession() {
    DispatchQueue.main.async {
      self.arView?.session.pause()
      self.arView?.removeFromSuperview()
      self.arView = nil
      self.pushupRecognition = nil
      print("Pushup session stopped")
    }
  }

  @objc func getPushupCount(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    guard let count = pushupRecognition?.pushupCount else {
      reject("NO_SESSION", "Pushup session not started", nil)
      return
    }
    resolve(count)
  }
  
  // Required for React Native modules
  @objc static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
