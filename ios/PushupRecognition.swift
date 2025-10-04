import ARKit
import UIKit

@objc(PushupRecognition)
class PushupRecognition: NSObject, ARSessionDelegate {

    @objc var pushupCount: Int = 0
    @objc var isGoingDown = false
    private let closeThreshold: Float = 0.25
    private let farThreshold: Float = 0.35
    
    func session(_ session: ARSession, didUpdate frame: ARFrame) {
        guard let faceAnchor = frame.anchors.first(where: { $0 is ARFaceAnchor }) as? ARFaceAnchor else { return }
        
        let cameraPos = SCNVector3(frame.camera.transform.columns.3.x,
                                  frame.camera.transform.columns.3.y,
                                  frame.camera.transform.columns.3.z)
        let facePos = SCNVector3(faceAnchor.transform.columns.3.x,
                                faceAnchor.transform.columns.3.y,
                                faceAnchor.transform.columns.3.z)
        
        let dx = cameraPos.x - facePos.x
        let dy = cameraPos.y - facePos.y
        let dz = cameraPos.z - facePos.z
        let distance = sqrt(dx*dx + dy*dy + dz*dz)
        
        print("거리: \(distance)")
        
        if distance < closeThreshold && !isGoingDown {
            isGoingDown = true
            print("푸쉬업 내려가는 중")
        }
        
        if distance > farThreshold && isGoingDown {
            pushupCount += 1
            isGoingDown = false
            print("푸쉬업 카운트 증가 → \(pushupCount)")
        }
    }
}
