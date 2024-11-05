import { Ollama } from 'ollama';
import { ChatCompletionMessage, LLMProvider, LLMProviderParams } from '../types.js';

/**
 * Interface representing the message format expected by Ollama's API
 */
interface OllamaMessage
{
    role: string;
    content: string;
    images?: string[];
    tool_calls?: {
        id: string;
        type: 'function';
        function: {
            name: string;
            arguments: { [key: string]: any }; // eslint-disable-line @typescript-eslint/no-explicit-any
        };
    }[];
}

/**
 * Interface representing the response format from Ollama's API
 */
interface OllamaResponse
{
    message: OllamaMessage;
}

/**
 * Valid message roles for chat interactions
 */
type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

/**
 * Provider implementation for the Ollama language model service.
 * Handles communication with Ollama's API, including message transformation
 * and tool call processing.
 */
export class OllamaProvider implements LLMProvider
{
    private model: string;
    private host?: string;

    /**
     * Creates a new instance of the OllamaProvider
     * @param model - The name of the Ollama model to use (defaults to 'mistral')
     * @param host - Optional host URL for the Ollama service
     */
    constructor(model: string = 'mistral', host?: string)
    {
        this.model = model;
        this.host = host;
    }

    /**
     * Transforms the internal message format to Ollama's expected format
     * @param messages - Array of messages to transform
     * @returns Array of messages in Ollama's format
     * @private
     */
    private transformMessagesForOllama(messages: Array<any>): OllamaMessage[] // eslint-disable-line @typescript-eslint/no-explicit-any
    {
        return messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            ...(msg.tool_calls && {
                tool_calls: msg.tool_calls.map((tool: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
                    id: tool.id,
                    type: 'function',
                    function: {
                        name: tool.function.name,
                        arguments: JSON.parse(tool.function.arguments)
                    }
                }))
            })
        }));
    }

    /**
     * Transforms tool calls from Ollama's format to the internal format
     * @param toolCalls - Array of tool calls from Ollama's response
     * @returns Transformed tool calls array or undefined if no tools were called
     * @private
     */
    private transformToolCallsForResponse(toolCalls: any[] | undefined): any[] | undefined // eslint-disable-line @typescript-eslint/no-explicit-any
    {
        if (!toolCalls) { return undefined; }

        return toolCalls.map(tool => ({
            id: tool.id,
            type: tool.type,
            function: {
                name: tool.function.name,
                arguments: JSON.stringify(tool.function.arguments)
            }
        }));
    }

    /**
     * Validates and ensures that the role is one of the allowed message roles
     * @param role - Role string to validate
     * @returns Valid MessageRole, defaults to 'assistant' if invalid
     * @private
     */
    private ensureValidRole(role: string): MessageRole
    {
        const validRoles: MessageRole[] = ['user', 'assistant', 'system', 'tool'];

        return validRoles.includes(role as MessageRole)
            ? (role as MessageRole)
            : 'assistant';
    }

    /**
     * Generates a completion using the Ollama API
     * @param params - Parameters for the completion request including messages and tool configurations
     * @returns Promise resolving to a ChatCompletionMessage
     * @throws Error if the API request fails
     */
    async generateCompletion(params: LLMProviderParams): Promise<ChatCompletionMessage>
    {
        try
        {
            // Initialize Ollama client with optional custom host
            const client = new Ollama({ host: this.host });

            // Transform messages to match Ollama's expected format
            const ollamaMessages = this.transformMessagesForOllama(params.messages);

            // Make the API call with transformed parameters
            const response = await client.chat({
                model: this.model,
                messages: ollamaMessages,
                tools: params.tools,
                ...(params.tool_choice && { tool_choice: params.tool_choice })
            }) as OllamaResponse;

            // Transform the response to match expected format
            return {
                role: this.ensureValidRole(response.message.role),
                content: response.message.content || '',
                tool_calls: this.transformToolCallsForResponse(response.message.tool_calls)
            };

        }
        catch (error)
        {
            console.error('Error in OllamaProvider:', error);
            throw new Error(`OllamaProvider error: ${(error as any).message}`); // eslint-disable-line @typescript-eslint/no-explicit-any
        }
    }
}