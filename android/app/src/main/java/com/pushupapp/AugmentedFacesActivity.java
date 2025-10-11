package com.pushupapp;

import android.opengl.GLES20;
import android.opengl.GLSurfaceView;
import android.util.Log;
import android.view.ViewGroup;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.google.ar.core.*;

import com.google.ar.core.exceptions.*;

import java.util.Collection;
import java.util.EnumSet;
import java.util.List;

import javax.microedition.khronos.egl.EGLConfig;
import javax.microedition.khronos.opengles.GL10;

public class AugmentedFacesActivity implements GLSurfaceView.Renderer {

    private static final String TAG = "FaceDistance";

    private GLSurfaceView surfaceView;
    private Session session;
    private boolean installRequested;
    private int cameraTextureId = -1;

    private int pushUpCount = 0;
    private boolean isGoingDown = false;

    private final float CLOSE_THRESHOLD = 0.35f;
    private final float FAR_THRESHOLD = 0.40f;

    private ReactApplicationContext reactContext;

    public AugmentedFacesActivity(ReactApplicationContext reactContext) {
        this.reactContext = reactContext;
        this.installRequested = false;
        Log.d(TAG, "🚀 AugmentedFacesActivity 생성됨");
    }

    public void startSession() {
        Log.d(TAG, "🚀 startSession() 호출됨");
        
        try {
            // XML 레이아웃에서 GLSurfaceView 참조 (원본 방식)
            setupGLSurfaceView();
            
            // ARCore 설치 확인
            if (session == null) {
                Log.d(TAG, "📱 ARCore 세션 생성 시작");
                switch (ArCoreApk.getInstance().requestInstall(reactContext.getCurrentActivity(), !installRequested)) {
                    case INSTALL_REQUESTED:
                        installRequested = true;
                        return;
                    case INSTALLED:
                        break;
                }

                // ARCore 세션 생성
                session = new Session(reactContext.getCurrentActivity(), EnumSet.noneOf(Session.Feature.class));

                // 전면 카메라 설정
                CameraConfigFilter filter = new CameraConfigFilter(session);
                filter.setFacingDirection(CameraConfig.FacingDirection.FRONT);
                List<CameraConfig> configs = session.getSupportedCameraConfigs(filter);
                if (!configs.isEmpty()) {
                    session.setCameraConfig(configs.get(0));
                    Log.d(TAG, "✅ 전면 카메라 설정됨");
                } else {
                    throw new UnavailableDeviceNotCompatibleException("전면 카메라 없음");
                }

                // ARCore 설정
                Config config = new Config(session);
                config.setAugmentedFaceMode(Config.AugmentedFaceMode.MESH3D);
                session.configure(config);
                Log.d(TAG, "✅ ARCore config set");
            }

            session.resume();
            
            if (surfaceView != null) {
                surfaceView.onResume();
                Log.d(TAG, "✅ ARCore session started");
            } else {
                Log.e(TAG, "❌ surfaceView가 null입니다. GLSurfaceView 설정을 확인하세요.");
                return;
            }

        } catch (UnavailableArcoreNotInstalledException | UnavailableUserDeclinedInstallationException e) {
            Log.e(TAG, "ARCore 설치 필요", e);
            return;
        } catch (UnavailableApkTooOldException e) {
            Log.e(TAG, "ARCore 업데이트 필요", e);
            return;
        } catch (UnavailableSdkTooOldException e) {
            Log.e(TAG, "앱 업데이트 필요", e);
            return;
        } catch (UnavailableDeviceNotCompatibleException e) {
            Log.e(TAG, "AR 지원 불가 기기", e);
            return;
        } catch (CameraNotAvailableException e) {
            Log.e(TAG, "카메라 사용 불가. 앱 재시작 필요", e);
            session = null;
            return;
        } catch (Exception e) {
            Log.e(TAG, "AR 세션 생성 실패", e);
            return;
        }
    }

    // 원본 코드 핵심 로직으로 GLSurfaceView 생성
    private void setupGLSurfaceView() {
        Log.d(TAG, "🔧 GLSurfaceView 생성 시작 (원본 핵심 로직)");
        
        // 원본 코드와 동일한 방식으로 GLSurfaceView 생성
        surfaceView = new GLSurfaceView(reactContext.getCurrentActivity());
        surfaceView.setPreserveEGLContextOnPause(true);
        surfaceView.setEGLContextClientVersion(2);
        surfaceView.setRenderer(this);
        surfaceView.setRenderMode(GLSurfaceView.RENDERMODE_CONTINUOUSLY);
        
        // Activity에 추가 (원본 코드의 핵심 로직)
        reactContext.getCurrentActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    reactContext.getCurrentActivity().addContentView(surfaceView, 
                        new ViewGroup.LayoutParams(1, 1));
                    Log.d(TAG, "✅ GLSurfaceView가 Activity에 추가됨 (원본 핵심 로직)");
                } catch (Exception e) {
                    Log.e(TAG, "❌ GLSurfaceView 추가 실패", e);
                }
            }
        });
        
        Log.d(TAG, "✅ GLSurfaceView 생성 완료 (원본 핵심 로직)");
    }

    // === GLSurfaceView.Renderer ===
    @Override
    public void onSurfaceCreated(GL10 gl, EGLConfig config) {
        Log.d(TAG, "RENDERER onSurfaceCreated 호출됨");
        GLES20.glClearColor(0f, 0f, 0f, 1f);

        int[] textures = new int[1];
        GLES20.glGenTextures(1, textures, 0);
        cameraTextureId = textures[0];
        Log.d(TAG, "RENDERER OpenGL 텍스처 생성됨: " + cameraTextureId);
    }

    @Override
    public void onSurfaceChanged(GL10 gl, int width, int height) {
        Log.d(TAG, "RENDERER onSurfaceChanged 호출됨 - 크기: " + width + "x" + height);
        GLES20.glViewport(0, 0, width, height);
    }

    @Override
    public void onDrawFrame(GL10 gl) {
        GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT | GLES20.GL_DEPTH_BUFFER_BIT);
        Log.d(TAG, "RENDERER onDrawFrame 호출됨");
        if (session == null) {
            Log.d(TAG, "RENDERER onDrawFrame: session이 null입니다");
            return;
        }

        // 텍스처가 설정되지 않았다면 설정
        if (cameraTextureId != -1) {
            try {
                session.setCameraTextureName(cameraTextureId);
                Log.d(TAG, "RENDERER onDrawFrame에서 텍스처 설정: " + cameraTextureId);
            } catch (Exception e) {
                Log.d(TAG, "RENDERER 텍스처 이미 설정됨: " + cameraTextureId);
            }
        }

        try {
            Frame frame = session.update();
            if (frame == null) {
                Log.d(TAG, "RENDERER onDrawFrame: frame이 null입니다");
                return;
            }
            
            Camera camera = frame.getCamera();
            if (camera == null) {
                Log.d(TAG, "RENDERER onDrawFrame: camera가 null입니다");
                return;
            }

            Collection<AugmentedFace> faces = session.getAllTrackables(AugmentedFace.class);
            Log.d(TAG, "RENDERER 감지된 얼굴 수: " + faces.size());
            
            if (faces.isEmpty()) {
                Log.d(TAG, "RENDERER 얼굴이 감지되지 않음 - 카메라에 얼굴이 보이는지 확인하세요");
                return;
            }
            
            for (AugmentedFace face : faces) {
                Log.d(TAG, "RENDERER 얼굴 추적 상태: " + face.getTrackingState());
                if (face.getTrackingState() != TrackingState.TRACKING) {
                    Log.d(TAG, "RENDERER 추적되지 않는 얼굴 건너뜀 - 상태: " + face.getTrackingState());
                    continue;
                }

                Pose facePose = face.getCenterPose();
                Pose cameraPose = camera.getPose();

                float dx = facePose.tx() - cameraPose.tx();
                float dy = facePose.ty() - cameraPose.ty();
                float dz = facePose.tz() - cameraPose.tz();
                float distance = (float) Math.sqrt(dx * dx + dy * dy + dz * dz);

                Log.d(TAG, "RENDERER 얼굴-카메라 거리: " + distance + "m, 상태: " + (isGoingDown ? "내려가는 중" : "올라가는 중"));

                // === 푸쉬업 로직 ===
                if (distance < CLOSE_THRESHOLD && !isGoingDown) {
                    isGoingDown = true;
                    Log.d(TAG, "RENDERER 푸쉬업 내려가는 중 - 거리: " + distance + "m");
                }
                if (distance > FAR_THRESHOLD && isGoingDown) {
                    pushUpCount++;
                    isGoingDown = false;
                    Log.d(TAG, "RENDERER 푸쉬업 카운트 증가 → " + pushUpCount + " (거리: " + distance + "m)");

                    // ✅ React Native로 이벤트 전송
                    if (reactContext != null) {
                        var params = Arguments.createMap();
                        params.putInt("count", pushUpCount);
                        reactContext
                            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                            .emit("onPushupCount", params);
                    }
                }
            }
        } catch (Throwable t) {
            Log.e(TAG, "RENDERER ARCore 프레임 업데이트 예외", t);
        }
    }

    public void stopSession() {
        Log.d(TAG, "🛑 stopSession() 호출됨");
        
        if (session != null) {
            surfaceView.onPause();
            session.pause();
            session.close();
            session = null;
        }
        
        Log.d(TAG, "✅ ARCore 세션 정리 완료");
    }

    public int getPushupCount() {
        return pushUpCount;
    }

    public boolean getIsGoingDown() {
        return isGoingDown;
    }

    public void resetCount() {
        pushUpCount = 0;
        isGoingDown = false;
        Log.d(TAG, "🔄 푸쉬업 카운트 리셋됨");
    }
}
