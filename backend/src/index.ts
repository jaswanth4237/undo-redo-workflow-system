import dotenv from "dotenv";
import { createServer } from "./api/app";
import { CommandProcessor } from "./services/command-processor";
import { PersistenceService } from "./services/persistence";

dotenv.config();

const PORT = process.env.PORT || 3000;
const COMMAND_LOG_PATH = process.env.COMMAND_LOG_PATH || "./data/command_log.jsonl";

async function start() {
    const persistence = new PersistenceService(COMMAND_LOG_PATH);
    const processor = new CommandProcessor(persistence);

    console.log("Replaying command log...");
    await processor.initialize();
    console.log("State reconstructed.");

    const app = createServer(processor);

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

start().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
});
