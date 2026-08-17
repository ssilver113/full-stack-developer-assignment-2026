plugins {
    // Resolves and downloads a matching JDK when the toolchain required below is
    // not installed locally, so `./gradlew build` works on any machine regardless
    // of which JDK the developer happens to have on PATH.
    id("org.gradle.toolchains.foojay-resolver-convention") version "1.0.0"
}

rootProject.name = "user-management-api"
