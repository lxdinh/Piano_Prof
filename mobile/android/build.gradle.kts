allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

// On Windows this project lives under Downloads, which Controlled Folder Access
// protects — Gradle can't churn build files there (AccessDenied / "unable to
// delete"), so relocate the build dir outside it. Elsewhere (Claude Code online
// / Linux / CI) use the standard mobile/build so `flutter build` finds the APK.
val isWindows = System.getProperty("os.name").lowercase().contains("win")
val newBuildDir: Directory = if (isWindows)
    rootProject.layout.projectDirectory.dir("../../../../pp_build")
else
    rootProject.layout.buildDirectory.dir("../../build").get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
    // A transitive plugin (flutter_plugin_android_lifecycle, via file/image
    // picker) requires every Android module to compile against SDK 36. Register
    // this before evaluationDependsOn forces evaluation. Reflection keeps it
    // working across the old + new AGP DSL.
    afterEvaluate {
        val android = extensions.findByName("android") ?: return@afterEvaluate
        runCatching {
            android.javaClass.getMethod("setCompileSdk", Integer::class.java)
                .invoke(android, 36)
        }.recoverCatching {
            android.javaClass.getMethod("compileSdkVersion", Int::class.javaPrimitiveType)
                .invoke(android, 36)
        }
    }
}
subprojects {
    project.evaluationDependsOn(":app")
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
