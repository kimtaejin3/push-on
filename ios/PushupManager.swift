import Foundation
import ARKit
import UIKit

@objc(PushupManager)
class PushupManager: NSObject {

  private var pushupRecognition: PushupRecognition?
  private var arSession: ARSession?
  private var timer: Timer?

  @objc func startPushupSession() {
    DispatchQueue.main.async {
      // Create AR session (without view)
      let arSession = ARSession()
      
      // Configure AR session
      let configuration = ARFaceTrackingConfiguration()
      arSession.run(configuration)
      
      // Set up pushup recognition
      self.pushupRecognition = PushupRecognition()
      
      // Set up delegate for AR session
      arSession.delegate = self.pushupRecognition
      
      // Store session
      self.arSession = arSession
      
      print("Pushup session started in background")
    }
  }

  @objc func stopPushupSession() {
    DispatchQueue.main.async {
      self.arSession?.pause()
      self.arSession = nil
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

  @objc func getIsGoingDown() -> Bool {
    return pushupRecognition?.isGoingDown ?? false
  }
}
