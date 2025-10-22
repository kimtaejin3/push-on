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
        try {
            if (arActivity == null) {
                arActivity = new AugmentedFacesActivity(reactContext);
            }
            
            arActivity.startSession();
        } catch (Exception e) {
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
            e.printStackTrace();
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
