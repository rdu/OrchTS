import { Agent } from './agent.js';

export interface Message
{
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    sender?: string;
    tool_calls?: ToolCall[];
    tool_call_id?: string;
    tool_name?: string;
}

export interface Result
{
    value: string;
    agent?: Agent;
    context_variables?: ContextVariables;
    messages?: Message[];
}

export interface LLMProviderParams
{
    messages: Message[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools?: any[];
    tool_choice?: ToolChoice | null;
    parallel_tool_calls?: boolean;
}

export interface LLMProvider
{
    generateCompletion(params: LLMProviderParams): Promise<ChatCompletionMessage>;
}

export interface Response
{
    messages: Message[];
    agent: Agent;
    context_variables: ContextVariables;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ContextVariables = Record<string, any>;

export interface ToolCall
{
    id: string;
    function: {
        name: string;
        arguments: string;
    };
    type: string;
}

export interface ChatCompletionMessage extends Message
{
    tool_call_id?: string;
}

export type Debug = boolean | 'error' | 'warn' | 'info' | 'debug';

export interface OrchTSConfig
{
    defaultLLMProvider?: LLMProvider;
    maxTurns?: number;
    debug?: Debug;
}

export type RunOptions = {
    agent: Agent;
    messages: Message[];
    context_variables?: ContextVariables;
    model_override?: string;
    max_turns?: number;
    execute_tools?: boolean;
};

export type AgentFunctionReturn = string | Agent | Result;

export interface ChatCompletionChoice
{
    index: number;
    message: ChatCompletionMessage;
    finish_reason: string;
}

export enum ToolChoice
{
    'none' = 'none',
    'auto' = 'auto',
    'required' = 'required'
}