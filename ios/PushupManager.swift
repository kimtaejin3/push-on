import Foundation
import ARKit
import UIKit

@objc(PushupManager)
class PushupManager: RCTEventEmitter {

  private var pushupRecognition: PushupRecognition?
  private var arSession: ARSession?

  override func supportedEvents() -> [String]! {
    return ["onPushupCount", "onPushupGoingDown"]
  }

  @objc func startPushupSession() {
    DispatchQueue.main.async {
      // Create AR session (without view)
      let arSession = ARSession()

      // Configure AR session
      let configuration = ARFaceTrackingConfiguration()
      arSession.run(configuration)

      // Set up pushup recognition
      let recognition = PushupRecognition()
      recognition.onPushupCount = { [weak self] count in
        self?.sendEvent(withName: "onPushupCount", body: ["count": count])
      }
      recognition.onGoingDown = { [weak self] isGoingDown in
        self?.sendEvent(withName: "onPushupGoingDown", body: ["isGoingDown": isGoingDown])
      }
      self.pushupRecognition = recognition

      // Set up delegate for AR session
      arSession.delegate = recognition

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

  // Required for React Native modules
  @objc override static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
