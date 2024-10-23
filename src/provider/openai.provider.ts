import OpenAI from 'openai';
import { LLMProvider, LLMProviderParams, ChatCompletionMessage, Message, Debug } from '../types';
import createLogger from '../logger';

/**
 * OpenAIProvider is responsible for interacting with the OpenAI API
 * to generate chat completions based on the provided messages and tools.
 */
export class OpenAIProvider implements LLMProvider
{
    private client: OpenAI;
    private logger!: ReturnType<typeof createLogger>;
    private model: string;

    /**
     * Initializes the OpenAI client and logger.
     * @param options - An object containing optional parameters: apiKey, model, and debug.
     */
    constructor(options: { apiKey?: string; model?: string; debug?: Debug } = {})
    {
        const { apiKey, model = 'gpt-4o-mini', debug = false } = options;

        // Initialize the OpenAI client with the provided API key.
        this.client = new OpenAI({ apiKey });

        // Set the model to use.
        this.model = model;

        // Create a logger with the appropriate log level based on the debug option.
        this.logger = createLogger(debug === true ? 'debug' : debug === false ? 'error' : debug);
    }

    /**
     * Converts a function definition to ensure type names are in lowercase,
     * making it compatible with the OpenAI API.
     * @param tool - The tool containing the function definition to convert.
     * @returns The converted function definition.
     */
    private convertFunctionDefinition(tool: OpenAI.ChatCompletionTool): OpenAI.ChatCompletionTool
    {
        // Validate that the tool is a function and has a function object.
        if (tool.type !== 'function' || typeof tool.function !== 'object')
        {
            // Log an error if the function definition is invalid.
            this.logger.error('Invalid function definition encountered in convertFunctionDefinition', { tool });
            throw new Error('Invalid function definition');
        }

        // Create a shallow copy of the function object.
        const convertedFunction = { ...tool.function };

        // Ensure that parameter types are in lowercase.
        if (convertedFunction.parameters && typeof convertedFunction.parameters === 'object')
        {
            if (convertedFunction.parameters.properties && typeof convertedFunction.parameters.properties === 'object')
            {
                // Convert each property's type to lowercase.
                convertedFunction.parameters.properties = Object.fromEntries(
                    Object.entries(convertedFunction.parameters.properties).map(([key, value]) => [
                        key,
                        {
                            ...value,
                            type: typeof value.type === 'string' ? value.type.toLowerCase() : value.type
                        }
                    ])
                );
            }
        }

        // Return the converted function definition.
        return {
            type: 'function',
            function: convertedFunction
        };
    }

    /**
     * Converts internal Message objects to the format expected by the OpenAI API.
     * @param messages - The array of messages to convert.
     * @returns An array of OpenAI-compatible message parameters.
     */
    private convertMessages(messages: Message[]): OpenAI.ChatCompletionMessageParam[]
    {
        const res = messages.map(msg =>
        {
            switch (msg.role)
            {
                case 'system':
                    // Convert system messages directly.
                    return { role: 'system', content: msg.content };
                case 'user':
                    // Convert user messages directly.
                    return { role: 'user', content: msg.content };
                case 'assistant':
                    // Convert assistant messages, including any tool calls.
                    const assistantMessage: OpenAI.ChatCompletionAssistantMessageParam = {
                        role: 'assistant'
                    };

                    if (msg.tool_calls && msg.tool_calls.length > 0)
                    {
                        // Include tool calls in the assistant message.
                        assistantMessage.tool_calls = msg.tool_calls.map(toolCall => ({
                            id: toolCall.id,
                            function: {
                                name: toolCall.function.name,
                                arguments: toolCall.function.arguments
                            },
                            type: 'function'
                        }));
                    }
                    if (msg.content)
                    {
                        assistantMessage.content = msg.content;
                    }

                    return assistantMessage;
                case 'tool':
                    // Convert tool messages.
                    return {
                        role: 'tool',
                        content: msg.content,
                        tool_call_id: msg.tool_call_id
                    } as OpenAI.ChatCompletionToolMessageParam;
                default:
                    // Log an error if an unsupported message role is encountered.
                    this.logger.error('Unsupported message role encountered in convertMessages', { role: msg.role });
                    throw new Error(`Unsupported message role: ${msg.role}`);
            }
        });

        return res as OpenAI.ChatCompletionMessageParam[];
    }

    /**
     * Sends a completion request to the OpenAI API and returns the response.
     * @param params - Parameters including messages, tools, and tool choices.
     * @returns The chat completion message from OpenAI.
     */
    async generateCompletion(params: LLMProviderParams): Promise<ChatCompletionMessage>
    {
        try
        {
            // Convert function definitions to OpenAI format.
            const tools = params.tools?.map(this.convertFunctionDefinition);

            // Log the parameters sent to OpenAI API at 'debug' level.
            this.logger.debug('Sending completion request to OpenAI API', {
                model: this.model,
                messages: params.messages,
                tools: tools,
                tool_choice: params.tool_choice
            });

            // Send the completion request to OpenAI API.
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: this.convertMessages(params.messages),
                tools: tools,
                tool_choice: params.tool_choice || undefined
            });

            // Log the response from OpenAI API at 'trace' level.
            this.logger.trace('Received response from OpenAI API', { response });

            // Check if any choices are returned.
            if (response.choices && response.choices.length > 0)
            {
                const choice = response.choices[0];

                // Log the selected choice at 'debug' level.
                this.logger.debug('Selected completion choice', { choice });

                return {
                    role: choice.message.role,
                    content: choice.message.content || '',
                    tool_calls: choice.message.tool_calls
                };
            }
            else
            {
                // Log a warning if no choices are returned.
                this.logger.warn('No completion choices returned from OpenAI');
                throw new Error('No completion choices returned from OpenAI');
            }
        }
        catch (error)
        {
            // Log the error at 'error' level.
            this.logger.error('Error in OpenAI completion', { error });
            throw error;
        }
    }
}
