export interface Task {
    id: string;
    text: string;
    completed: boolean;
}

export interface Document {
    content: string;
}

export interface AppState {
    document: Document;
    tasks: Task[];
}

export const createInitialState = (): AppState => ({
    document: { content: "" },
    tasks: [],
});
