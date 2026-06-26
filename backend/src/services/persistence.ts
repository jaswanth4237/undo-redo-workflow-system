import * as fs from "fs";
import * as path from "path";
import { Command } from "../commands/base";
import { UpdateDocumentCommand } from "../commands/document";
import { AddTaskCommand, CompleteTaskCommand, DeleteTaskCommand } from "../commands/task";
import { BulkDeleteTasksCommand } from "../commands/composite";

export class PersistenceService {
    private logPath: string;

    constructor(logPath: string) {
        this.logPath = logPath;
        const dir = path.dirname(logPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    appendLog(command: Command): void {
        const logEntry = JSON.stringify(command.toJSON()) + "\n";
        fs.appendFileSync(this.logPath, logEntry);
    }

    readLog(): Command[] {
        if (!fs.existsSync(this.logPath)) {
            return [];
        }

        const content = fs.readFileSync(this.logPath, "utf-8");
        const lines = content.split("\n").filter((line) => line.trim() !== "");
        return lines.map((line) => this.deserializeCommand(JSON.parse(line)));
    }

    private deserializeCommand(data: any): Command {
        const { command_type, payload } = data;
        switch (command_type) {
            case "UpdateDocumentCommand":
                return new UpdateDocumentCommand(payload.previousContent, payload.newContent);
            case "AddTaskCommand":
                return new AddTaskCommand(payload);
            case "CompleteTaskCommand":
                return new CompleteTaskCommand(payload.taskId, payload.previousCompleted, payload.newCompleted);
            case "DeleteTaskCommand":
                const deleteCmd = new DeleteTaskCommand(payload.task || payload);
                if (payload.index !== undefined) deleteCmd.payload.index = payload.index;
                return deleteCmd;
            case "BulkDeleteTasksCommand":
                const children = payload.childCommands.map((c: any) => this.deserializeCommand(c) as DeleteTaskCommand);
                return new BulkDeleteTasksCommand(children);
            default:
                throw new Error(`Unknown command type: ${command_type}`);
        }
    }
}
