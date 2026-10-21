# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:
-keep class com.kakao.sdk.**.model.* { <fields>; }
-keep class * extends com.google.gson.TypeAdapter
-dontwarn org.bouncycastle.jsse.**
-dontwarn org.conscrypt.*
-dontwarn org.openjsse.**

# 카카오 SDK 완전 보호
-keep class com.kakao.sdk.** { *; }
-keep interface com.kakao.sdk.** { *; }
-keep class com.kakao.** { *; }
-keep interface com.kakao.** { *; }

# Retrofit 완전 보호
-keep class retrofit2.** { *; }
-keep interface retrofit2.** { *; }
-keep class retrofit2.Call { *; }
-keep class retrofit2.Callback { *; }
-keep class retrofit2.Retrofit { *; }
-keep class retrofit2.Retrofit$Builder { *; }
-keep class retrofit2.http.** { *; }
-keep interface retrofit2.http.** { *; }

# Retrofit Call Adapter Factory 보호
-keep class * implements retrofit2.CallAdapter$Factory { *; }
-keep class * implements retrofit2.Converter$Factory { *; }
-keep class retrofit2.adapter.rxjava2.** { *; }
-keep class retrofit2.converter.gson.** { *; }

# OkHttp 완전 보호
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-keep class okio.** { *; }

# Gson 완전 보호
-keep class com.google.gson.** { *; }
-keep class * implements com.google.gson.TypeAdapterFactory { *; }
-keep class * implements com.google.gson.JsonSerializer { *; }
-keep class * implements com.google.gson.JsonDeserializer { *; }
-keep class * implements com.google.gson.TypeAdapter { *; }

# React Native 카카오 로그인 보호
-keep class com.reactnativeseoul.** { *; }
-keep class com.reactnativeseoul.kakaologin.** { *; }


# ──────────────────────────────────────────────────────────────
# R8 활성화(1.7.3)에 따라 추가한 보호 규칙
# ──────────────────────────────────────────────────────────────

# 앱 자체 네이티브 모듈. 구 브릿지(@ReactMethod)는 리플렉션으로 호출된다.
-keep class com.pushupapp.** { *; }

# React Native 브릿지가 리플렉션으로 찾는 것들
-keepclassmembers class * { @com.facebook.react.bridge.ReactMethod <methods>; }
-keepclassmembers class * { @com.facebook.proguard.annotations.DoNotStrip *; }
-keepclassmembers class * { @com.facebook.common.internal.DoNotStrip *; }
-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keep class com.facebook.react.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.hermes.** { *; }

# ARCore / Sceneform / filament — JNI 가 클래스를 이름으로 찾는다
-keep class com.google.ar.** { *; }
-keep class com.google.android.filament.** { *; }
-dontwarn com.google.ar.**
-dontwarn com.google.android.filament.**

# Google 로그인
-keep class com.google.android.gms.auth.** { *; }
-keep class com.google.android.gms.common.** { *; }

# notifee 로컬 알림
-keep class app.notifee.** { *; }
-dontwarn app.notifee.**

# 네이티브 메서드 전반
-keepclasseswithmembernames class * { native <methods>; }
