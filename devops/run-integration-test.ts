import {Exec} from "./exec/exec";
import {Logger} from "@nestjs/common";

async function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function executeIntegrationTests() {
    try {
        console.log('1. Running migrations...')
        let migrationWorked = false
        Exec.execSync(
            `docker exec -it  integration-tests-app yarn test:integration`,
            undefined,
            false,
        )
    } catch (err) {
        Logger.error(
            `Error running integration tests: ${JSON.stringify(
                err,
                Object.getOwnPropertyNames(err),
            )}`,
        )
        throw err
    } finally {

    }
}

executeIntegrationTests();
