import ARKit
import SceneKit
import UIKit

@objc(PushupRecognition)
class PushupRecognition: NSObject, ARSCNViewDelegate {

    var contentNode: SCNNode?
    private var textNode: SCNNode?
    @objc var pushupCount: Int = 0

    private var isGoingDown = false
    private let closeThreshold: Float = 0.25
    private let farThreshold: Float = 0.35

    func renderer(_ renderer: SCNSceneRenderer, nodeFor anchor: ARAnchor) -> SCNNode? {
        guard anchor is ARFaceAnchor else { return nil }
        let node = SCNNode()
        self.contentNode = node

        let textGeometry = SCNText(string: "0", extrusionDepth: 1.0)
        textGeometry.firstMaterial?.diffuse.contents = UIColor.systemGreen
        textGeometry.font = UIFont.boldSystemFont(ofSize: 10)

        let textNode = SCNNode(geometry: textGeometry)
        textNode.position = SCNVector3(0, 0.1, -0.5)
        textNode.scale = SCNVector3(0.01, 0.01, 0.01)
        node.addChildNode(textNode)
        self.textNode = textNode

        return node
    }

    func renderer(_ renderer: SCNSceneRenderer, didUpdate node: SCNNode, for anchor: ARAnchor) {
        guard let faceAnchor = anchor as? ARFaceAnchor,
              let sceneView = renderer as? ARSCNView,
              let frame = sceneView.session.currentFrame else { return }

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

        dump("카메라 위치: \(cameraPos)")
        dump("얼굴 위치: \(facePos)")
        dump("거리: \(distance)")

        if distance < closeThreshold && !isGoingDown {
            isGoingDown = true
            dump("푸쉬업 내려가는 중")
        }

        if distance > farThreshold && isGoingDown {
            pushupCount += 1
            isGoingDown = false
            updateCounter()
            dump("푸쉬업 카운트 증가 → \(pushupCount)")
        }
    }

    private func updateCounter() {
        guard let textGeometry = textNode?.geometry as? SCNText else { return }
        textGeometry.string = "\(pushupCount)"
    }
}
