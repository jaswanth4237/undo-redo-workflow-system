import { AppState } from "../domain/models";
import { BaseCommand, Command } from "./base";
import { DeleteTaskCommand } from "./task";

export class BulkDeleteTasksCommand extends BaseCommand {
    type = "BulkDeleteTasksCommand";
    payload: { childCommands: any[] };
    private children: DeleteTaskCommand[];

    constructor(children: DeleteTaskCommand[]) {
        super();
        this.children = children;
        this.payload = {
            childCommands: children.map((c) => c.toJSON()),
        };
    }

    execute(state: AppState): void {
        for (const child of this.children) {
            child.execute(state);
        }
    }

    undo(state: AppState): void {
        // Reverse order for undo
        for (let i = this.children.length - 1; i >= 0; i--) {
            this.children[i].undo(state);
        }
    }
}
