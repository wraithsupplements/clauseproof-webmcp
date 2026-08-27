export type ToolDefinition<TInput extends Record<string, unknown> = Record<string, unknown>, TOutput = unknown> = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
  };
  execute: (input: TInput) => Promise<TOutput> | TOutput;
};

export type ModelContext = {
  registerTool: (definition: ToolDefinition) => Promise<void> | void;
};

declare global {
  interface Document {
    modelContext?: ModelContext;
  }
}

