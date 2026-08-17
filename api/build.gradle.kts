plugins {
    java
    id("org.springframework.boot") version "4.1.0"
    id("io.spring.dependency-management") version "1.1.7"
}

group = "ee.silversaul"
version = "0.0.1-SNAPSHOT"
description = "User Management REST API"

java {
    // Pinned rather than inherited from the local environment, so every machine
    // and CI runner compiles against the same JDK. See settings.gradle.kts for
    // automatic provisioning when Java 21 is not installed.
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-webmvc")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-flyway")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    runtimeOnly("com.h2database:h2")

    // Development only: the H2 console is a convenience for inspecting the
    // database locally and is deliberately excluded from the built jar.
    developmentOnly("org.springframework.boot:spring-boot-h2console")

    testImplementation("org.springframework.boot:spring-boot-starter-webmvc-test")
    testImplementation("org.springframework.boot:spring-boot-starter-data-jpa-test")
    testImplementation("org.springframework.boot:spring-boot-starter-flyway-test")
    testImplementation("org.springframework.boot:spring-boot-starter-validation-test")
    testImplementation("org.springframework.boot:spring-boot-starter-actuator-test")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.withType<Test> {
    useJUnitPlatform()
}

tasks.bootRun {
    // `./gradlew bootRun` is the documented way to start the application locally,
    // so the dev profile is active by default and no extra flag is needed to get
    // the H2 console. A built jar starts without it.
    args("--spring.profiles.active=dev")
}
