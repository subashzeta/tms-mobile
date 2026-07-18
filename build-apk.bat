@echo off
SET JAVA_HOME=C:\Users\momen\.jdks\jdk-21.0.2+13
SET ANDROID_HOME=C:\Users\momen\AppData\Local\Android\Sdk
SET PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\build-tools\36.0.0;%PATH%

echo ===== TMS Mobile APK Builder =====
cd /d D:\tms\tms-mobile

echo [1/3] Running Expo prebuild...
call npx expo prebuild --clean 2>nul

echo [2/3] Patching Gradle to 8.13 (compatible with JDK 21)...
set GRADLE_PROP=D:\subashzetaWork\tms\tms-mobile\android\gradle\wrapper\gradle-wrapper.properties
powershell -Command "(Get-Content '%GRADLE_PROP%') -replace 'gradle-9.*-bin.zip', 'gradle-8.13-bin.zip' | Set-Content '%GRADLE_PROP%'"

echo [3/3] Building APK (Release)...
cd android
call ./gradlew assembleRelease

echo.
echo ===== SUCCESS =====
echo APK: android\app\build\outputs\apk\release\app-release.apk
echo.
pause
