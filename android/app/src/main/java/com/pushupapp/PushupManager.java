package com.pushupapp;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class PushupManager extends ReactContextBaseJavaModule {
    private static final String TAG = "PushupManager";
    private AugmentedFacesActivity arActivity;
    private ReactApplicationContext reactContext;

    public PushupManager(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "PushupManager";
    }

    @ReactMethod
    public void startPushupSession() {
        android.util.Log.d(TAG, "🚀 React Native에서 startPushupSession() 호출됨");
        android.util.Log.d(TAG, "📱 reactContext: " + reactContext);
        android.util.Log.d(TAG, "📱 getCurrentActivity: " + reactContext.getCurrentActivity());
        
        try {
            if (arActivity == null) {
                android.util.Log.d(TAG, "📱 AugmentedFacesActivity 인스턴스 생성");
                arActivity = new AugmentedFacesActivity(reactContext);
                android.util.Log.d(TAG, "📱 AugmentedFacesActivity 인스턴스 생성 완료");
            }
            
            android.util.Log.d(TAG, "📱 arActivity.startSession() 호출 시작");
            arActivity.startSession();
            android.util.Log.d(TAG, "✅ startPushupSession() 완료");
        } catch (Exception e) {
            android.util.Log.e(TAG, "❌ Failed to start pushup session", e);
            e.printStackTrace();
        }
    }

    @ReactMethod
    public void stopPushupSession() {
        try {
            if (arActivity != null) {
                arActivity.stopSession();
                arActivity = null;
            }
        } catch (Exception e) {
            android.util.Log.e(TAG, "Failed to stop pushup session", e);
        }
    }

    @ReactMethod
    public void getPushupCount(Promise promise) {
        try {
            if (arActivity == null) {
                promise.reject("NO_SESSION", "Pushup session not started");
                return;
            }
            int count = arActivity.getPushupCount();
            promise.resolve(count);
        } catch (Exception e) {
            promise.reject("ERROR", "Failed to get pushup count", e);
        }
    }

    @ReactMethod
    public void getIsGoingDown(Promise promise) {
        try {
            if (arActivity == null) {
                promise.reject("NO_SESSION", "Pushup session not started");
                return;
            }
            boolean isGoingDown = arActivity.getIsGoingDown();
            promise.resolve(isGoingDown);
        } catch (Exception e) {
            promise.reject("ERROR", "Failed to get is going down status", e);
        }
    }

    private void sendEvent(String eventName, WritableMap params) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(eventName, params);
    }
}
