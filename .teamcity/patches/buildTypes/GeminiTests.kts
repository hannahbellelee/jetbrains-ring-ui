package patches.buildTypes

import jetbrains.buildServer.configs.kotlin.v2018_2.*
import jetbrains.buildServer.configs.kotlin.v2018_2.buildSteps.ScriptBuildStep
import jetbrains.buildServer.configs.kotlin.v2018_2.buildSteps.script
import jetbrains.buildServer.configs.kotlin.v2018_2.ui.*

/*
This patch script was generated by TeamCity on settings change in UI.
To apply the patch, change the buildType with id = 'GeminiTests'
accordingly, and delete the patch script.
*/
changeBuildType(RelativeId("GeminiTests")) {
    expectSteps {
        script {
            name = "Run gemini"
            scriptContent = """
                #!/bin/bash
                set -e -x
                
                node -v
                npm -v
                
                cd packages/gemini
                yarn install
                # ! We run tests against built docs from another build configuration
                npm run gemini-test-ci
            """.trimIndent()
            dockerImage = "node:8"
            dockerRunParameters = "-p 4445:4445 -v %teamcity.build.workingDir%/npmlogs:/root/.npm/_logs"
        }
    }
    steps {
        update<ScriptBuildStep>(0) {
            dockerImage = "node:10"
        }
    }
}
