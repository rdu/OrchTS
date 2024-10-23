import { ChatCompletionMessage, ContextVariables, LLMProvider, LLMProviderParams, Message, OrchTSConfig, Response, Result, RunOptions, ToolCall } from './types.js';
import createLogger from './logger.js';
import { Agent } from './agent.js';
import { FunctionMetadata } from './functions.js';
import { OpenAIProvider } from './provider/openai.provider.js';

/**
 * OrchTS - Main orchestrator class that manages interactions between agents, messages, and tools.
 * Handles the communication flow between LLM providers and tool executions in a conversational context.
 */
export class OrchTS
{
    /** Logger instance initialized later based on debug level */
    private logger!: ReturnType<typeof createLogger>;
    private readonly config: OrchTSConfig & { defaultLLMProvider: LLMProvider };

    constructor(config?: OrchTSConfig)
    {
        let { debug, defaultLLMProvider } = config || {};

        if (!defaultLLMProvider) { defaultLLMProvider = new OpenAIProvider({ debug }); }
        this.config = { defaultLLMProvider, ...config };

        this.logger = createLogger(this.config.debug === true ? 'debug' : this.config.debug === false ? 'error' : this.config.debug || 'debug');
    }

    /**
     * Executes the main orchestration loop with the provided configuration options.
     * 
     * @param opts - Configuration options for the orchestration run
     * @param opts.agent - Initial agent to handle the conversation
     * @param opts.messages - Initial set of messages to process
     * @param opts.context_variables - Initial context variables for the conversation
     * @param opts.max_turns - Maximum number of conversation turns (defaults to Infinity)
     * @param opts.execute_tools - Whether to execute tool calls (defaults to true)
     * @returns Promise containing the final response with agent, messages, and context variables
     * @throws Error if any step in the orchestration process fails
     */
    public async run(opts: RunOptions): Promise<Response>
    {
        // Destructure options with default values
        const {
            agent: initialAgent,
            messages: initialMessages,
            context_variables = {},
            max_turns = Infinity,
            execute_tools = true
        } = opts;

        // Deep copy of messages and context variables to avoid mutation
        const messages = JSON.parse(JSON.stringify(initialMessages));
        let contextVariables = JSON.parse(JSON.stringify(context_variables));

        // Set the initial active agent and turn count
        let activeAgent = initialAgent;
        let turnCount = 0;

        // Log the start of the OrchTS run
        this.logger.info('Starting OrchTS run', {
            initialAgent: initialAgent.name,
            messageCount: messages.length,
            contextVariablesKeys: Object.keys(contextVariables),
            maxTurns: max_turns,
            executeTools: execute_tools
        });

        // Main loop - continue until max turns reached or break condition met
        while (turnCount < max_turns)
        {
            this.logger.debug({
                msg: 'Starting new turn',
                turnCount,
                activeAgent: activeAgent.name
            });

            try
            {
                // Get chat completion from LLM provider
                const completion = await this.getChatCompletion(
                    activeAgent,
                    messages,
                    contextVariables
                );

                // Process the LLM response and add to message history
                const llmMessage = this.processLLMResponse({ completion, activeAgent });

                messages.push(llmMessage);

                this.logger.debug({
                    msg: 'Received LLM response',
                    content: llmMessage?.content || 'No content',
                    hasToolCalls: (llmMessage?.tool_calls?.length || 0) > 0
                });

                // Check for function calls and execute if necessary
                if ((llmMessage?.tool_calls?.length || 0) > 0 && execute_tools)
                {
                    const toolCallResult = await this.handleToolCalls(
                        llmMessage.tool_calls || [],
                        activeAgent.getFunctionMetadata(),
                        contextVariables
                    );

                    // Update context variables and potentially switch the active agent
                    contextVariables = { ...contextVariables, ...toolCallResult.context_variables };
                    if (toolCallResult.agent && toolCallResult.agent !== activeAgent)
                    {
                        activeAgent = toolCallResult.agent;
                        this.logger.info({
                            msg: 'Switching active agent',
                            newAgent: activeAgent.name
                        });
                    }

                    messages.push(...toolCallResult.messages);
                }
                else
                {
                    // If no tool calls or execute_tools is false, end the loop
                    break;
                }

                turnCount++;
            }
            catch (error)
            {
                // Log errors encountered during the run
                this.logger.error({
                    msg: 'Error during OrchTS run',
                    error: error instanceof Error ? error.message : String(error),
                    turnCount
                });
                throw error;
            }
        }

        // Log the end of the OrchTS run
        this.logger.info({
            msg: 'OrchTS run completed',
            totalTurns: turnCount,
            finalAgent: activeAgent.name
        });

        return {
            agent: activeAgent,
            messages,
            context_variables: contextVariables
        };
    }

    /**
     * Retrieves a chat completion from the LLM provider using the current context.
     * 
     * @param agent - Active agent handling the conversation
     * @param messages - Current message history
     * @param contextVariables - Current context variables
     * @returns Promise containing the chat completion message
     * @private
     */
    private async getChatCompletion(
        agent: Agent,
        messages: Message[],
        contextVariables: ContextVariables
    ): Promise<ChatCompletionMessage | undefined>
    {
        const functions = agent.getFunctionMetadata();
        const tools = functions.map(this.functionToObject);
        const instructions = agent.getInstructions(contextVariables);

        // Prepare messages array with system instructions
        const updatedMessages = [
            { role: 'system', content: instructions },
            ...messages
        ];

        // Prepare parameters for LLM provider
        const params: LLMProviderParams = {
            messages: updatedMessages as Message[],
            tools: tools.length > 0 ? tools : undefined,
            tool_choice: agent.params.tool_choice || null
        };

        // Log the parameters sent to LLM provider
        this.logger.trace({
            msg: 'Sending request to LLM provider',
            agentName: agent.name,
            params
        });

        const llmProvider = agent.params.llmProvider || this.config.defaultLLMProvider;
        const completion = await llmProvider.generateCompletion(params);

        this.logger.debug({
            msg: 'Received completion from LLM provider',
            completion
        });

        return completion;
    }

    /**
     * Converts FunctionMetadata to a function object format compatible with LLM providers.
     * Handles special cases like ContextVariables and optional parameters.
     * 
     * @param func - Function metadata to convert
     * @returns Object containing the function specification in LLM provider format
     * @private
     */
    private functionToObject(func: FunctionMetadata): any // eslint-disable-line @typescript-eslint/no-explicit-any
    {
        return {
            type: 'function',
            function: {
                name: func.name,
                description: func.description || `function: ${func.name}`,
                parameters: {
                    type: 'object',
                    properties: func.params.reduce((acc, param) =>
                    {
                        if (param.type === 'ContextVariables')
                        {
                            // Skip ContextVariables type in properties
                            return acc;
                        }
                        acc[param.name] = {
                            type: param.type
                        };
                        if (param.description)
                        {
                            acc[param.name].description = param.description;
                        }

                        return acc;
                    }, {} as Record<string, any>), // eslint-disable-line @typescript-eslint/no-explicit-any
                    required: func.params
                        .filter(param => !param.optional && param.type !== 'ContextVariables')
                        .map(param => param.name)
                }
            }
        };
    }

    /**
     * Processes the LLM response and formats it into a standardized Message object.
     * Handles cases where completion might be undefined or contains tool calls.
     * 
     * @param params - Parameters containing completion and active agent
     * @returns Formatted message object
     * @private
     */
    private processLLMResponse(params: { completion?: ChatCompletionMessage, activeAgent: Agent }): Message
    {
        const { completion, activeAgent } = params;

        if (!completion)
        {
            // Return a default message if no completion is provided
            return {
                role: 'assistant',
                content: 'No completion provided'
            };
        }
        const message: Message = {
            role: 'assistant',
            content: completion.content || '',
            sender: activeAgent.name,
            tool_calls: []
        };

        // Extract tool calls from the completion if present
        if (completion.tool_calls && completion.tool_calls.length > 0)
        {
            message.tool_calls = completion.tool_calls.map(toolCall => ({
                id: toolCall.id,
                function: {
                    name: toolCall.function.name,
                    arguments: toolCall.function.arguments
                },
                type: toolCall.type
            }));
        }

        return message;
    }

    /**
     * Handles the execution of tool calls from the LLM response.
     * Manages function execution, error handling, and result processing.
     * 
     * @param toolCalls - Array of tool calls to execute
     * @param functions - Available function metadata
     * @param contextVariables - Current context variables
     * @returns Promise containing messages, updated agent, and context variables
     * @private
     */
    private async handleToolCalls(
        toolCalls: ToolCall[],
        functions: FunctionMetadata[],
        contextVariables: ContextVariables
    ): Promise<{ messages: Message[], agent?: Agent, context_variables: ContextVariables }>
    {
        // Create a map of function names to their metadata for quick lookup
        const functionMap = new Map(functions.map(f => [f.name, f]));

        // Initialize partial response object to collect messages, agent, and context variables
        const partialResponse: {
            messages: Message[],
            agent?: Agent,
            context_variables: ContextVariables
        } = {
            messages: [],
            context_variables: { ...contextVariables }
        };

        // Process each tool call sequentially
        for (const toolCall of toolCalls)
        {
            const name = toolCall.function.name;

            if (!functionMap.has(name))
            {
                this.logger.warn({
                    msg: 'Tool not found',
                    toolName: name
                });
                partialResponse.messages.push({
                    role: 'tool',
                    content: `Error: Tool ${name} not found.`,
                    tool_call_id: toolCall.id,
                    tool_name: name
                });
                continue;
            }

            const funcMetadata = functionMap.get(name)!;
            const args = JSON.parse(toolCall.function.arguments);

            // Inject context variables if needed
            const contextVarParam = funcMetadata.params.find(param => param.type === 'ContextVariables');

            if (contextVarParam)
            {
                args[contextVarParam.name] = contextVariables;
            }

            try
            {
                this.logger.debug({ msg: `Executing function ${funcMetadata.name}`, args: args });

                // Execute the function and process its result
                const rawResult = await funcMetadata.func(...Object.values(args));
                const result = this.handleFunctionResult(rawResult);

                this.logger.info({
                    msg: `Function ${funcMetadata.name} executed successfully`,
                    result: result.value
                });

                // Update response with function results
                partialResponse.messages.push({
                    role: 'tool',
                    content: result.value || '',
                    tool_call_id: toolCall.id,
                    tool_name: name
                });

                if (result.agent)
                {
                    partialResponse.agent = result.agent;
                }

                if (result.messages)
                {
                    partialResponse.messages = [
                        ...partialResponse.messages,
                        ...result.messages
                    ];
                }

            }
            catch (error)
            {
                this.logger.error(`Error executing function ${name}: ${error}`);
                partialResponse.messages.push({
                    role: 'tool',
                    content: `Error executing function ${name}: ${error}`,
                    tool_call_id: toolCall.id,
                    tool_name: name
                });
            }
        }

        return partialResponse;
    }

    /**
     * Processes and standardizes the result returned by a function execution.
     * Handles different return types (Result object, Agent instance, or string-convertible value).
     * 
     * @param result - Raw result from function execution
     * @returns Standardized Result object
     * @throws TypeError if result cannot be properly processed
     * @private
     */
    private handleFunctionResult(result: any): Result // eslint-disable-line @typescript-eslint/no-explicit-any
    {
        if (this.isResult(result))
        {
            // If result is already a Result object, return it
            return result;
        }
        if (result instanceof Agent)
        {
            // If result is an Agent instance, return a Result with the agent
            return {
                value: JSON.stringify({ assistant: result.name }),
                agent: result,
                context_variables: {}
            };
        }
        try
        {
            // Try to convert the result to a string
            return {
                value: String(result),
                context_variables: {}
            };
        }
        catch (e) // eslint-disable-line @typescript-eslint/no-unused-vars
        {
            const errorMessage = `Failed to cast response to string: ${result}. Make sure agent functions return a string, Agent, or Result object.`;

            this.logger.error(errorMessage);
            throw new TypeError(errorMessage);
        }
    }

    /**
     * Type guard to check if an object implements the Result interface.
     * 
     * @param obj - Object to check
     * @returns Boolean indicating if object is a valid Result
     * @private
     */
    private isResult(obj: any): obj is Result // eslint-disable-line @typescript-eslint/no-explicit-any
    {
        return (
            typeof obj === 'object' &&
            obj !== null &&
            'value' in obj &&
            typeof obj.value === 'string'
        );
    }
}