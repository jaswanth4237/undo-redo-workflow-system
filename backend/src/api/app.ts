import express, { Request, Response } from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import { CommandProcessor } from "../services/command-processor";
import { UpdateDocumentCommand } from "../commands/document";
import { AddTaskCommand, CompleteTaskCommand, DeleteTaskCommand } from "../commands/task";
import { BulkDeleteTasksCommand } from "../commands/composite";

export function createServer(processor: CommandProcessor) {
    const app = express();
    app.use(express.json());
    app.use(cors());

    app.get("/health", (req, res) => {
        res.status(200).send("OK");
    });

    app.get("/state", (req, res) => {
        res.json(processor.getState());
    });

    app.post("/action/document/update", (req, res) => {
        const { content } = req.body;
        const currentState = processor.getState();
        const command = new UpdateDocumentCommand(currentState.document.content, content);
        processor.executeCommand(command);
        res.status(200).send("Document updated");
    });

    app.post("/action/tasks/add", (req, res) => {
        const { text } = req.body;
        const newTask = { id: uuidv4(), text, completed: false };
        const command = new AddTaskCommand(newTask);
        processor.executeCommand(command);
        res.status(200).json(newTask);
    });

    app.post("/action/tasks/complete/:taskId", (req, res) => {
        const { taskId } = req.params;
        const task = processor.getState().tasks.find((t) => t.id === taskId);
        if (!task) {
            return res.status(404).send("Task not found");
        }
        const command = new CompleteTaskCommand(taskId, task.completed, !task.completed);
        processor.executeCommand(command);
        res.status(200).send("Task completion toggled");
    });

    app.post("/action/tasks/delete/:taskId", (req, res) => {
        const { taskId } = req.params;
        const task = processor.getState().tasks.find((t) => t.id === taskId);
        if (!task) {
            return res.status(404).send("Task not found");
        }
        const command = new DeleteTaskCommand(task);
        processor.executeCommand(command);
        res.status(200).send("Task deleted");
    });

    app.post("/action/tasks/bulk-delete", (req, res) => {
        const { taskIds } = req.body as { taskIds: string[] };
        const tasksToDelete = processor.getState().tasks.filter((t) => taskIds.includes(t.id));

        const childCommands = tasksToDelete.map((t) => new DeleteTaskCommand(t));
        const command = new BulkDeleteTasksCommand(childCommands);

        processor.executeCommand(command);
        res.status(200).send("Tasks bulk deleted");
    });

    app.post("/action/undo", (req, res) => {
        processor.undo();
        res.status(200).send("Undo successful");
    });

    app.post("/action/redo", (req, res) => {
        processor.redo();
        res.status(200).send("Redo successful");
    });

    return app;
}
