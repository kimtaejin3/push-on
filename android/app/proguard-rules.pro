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

