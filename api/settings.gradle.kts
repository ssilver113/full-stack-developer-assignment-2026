plugins {
    // Downloads a matching JDK when the required toolchain is not installed, so
    // the build works regardless of which JDK is on PATH.
    id("org.gradle.toolchains.foojay-resolver-convention") version "1.0.0"
}

rootProject.name = "user-management-api"
