import {Exec} from "./exec/exec";
import {Logger} from "@nestjs/common";

const { exec } = require('child_process');

async function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function startTestEnv() {
    console.log('Starting test environment');

    // 1. Run docker-compose up -d
    console.log('1. Starting Docker containers...')
    Exec.execSync('docker compose --file ./docker-compose-integration-test.yaml up -d')
    console.log('Docker containers are up')

    try {
        // it might take a few seconds for the containers to be up and running
        console.log('2. Running migrations...')
        let migrationWorked = false
        while (!migrationWorked) {
            await sleep(3000)
            migrationWorked = Exec.execSync(
                `docker exec -it integration-tests-app yarn migration:run`,
                undefined,
                false,
            )
            console.log('Migrations are running...')
        }

        // // seed data
        // if (runSeedData === 'true') {
        //     Exec.execSync(
        //         `SCRIPT=${dcProjInfo.postgresSetup} docker compose --file ${dcProjInfo.filename} --project-name ${dcProjInfo.projectName} up --exit-code-from exchange-be-db-seed exchange-be-db-seed`,
        //     )
        // }
        //
        // if (dcProjInfo.useMockBridge) {
        //     Exec.execSync(
        //         `docker compose --file ${dcProjInfo.filename} --project-name ${dcProjInfo.projectName} up --detach bridge-be-api`,
        //     )
        // }
        //
        // // reattach to the dev env
        // try {
        //     Exec.execSync(
        //         `docker compose --file ${dcProjInfo.filename} --project-name ${dcProjInfo.projectName} logs --follow --timestamps exchange-db local-aws exchange-be-uiapi`,
        //     )
        // } catch (err) {
        //     if (err.signal && err.signal === 'SIGINT') {
        //         // user has hit Ctrl + C - no need to re-throw
        //     } else {
        //         throw err
        //     }
        // }
    } catch (err) {
        Logger.error(
            `Devenv spin up threw an error: ${JSON.stringify(
                err,
                Object.getOwnPropertyNames(err),
            )}`,
        )
        throw err
    } finally {

    }
}

startTestEnv();
