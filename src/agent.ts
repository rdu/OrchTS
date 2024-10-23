import { FunctionMetadata } from './functions.js';
import { ContextVariables, Debug, LLMProvider, ToolChoice } from './types.js';

/**
 * The `Agent` class represents an AI agent with specific parameters such as name, instructions,
 * associated functions, and a language model provider.
 */
export class Agent
{
    /**
     * Constructs a new `Agent` instance with the given parameters.
     * If no language model provider is specified, it defaults to `OpenAIProvider`.
     * @param params - Configuration parameters for the agent.
     */
    constructor(public readonly params: {
        name: string,
        instructions: string | ((contextVariables: ContextVariables) => string),
        functions?: Array<Function>,
        llmProvider?: LLMProvider,
        tool_choice?: ToolChoice | null,
        debug?: Debug
    })
    { }

    /**
     * Retrieves the agent's name.
     */
    get name()
    {
        return this.params.name;
    }

    /**
     * Retrieves the language model provider associated with the agent.
     */
    get llmProvider()
    {
        return this.params.llmProvider;
    }

    /**
     * Generates and retrieves the instructions for the agent, possibly using context variables.
     * @param contextVariables - Variables that provide context for generating instructions.
     * @returns The instructions as a string.
     */
    getInstructions(contextVariables: ContextVariables): string
    {
        // If instructions are provided as a function, execute it with context variables.
        if (typeof this.params.instructions === 'function')
        {
            return this.params.instructions(contextVariables);
        }

        // Otherwise, return the instructions string directly.
        return this.params.instructions;
    }

    /**
     * Retrieves metadata for the functions associated with the agent.
     * @returns An array of `FunctionMetadata` objects.
     */
    getFunctionMetadata(): Array<FunctionMetadata> 
    {
        // Map each function to its metadata, if functions are defined.
        return this?.params?.functions?.map((f) => (f as any)?.functionMetadata) || []; // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    /**
     * Appends a new function to the agent's list of functions.
     * @param func - The function to be added.
     * @throws Will throw an error if the provided argument is not a function.
     */
    appendFunction(func: Function)
    {
        // Validate that the provided argument is a function.
        if (typeof func !== 'function') { throw new Error('Invalid function'); }
        // Initialize the functions array if it doesn't exist.
        this.params.functions = this.params.functions || [];
        // Add the new function to the array.
        this.params.functions.push(func);
    }
}
