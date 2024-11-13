import { Agent } from '../agent.js';
import { AgentFunction, FunctionBase } from '../functions.js';
import { OrchTS } from '../orchts.js';
import { LLMProvider, Message, RunOptions } from '../types.js';

// Mock-Klassen
class MockAgent extends Agent
{
    constructor(name: string)
    {
        super({
            name,
            instructions: 'Mock instructions',
            llmProvider: {} as LLMProvider,
        });
    }
}

class MockFunctions extends FunctionBase
{
    @AgentFunction('Mock function')
    mockFunction(param: string): string
    {
        return `Mocked: ${param}`;
    }
}

describe('OrchTS', () =>
{
    let orchts: OrchTS;
    let mockAgent: MockAgent;
    let mockFunctions: MockFunctions;

    beforeEach(() =>
    {
        orchts = new OrchTS({ debug: false, defaultLLMProvider: {} as LLMProvider });
        mockAgent = new MockAgent('MockAgent');
        mockFunctions = new MockFunctions();
        mockAgent.appendFunction(mockFunctions.mockFunction);
    });

    it('should initialize correctly', () =>
    {
        expect(orchts).toBeDefined();
    });

    it('should run a simple conversation', async () =>
    {
        const messages: Message[] = [{ role: 'user', content: 'Hello' }];
        const runOptions: RunOptions = {
            agent: mockAgent,
            messages: messages,
        };

        // Mock the LLMProvider's generateCompletion method
        if (!mockAgent?.llmProvider) throw new Error('LLMProvider not found');
        mockAgent.llmProvider.generateCompletion = jest.fn().mockResolvedValue({
            role: 'assistant',
            content: 'Hello, how can I help you?',
        });

        const response = await orchts.run(runOptions);

        expect(response).toBeDefined();
        expect(response.messages).toHaveLength(2);
        expect(response.messages[1].content).toBe('Hello, how can I help you?');
    });

    it('should handle tool calls', async () =>
    {
        const messages: Message[] = [{ role: 'user', content: 'Use the mock function' }];
        const runOptions: RunOptions = {
            agent: mockAgent,
            messages: messages,
        };

        // Mock the LLMProvider's generateCompletion method to return a tool call
        if (!mockAgent?.llmProvider) throw new Error('LLMProvider not found');
        mockAgent.llmProvider.generateCompletion = jest.fn()
            .mockResolvedValueOnce({
                role: 'assistant',
                content: null,
                tool_calls: [{
                    id: '1',
                    type: 'function',
                    function: {
                        name: 'mockFunction',
                        arguments: JSON.stringify({ param: 'test' }),
                    },
                }],
            })
            .mockResolvedValueOnce({
                role: 'assistant',
                content: 'Function called successfully',
            });

        const response = await orchts.run(runOptions);

        expect(response).toBeDefined();
        expect(response.messages).toHaveLength(4); // User, Assistant (tool call), Tool, Assistant (final)
        expect(response.messages[2].content).toBe('Mocked: test');
        expect(response.messages[3].content).toBe('Function called successfully');
    });

    it('should respect max_turns', async () =>
    {
        const messages: Message[] = [{ role: 'user', content: 'Start conversation' }];
        const runOptions: RunOptions = {
            agent: mockAgent,
            messages: messages,
            max_turns: 2,
        };

        // Mock the LLMProvider to always return a tool call
        if (!mockAgent?.llmProvider) throw new Error('LLMProvider not found');
        mockAgent.llmProvider.generateCompletion = jest.fn().mockResolvedValue({
            role: 'assistant',
            content: null,
            tool_calls: [{
                id: '1',
                type: 'function',
                function: {
                    name: 'mockFunction',
                    arguments: JSON.stringify({ param: 'test' }),
                },
            }],
        });

        const response = await orchts.run(runOptions);

        expect(response).toBeDefined();
        expect(response.messages.length).toBeLessThanOrEqual(5); // User + 2 * (Assistant + Tool)
    });

    it('should handle context variables', async () =>
    {
        const messages: Message[] = [{ role: 'user', content: 'Hello' }];
        const runOptions: RunOptions = {
            agent: mockAgent,
            messages: messages,
            context_variables: { testVar: 'testValue' },
        };

        if (!mockAgent?.llmProvider) throw new Error('LLMProvider not found');
        mockAgent.llmProvider.generateCompletion = jest.fn().mockResolvedValue({
            role: 'assistant',
            content: 'Response with context',
        });

        const response = await orchts.run(runOptions);

        expect(response).toBeDefined();
        expect(response.context_variables).toHaveProperty('testVar', 'testValue');
    });

    it('should handle LLM provider errors', async () =>
    {
        const messages: Message[] = [{ role: 'user', content: 'Trigger error' }];
        const runOptions: RunOptions = {
            agent: mockAgent,
            messages: messages,
        };

        if (!mockAgent?.llmProvider) throw new Error('LLMProvider not found');
        mockAgent.llmProvider.generateCompletion = jest.fn().mockRejectedValue(new Error('LLM error'));

        await expect(orchts.run(runOptions)).rejects.toThrow('LLM error');
    });
});