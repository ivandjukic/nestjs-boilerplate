import * as child from 'child_process'
import {Logger} from "@nestjs/common";

export class Exec {
    public static execSync(
        command: string,
        workingDir: string | null = null,
        throwEx: boolean = true,
        outputLogs: boolean = true,
    ): boolean {
        try {
            let execOptions: child.ExecSyncOptions = {}

            if (outputLogs) {
                execOptions = {
                    stdio: 'inherit', // this makes the output stream to the terminal
                }
            } else {
                execOptions = {
                    stdio: 'pipe', // silence std out
                }
            }

            if (workingDir !== null) {
                execOptions.cwd = workingDir
            }

            if (outputLogs) {
                Logger.log('Running command:', command)
            }
            if (workingDir !== null) {
                if (outputLogs) {
                    Logger.log('Working directory:', workingDir)
                }
            }

            child.execSync(command, execOptions)

            return true
        } catch (err) {
            if (throwEx) {
                throw err
            }

            if (outputLogs) {
                Logger.error(String(err))
            }
            return false
        }
    }
}
