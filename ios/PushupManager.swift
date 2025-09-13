import Foundation
import ARKit
import UIKit

@objc(PushupManager)
class PushupManager: NSObject {

  private var pushupRecognition: PushupRecognition?
  private var arView: ARSCNView?
  private var backButton: UIButton?

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
      
      // Add back button
      let backButton = UIButton(type: .system)
      backButton.setTitle("뒤로가기", for: .normal)
      backButton.backgroundColor = UIColor.black.withAlphaComponent(0.5)
      backButton.setTitleColor(.white, for: .normal)
      backButton.layer.cornerRadius = 20
      backButton.frame = CGRect(x: 20, y: 40, width: 100, height: 40)
      backButton.addTarget(self, action: #selector(self.stopPushupSession), for: .touchUpInside)
      
      arView.addSubview(backButton)
      self.backButton = backButton
      
      // Add count display
      let countLabel = UILabel()
      countLabel.frame = CGRect(x: 0, y: 100, width: rootViewController.view.bounds.width, height: 60)
      countLabel.textAlignment = .center
      countLabel.font = UIFont.boldSystemFont(ofSize: 48)
      countLabel.textColor = .white
      countLabel.backgroundColor = UIColor.black.withAlphaComponent(0.3)
      countLabel.text = "0"
      countLabel.tag = 100 // Tag for identification
      
      arView.addSubview(countLabel)
      
      // Start updating count
      Timer.scheduledTimer(withTimeInterval: 0.5, repeats: true) { [weak self] timer in
        guard let self = self, let count = self.pushupRecognition?.pushupCount else {
          timer.invalidate()
          return
        }
        
        if let countLabel = self.arView?.viewWithTag(100) as? UILabel {
          countLabel.text = "\(count)"
        }
      }
      
      print("Pushup session started")
    }
  }

  @objc func stopPushupSession() {
    DispatchQueue.main.async {
      self.arView?.session.pause()
      self.arView?.removeFromSuperview()
      self.arView = nil
      self.backButton = nil
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
