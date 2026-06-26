import { AppState } from "../domain/models";

export interface Command {
    type: string;
    payload: any;
    execute(state: AppState): void;
    undo(state: AppState): void;
    toJSON(): object;
}

export abstract class BaseCommand implements Command {
    abstract type: string;
    abstract payload: any;
    abstract execute(state: AppState): void;
    abstract undo(state: AppState): void;

    toJSON(): object {
        return {
            command_type: this.type,
            payload: this.payload,
        };
    }
}
