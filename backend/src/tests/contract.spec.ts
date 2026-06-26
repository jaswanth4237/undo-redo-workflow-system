import { CommandProcessor } from "../services/command-processor";
import { PersistenceService } from "../services/persistence";
import { UpdateDocumentCommand } from "../commands/document";
import { AddTaskCommand, CompleteTaskCommand, DeleteTaskCommand } from "../commands/task";
import { BulkDeleteTasksCommand } from "../commands/composite";
import * as fs from "fs";
import * as path from "path";

const TEST_LOG_PATH = "./test_data/command_log.jsonl";

describe("Undo/Redo Workflow System Contract Tests", () => {
    let processor: CommandProcessor;
    let persistence: PersistenceService;

    beforeEach(() => {
        if (fs.existsSync(TEST_LOG_PATH)) {
            fs.unlinkSync(TEST_LOG_PATH);
        }
        persistence = new PersistenceService(TEST_LOG_PATH);
        processor = new CommandProcessor(persistence);
    });

    afterAll(() => {
        if (fs.existsSync(TEST_LOG_PATH)) {
            fs.unlinkSync(TEST_LOG_PATH);
        }
        if (fs.existsSync("./test_data")) {
            fs.rmdirSync("./test_data");
        }
    });

    const getCleanState = () => JSON.parse(JSON.stringify(processor.getState()));

    test("UpdateDocumentCommand undo resets state", () => {
        const initialState = getCleanState();
        const command = new UpdateDocumentCommand(initialState.document.content, "new content");

        processor.executeCommand(command);
        expect(processor.getState().document.content).toBe("new content");

        processor.undo();
        expect(processor.getState()).toEqual(initialState);
    });

    test("AddTaskCommand undo resets state", () => {
        const initialState = getCleanState();
        const task = { id: "1", text: "test task", completed: false };
        const command = new AddTaskCommand(task);

        processor.executeCommand(command);
        expect(processor.getState().tasks).toHaveLength(1);

        processor.undo();
        expect(processor.getState()).toEqual(initialState);
    });

    test("CompleteTaskCommand undo resets state", () => {
        // Add a task first
        const task = { id: "1", text: "test task", completed: false };
        processor.executeCommand(new AddTaskCommand(task));
        const stateAfterAdd = getCleanState();

        const command = new CompleteTaskCommand("1", false, true);
        processor.executeCommand(command);
        expect(processor.getState().tasks[0].completed).toBe(true);

        processor.undo();
        expect(processor.getState()).toEqual(stateAfterAdd);
    });

    test("DeleteTaskCommand (Memento) undo resets state", () => {
        const task = { id: "1", text: "test task", completed: false };
        processor.executeCommand(new AddTaskCommand(task));
        const stateAfterAdd = getCleanState();

        const command = new DeleteTaskCommand(task);
        processor.executeCommand(command);
        expect(processor.getState().tasks).toHaveLength(0);

        processor.undo();
        expect(processor.getState()).toEqual(stateAfterAdd);
    });

    test("BulkDeleteTasksCommand (Composite) undo resets state", () => {
        const t1 = { id: "1", text: "t1", completed: false };
        const t2 = { id: "2", text: "t2", completed: false };
        processor.executeCommand(new AddTaskCommand(t1));
        processor.executeCommand(new AddTaskCommand(t2));
        const stateAfterAdd = getCleanState();

        const command = new BulkDeleteTasksCommand([
            new DeleteTaskCommand(t1),
            new DeleteTaskCommand(t2)
        ]);

        processor.executeCommand(command);
        expect(processor.getState().tasks).toHaveLength(0);

        processor.undo();
        expect(processor.getState()).toEqual(stateAfterAdd);
    });

    test("Redo after undo restores state", () => {
        const task = { id: "1", text: "test task", completed: false };
        processor.executeCommand(new AddTaskCommand(task));
        const stateAfterExecute = getCleanState();

        processor.undo();
        processor.redo();
        expect(processor.getState()).toEqual(stateAfterExecute);
    });
});
