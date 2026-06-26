import { AppState, createInitialState } from "../domain/models";
import { Command } from "../commands/base";
import { PersistenceService } from "./persistence";

export class CommandProcessor {
    private state: AppState;
    private undoStack: Command[] = [];
    private redoStack: Command[] = [];
    private persistence: PersistenceService;

    constructor(persistence: PersistenceService) {
        this.state = createInitialState();
        this.persistence = persistence;
    }

    async initialize(): Promise<void> {
        const historicalCommands = this.persistence.readLog();
        for (const command of historicalCommands) {
            command.execute(this.state);
        }
    }

    getState(): AppState {
        return this.state;
    }

    executeCommand(command: Command, isReplay = false): void {
        command.execute(this.state);

        if (!isReplay) {
            this.undoStack.push(command);
            this.redoStack = []; // Clear redo stack on new action
            this.persistence.appendLog(command);
        }
    }

    undo(): void {
        const command = this.undoStack.pop();
        if (command) {
            command.undo(this.state);
            this.redoStack.push(command);
        }
    }

    redo(): void {
        const command = this.redoStack.pop();
        if (command) {
            command.execute(this.state);
            this.undoStack.push(command);
        }
    }
}
