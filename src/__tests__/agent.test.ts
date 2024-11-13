import { Agent } from '../agent.js';
import { AgentFuncParam, AgentFunction, FunctionBase } from '../functions.js';
import { ContextVariables, LLMProvider, ToolChoice } from '../types.js';

class TestFunctions extends FunctionBase
{
    @AgentFunction('Test function')
    testFunction(@AgentFuncParam({ description: 'Test param' }) param: string): string
    {
        return `Hello, ${param}!`;
    }

    @AgentFunction('Another test function')
    anotherTestFunction(
        @AgentFuncParam({ description: 'Number param' }) num: number,
        @AgentFuncParam({ description: 'Optional param', optional: true }) opt?: string
    ): number
    {
        return num;
    }
}

describe('Agent', () =>
{
    let mockLLMProvider: jest.Mocked<LLMProvider>;

    beforeEach(() =>
    {
        mockLLMProvider = {
            generateCompletion: jest.fn(),
        };
        process.env.OPENAI_API_KEY = 'test-api';
    });

    it('should initialize with correct parameters', () =>
    {
        const agent = new Agent({
            name: 'TestAgent',
            instructions: 'Test instructions',
            llmProvider: mockLLMProvider,
        });

        expect(agent.name).toBe('TestAgent');
        expect(agent.llmProvider).toBe(mockLLMProvider);
    });

    it('should handle string instructions', () =>
    {
        const agent = new Agent({
            name: 'TestAgent',
            instructions: 'Test instructions',
            llmProvider: mockLLMProvider,
        });

        expect(agent.getInstructions({})).toBe('Test instructions');
    });

    it('should handle function instructions', () =>
    {
        const instructionFn = (vars: ContextVariables) => `Instructions with ${vars.test}`;
        const agent = new Agent({
            name: 'TestAgent',
            instructions: instructionFn,
            llmProvider: mockLLMProvider,
        });

        expect(agent.getInstructions({ test: 'variable' })).toBe('Instructions with variable');
    });

    it('should correctly append and retrieve functions', () =>
    {
        const agent = new Agent({
            name: 'TestAgent',
            instructions: 'Test instructions',
            llmProvider: mockLLMProvider,
        });

        const testFunctions = new TestFunctions();
        agent.appendFunction(testFunctions.testFunction);

        const functionMetadata = agent.getFunctionMetadata();
        expect(functionMetadata).toHaveLength(1);
        expect(functionMetadata[0].name).toBe('testFunction');
        expect(functionMetadata[0].description).toBe('Test function');
    });

    it('should handle multiple appended functions', () =>
    {
        const agent = new Agent({
            name: 'TestAgent',
            instructions: 'Test instructions',
        });

        const testFunctions = new TestFunctions();
        agent.appendFunction(testFunctions.testFunction);
        agent.appendFunction(testFunctions.anotherTestFunction);

        const functionMetadata = agent.getFunctionMetadata();
        expect(functionMetadata).toHaveLength(2);
        expect(functionMetadata[0].name).toBe('testFunction');
        expect(functionMetadata[1].name).toBe('anotherTestFunction');
    });

    it('should correctly handle optional parameters in function metadata', () =>
    {
        const agent = new Agent({
            name: 'TestAgent',
            instructions: 'Test instructions',
        });

        const testFunctions = new TestFunctions();
        agent.appendFunction(testFunctions.anotherTestFunction);

        const functionMetadata = agent.getFunctionMetadata();
        expect(functionMetadata[0].params).toHaveLength(2);
        expect(functionMetadata[0].params[0].optional).toBe(false);
        expect(functionMetadata[0].params[1].optional).toBe(true);
    });

    it('should handle tool choice settings', () =>
    {
        const agent = new Agent({
            name: 'TestAgent',
            instructions: 'Test instructions',
            tool_choice: ToolChoice.auto
        });

        expect(agent.params.tool_choice).toBe(ToolChoice.auto);
    });

    it('should handle empty function list', () =>
    {
        const agent = new Agent({
            name: 'TestAgent',
            instructions: 'Test instructions',
        });

        expect(agent.getFunctionMetadata()).toHaveLength(0);
    });

    it('should handle complex context variables in function instructions', () =>
    {
        const instructionFn = (vars: ContextVariables) =>
            `Instructions with ${vars.str}, ${vars.num}, and ${JSON.stringify(vars.obj)}`;

        const agent = new Agent({
            name: 'TestAgent',
            instructions: instructionFn,
        });

        const result = agent.getInstructions({
            str: 'string',
            num: 42,
            obj: { key: 'value' }
        });

        expect(result).toBe('Instructions with string, 42, and {"key":"value"}');
    });

    it('should throw error when appending non-function', () =>
    {
        const agent = new Agent({
            name: 'TestAgent',
            instructions: 'Test instructions',
        });

        expect(() =>
        {
            agent.appendFunction('not a function' as any);
        }).toThrow();
    });

});