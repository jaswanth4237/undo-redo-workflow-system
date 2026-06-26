import { AppState } from "../domain/models";
import { BaseCommand } from "./base";

export class UpdateDocumentCommand extends BaseCommand {
    type = "UpdateDocumentCommand";
    payload: { previousContent: string; newContent: string };

    constructor(previousContent: string, newContent: string) {
        super();
        this.payload = { previousContent, newContent };
    }

    execute(state: AppState): void {
        state.document.content = this.payload.newContent;
    }

    undo(state: AppState): void {
        state.document.content = this.payload.previousContent;
    }
}
