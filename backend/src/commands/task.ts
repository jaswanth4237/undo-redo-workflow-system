import { AppState, Task } from "../domain/models";
import { BaseCommand } from "./base";

export class AddTaskCommand extends BaseCommand {
    type = "AddTaskCommand";
    payload: Task;

    constructor(task: Task) {
        super();
        this.payload = task;
    }

    execute(state: AppState): void {
        //Spred Operator
        state.tasks.push({ ...this.payload });
    }

    undo(state: AppState): void {
        //id=2 ==> index=1
        const index = state.tasks.findIndex((t) => t.id === this.payload.id);
        if (index !== -1) {
            state.tasks.splice(index, 1);
            //tasks = [
            //  "A",
            //  "B",
            //  "C"
            // ]

            // [
            //  "A",
            //  "C"
            // ]
        }
    }
}

export class CompleteTaskCommand extends BaseCommand {
    type = "CompleteTaskCommand";
    payload: { taskId: string; previousCompleted: boolean; newCompleted: boolean };

    constructor(taskId: string, previousCompleted: boolean, newCompleted: boolean) {
        super();
        this.payload = { taskId, previousCompleted, newCompleted };
    }

    execute(state: AppState): void {
        const task = state.tasks.find((t) => t.id === this.payload.taskId);
        if (task) {
            task.completed = this.payload.newCompleted;
        }
    }

    undo(state: AppState): void {
        const task = state.tasks.find((t) => t.id === this.payload.taskId);
        if (task) {
            task.completed = this.payload.previousCompleted;
        }
    }
}

export class DeleteTaskCommand extends BaseCommand {
    //used for the commend logs.
    type = "DeleteTaskCommand";
    payload: { task: Task; index?: number };

    constructor(task: Task) {
        super();
        //This is shorthand =>> task: task
        this.payload = { task };
    }

    execute(state: AppState): void {
        const index = state.tasks.findIndex((t) => t.id === this.payload.task.id);
        if (index !== -1) {
            this.payload.index = index;
            state.tasks.splice(index, 1);
        }
    }

    undo(state: AppState): void {
        if (this.payload.index !== undefined) {
            // Start at index 1
            // Remove 0 items
            // Insert B
            state.tasks.splice(this.payload.index, 0, { ...this.payload.task });
        } else {
            state.tasks.push({ ...this.payload.task });
        }
    }
}

