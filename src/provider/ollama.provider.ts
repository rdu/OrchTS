import { Ollama } from 'ollama';
import { ChatCompletionMessage, LLMProvider, LLMProviderParams } from '../types.js';

interface Message
{
    role: string;
    content: string;
    tool_calls?: ToolCall[];
}

interface ToolCall
{
    id: string;
    type: 'function';
    function: {
        name: string;
        arguments: string;
    };
}

interface OllamaResponse
{
    message: Message;
}

export class OpenOllamaProvider implements LLMProvider
{
    private model: string;
    private host?: string;

    constructor(model: string = 'llama3.2', host?: string)
    {
        this.model = model;
        this.host = host;
    }

    async generateCompletion(params: LLMProviderParams): Promise<ChatCompletionMessage>
    {
        try
        {
            // Initialize Ollama client with optional custom host
            const client = new Ollama({ host: this.host });

            // First call to get model's initial response with potential tool calls
            const initialResponse = await client.chat({
                model: this.model,
                messages: params.messages as any,
                tools: params.tools,
                ...(params.tool_choice && { tool_choice: params.tool_choice })
            }) as OllamaResponse;

            const responseMessage = initialResponse.message;

            // If no tool calls, return the response directly
            if (!responseMessage.tool_calls || responseMessage.tool_calls.length === 0)
            {
                return {
                    role: responseMessage.role as any,
                    content: responseMessage.content
                };
            }

            // Process tool calls if present
            const updatedMessages = [...params.messages];
            updatedMessages.push(responseMessage as any);

            // Add tool responses to messages
            for (const toolCall of responseMessage.tool_calls)
            {
                if (params.tools)
                {
                    const tool = params.tools.find(t =>
                        t.function && t.function.name === toolCall.function.name
                    );

                    if (tool && tool.function.callback)
                    {
                        try
                        {
                            const args = JSON.parse(toolCall.function.arguments);
                            const toolResponse = await tool.function.callback(args);

                            updatedMessages.push({
                                role: 'tool',
                                content: typeof toolResponse === 'string'
                                    ? toolResponse
                                    : JSON.stringify(toolResponse),
                                tool_call_id: toolCall.id
                            });
                        } catch (error)
                        {
                            console.error(`Error executing tool ${toolCall.function.name}:`, error);
                            updatedMessages.push({
                                role: 'tool',
                                content: JSON.stringify({ error: 'Tool execution failed' }),
                                tool_call_id: toolCall.id
                            });
                        }
                    }
                }
            }

            // Final call to get model's response after tool execution
            const finalResponse = await client.chat({
                model: this.model,
                messages: updatedMessages as any,
            }) as OllamaResponse;

            return {
                role: finalResponse.message.role as any,
                content: finalResponse.message.content,
                tool_calls: finalResponse.message.tool_calls
            };

        } catch (error)
        {
            console.error('Error in OpenOllamaProvider:', error);
            throw new Error(`OpenOllamaProvider error:` + error);
        }
    }
}