# Undo/Redo Workflow System

This project implements a robust undo/redo system for a workflow application using the Command, Memento, and Composite design patterns.

## Project Structure

- `backend/`: Node.js + TypeScript service.
  - Implements Command, Memento, Composite patterns.
  - Durable command log (Event Sourcing) in `data/command_log.jsonl`.
  - REST API for actions and state management.
  - Dockerized and ready for orchestration.
- `frontend/`: Flutter web application.
  - Simple UI to interact with the backend.
  - Supports document updates, task management, and undo/redo.
- `docker-compose.yml`: Orchestrates the backend service.

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js & npm (for local development)
- Flutter (for frontend development)

### Running the Backend

1. Navigate to the root directory.
2. Run:
   ```bash
   docker-compose up --build
   ```
3. The API will be available at `http://localhost:3000`.

### Running the Frontend

1. Navigate to the `frontend/` directory.
2. Run:
   ```bash
   flutter run -d chrome
   ```
   (Note: Ensure the backend is running)

### Running Tests

1. Navigate to the `backend/` directory.
2. Run:
   ```bash
   npm test
   ```

## Design Patterns Implemented

- **Command Pattern**: Encapsulates every state change as an object with `execute()` and `undo()` methods.
- **Memento Pattern**: Used in `DeleteTaskCommand` to capture the state of a task before deletion, allowing it to be perfectly restored.
- **Composite Pattern**: `BulkDeleteTasksCommand` groups multiple deletion commands into a single atomic action.
- **Event Sourcing**: The system persists the sequence of commands and replays them on startup to reconstruct the application state.
