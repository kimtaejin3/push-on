#import <React/RCTBridgeModule.h>

// 이 파일은 Swift 클래스를 Objective-C에 노출시키는 역할을 합니다
@interface RCT_EXTERN_MODULE(PushupManager, NSObject)

RCT_EXTERN_METHOD(startPushupSession)
RCT_EXTERN_METHOD(stopPushupSession)
RCT_EXTERN_METHOD(getPushupCount:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getIsGoingDown:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
