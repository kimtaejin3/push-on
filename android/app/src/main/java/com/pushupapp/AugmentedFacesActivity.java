package com.pushupapp;

import android.opengl.GLES20;
import android.opengl.GLSurfaceView;
import android.util.Log;
import android.view.ViewGroup;
import com.facebook.react.bridge.ReactApplicationContext;

import com.google.ar.core.AugmentedFace;
import com.google.ar.core.Camera;
import com.google.ar.core.CameraConfig;
import com.google.ar.core.CameraConfigFilter;
import com.google.ar.core.Config;
import com.google.ar.core.Frame;
import com.google.ar.core.Pose;
import com.google.ar.core.Session;
import com.google.ar.core.TrackingState;
import com.google.ar.core.ArCoreApk;
import com.google.ar.core.exceptions.*;

import java.util.EnumSet;
import java.util.List;
import java.util.Collection;

import javax.microedition.khronos.egl.EGLConfig;
import javax.microedition.khronos.opengles.GL10;

/**
 * 얼굴 꾸밈 요소 제거 + 푸쉬업 카운팅 (React Native용)
 */
public class AugmentedFacesActivity implements GLSurfaceView.Renderer {

  private static final String TAG = "FaceDistance";

  private ReactApplicationContext reactContext;
  private GLSurfaceView surfaceView;
  private Session session;
  private boolean installRequested;
  private int cameraTextureId = -1;

  private int pushUpCount = 0;
  private boolean isGoingDown = false;

  private final float CLOSE_THRESHOLD = 0.25f; // 내려갈 때 얼굴-카메라 거리
  private final float FAR_THRESHOLD = 0.35f;   // 올라올 때 얼굴-카메라 거리

  public AugmentedFacesActivity(ReactApplicationContext reactContext) {
    this.reactContext = reactContext;
    this.installRequested = false;
  }

  public void startSession() {
    Log.d(TAG, "🚀 startSession() 호출됨");
    
    try {
      // 숨겨진 GLSurfaceView 생성
      createHiddenGLSurfaceView();
      
      if (session == null) {
        Log.d(TAG, "📱 ARCore 세션 생성 시작");
        switch (ArCoreApk.getInstance().requestInstall(reactContext.getCurrentActivity(), !installRequested)) {
          case INSTALL_REQUESTED:
            installRequested = true;
            return;
          case INSTALLED:
            break;
        }

        session = new Session(reactContext.getCurrentActivity(), EnumSet.noneOf(Session.Feature.class));

        CameraConfigFilter filter = new CameraConfigFilter(session);
        filter.setFacingDirection(CameraConfig.FacingDirection.FRONT);
        List<CameraConfig> configs = session.getSupportedCameraConfigs(filter);
        if (!configs.isEmpty()) {
          session.setCameraConfig(configs.get(0));
        } else {
          throw new UnavailableDeviceNotCompatibleException("전면 카메라 없음");
        }

        Config config = new Config(session);
        config.setAugmentedFaceMode(Config.AugmentedFaceMode.MESH3D);
        session.configure(config);
      }

      session.resume();
      surfaceView.onResume();
      
      Log.d(TAG, "✅ ARCore session started");

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

  public void stopSession() {
    if (session != null) {
      surfaceView.onPause();
      session.pause();
      session.close();
      session = null;
      Log.d(TAG, "ARCore session stopped");
    }
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
  }

  // 숨겨진 GLSurfaceView 생성
  private void createHiddenGLSurfaceView() {
    surfaceView = new GLSurfaceView(reactContext.getCurrentActivity());
    surfaceView.setPreserveEGLContextOnPause(true);
    surfaceView.setEGLContextClientVersion(2);
    surfaceView.setRenderer(this);
    surfaceView.setRenderMode(GLSurfaceView.RENDERMODE_CONTINUOUSLY);
    
    // GLSurfaceView를 숨김 (크기를 1x1로 설정)
    surfaceView.setLayoutParams(new ViewGroup.LayoutParams(1, 1));
    surfaceView.setVisibility(android.view.View.GONE);
    
    // Activity에 추가 (하지만 보이지 않음) - 메인 스레드에서 실행
    reactContext.getCurrentActivity().runOnUiThread(new Runnable() {
      @Override
      public void run() {
        try {
          reactContext.getCurrentActivity().addContentView(surfaceView, 
              new ViewGroup.LayoutParams(1, 1));
          Log.d(TAG, "✅ GLSurfaceView가 Activity에 추가됨");
        } catch (Exception e) {
          Log.e(TAG, "❌ GLSurfaceView 추가 실패", e);
        }
      }
    });
    
    Log.d(TAG, "📱 숨겨진 GLSurfaceView 생성 완료");
  }

  // === GLSurfaceView.Renderer 구현 ===

  @Override
  public void onSurfaceCreated(GL10 gl, EGLConfig config) {
    GLES20.glClearColor(0f, 0f, 0f, 1f);

    int[] textures = new int[1];
    GLES20.glGenTextures(1, textures, 0);
    cameraTextureId = textures[0];
    if (session != null) {
      session.setCameraTextureName(cameraTextureId);
    }
  }

  @Override
  public void onSurfaceChanged(GL10 gl, int width, int height) {
    GLES20.glViewport(0, 0, width, height);
  }

  @Override
  public void onDrawFrame(GL10 gl) {
    GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT | GLES20.GL_DEPTH_BUFFER_BIT);
    if (session == null) return;

    try {
      Frame frame = session.update();
      Camera camera = frame.getCamera();

      Collection<AugmentedFace> faces = session.getAllTrackables(AugmentedFace.class);
      for (AugmentedFace face : faces) {
        if (face.getTrackingState() != TrackingState.TRACKING) continue;

        Pose facePose = face.getCenterPose();
        Pose cameraPose = camera.getPose();

        float dx = facePose.tx() - cameraPose.tx();
        float dy = facePose.ty() - cameraPose.ty();
        float dz = facePose.tz() - cameraPose.tz();
        float distanceMeters = (float) Math.sqrt(dx * dx + dy * dy + dz * dz);

        // ====== 푸쉬업 카운팅 로직 ======
        if (distanceMeters < CLOSE_THRESHOLD && !isGoingDown) {
          isGoingDown = true;
          Log.d(TAG, "푸쉬업 내려가는 중");
        }

        if (distanceMeters > FAR_THRESHOLD && isGoingDown) {
          pushUpCount++;
          isGoingDown = false;
          Log.d(TAG, "푸쉬업 카운트 증가 → " + pushUpCount);
        }

        Log.d(TAG, "👤 얼굴-카메라 거리: " + distanceMeters + "m");
      }

    } catch (Throwable t) {
      Log.e(TAG, "❌ OpenGL 스레드 예외", t);
    }
  }
}
