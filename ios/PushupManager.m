#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

// 이 파일은 Swift 클래스를 Objective-C에 노출시키는 역할을 합니다
@interface RCT_EXTERN_MODULE(PushupManager, RCTEventEmitter)

RCT_EXTERN_METHOD(startPushupSession)
RCT_EXTERN_METHOD(stopPushupSession)

@end
