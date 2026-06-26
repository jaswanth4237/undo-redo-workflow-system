import dotenv from "dotenv";
import { createServer } from "./api/app";
import { CommandProcessor } from "./services/command-processor";
import { PersistenceService } from "./services/persistence";

dotenv.config();

const DEFAULT_PORT = 3000;
const REQUESTED_PORT = Number(process.env.PORT);
const START_PORT = Number.isInteger(REQUESTED_PORT) && REQUESTED_PORT > 0 ? REQUESTED_PORT : DEFAULT_PORT;
const COMMAND_LOG_PATH = process.env.COMMAND_LOG_PATH || "./data/command_log.jsonl";

function isPortInUseError(error: unknown): error is NodeJS.ErrnoException {
    return typeof error === "object" && error !== null && "code" in error && (error as NodeJS.ErrnoException).code === "EADDRINUSE";
}

async function listenWithFallback(app: ReturnType<typeof createServer>, port: number, attemptsRemaining = 10): Promise<number> {
    return new Promise((resolve, reject) => {
        const server = app.listen(port);

        server.once("listening", () => {
            resolve(port);
        });

        server.once("error", (error) => {
            server.close();

            if (isPortInUseError(error) && attemptsRemaining > 0) {
                console.warn(`Port ${port} is in use. Trying ${port + 1}...`);
                resolve(listenWithFallback(app, port + 1, attemptsRemaining - 1));
                return;
            }

            reject(error);
        });
    });
}

async function start() {
    const persistence = new PersistenceService(COMMAND_LOG_PATH);
    const processor = new CommandProcessor(persistence);

    console.log("Replaying command log...");
    await processor.initialize();
    console.log("State reconstructed.");

    const app = createServer(processor);

    const boundPort = await listenWithFallback(app, START_PORT);
    console.log(`Server is running on port ${boundPort}`);
}

start().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
});
