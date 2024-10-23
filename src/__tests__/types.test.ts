import
{
    Message,
    Result,
    LLMProviderParams,
    LLMProvider,
    Response,
    ContextVariables,
    ToolCall,
    ChatCompletionMessage,
    OrchTSConfig,
    RunOptions,
    AgentFunctionReturn,
    ToolChoice
} from '../types';
import { Agent } from '../agent';

describe('Types', () =>
{
    describe('Message', () =>
    {
        it('should have the correct structure', () =>
        {
            const message: Message = {
                role: 'user',
                content: 'Hello',
                sender: 'John',
                tool_calls: [{ id: '1', function: { name: 'test', arguments: '{}' }, type: 'function' }],
                tool_call_id: '1',
                tool_name: 'test'
            };
            expect(message).toBeDefined();
        });
    });

    describe('Result', () =>
    {
        it('should have the correct structure', () =>
        {
            const mockAgent = {} as Agent;
            const result: Result = {
                value: 'test',
                agent: mockAgent,
                context_variables: { test: 'value' },
                messages: [{ role: 'user', content: 'test' }]
            };
            expect(result).toBeDefined();
        });
    });

    describe('LLMProviderParams', () =>
    {
        it('should have the correct structure', () =>
        {
            const params: LLMProviderParams = {
                messages: [{ role: 'user', content: 'test' }],
                tools: [],
                tool_choice: ToolChoice.auto
            };
            expect(params).toBeDefined();
        });
    });

    describe('LLMProvider', () =>
    {
        it('should have the correct methods', () =>
        {
            const provider: LLMProvider = {
                generateCompletion: jest.fn(),
            };
            expect(provider.generateCompletion).toBeDefined();
        });
    });

    describe('Response', () =>
    {
        it('should have the correct structure', () =>
        {
            const mockAgent = {} as Agent;
            const response: Response = {
                messages: [{ role: 'user', content: 'test' }],
                agent: mockAgent,
                context_variables: { test: 'value' }
            };
            expect(response).toBeDefined();
        });
    });

    describe('ContextVariables', () =>
    {
        it('should be a record of string to any', () =>
        {
            const contextVars: ContextVariables = {
                test: 'value',
                number: 42,
                boolean: true
            };
            expect(contextVars).toBeDefined();
        });
    });

    describe('ToolCall', () =>
    {
        it('should have the correct structure', () =>
        {
            const toolCall: ToolCall = {
                id: '1',
                function: { name: 'test', arguments: '{}' },
                type: 'function'
            };
            expect(toolCall).toBeDefined();
        });
    });

    describe('ChatCompletionMessage', () =>
    {
        it('should extend Message and have tool_call_id', () =>
        {
            const message: ChatCompletionMessage = {
                role: 'assistant',
                content: 'Hello',
                tool_call_id: '1'
            };
            expect(message).toBeDefined();
        });
    });

    describe('OrchTSConfig', () =>
    {
        it('should have the correct structure', () =>
        {
            const mockAgent = {} as Agent;
            const mockLLMProvider = {} as LLMProvider;
            const config: OrchTSConfig = {
                defaultLLMProvider: mockLLMProvider,
                maxTurns: 10,
                debug: true
            };
            expect(config).toBeDefined();
        });
    });

    describe('RunOptions', () =>
    {
        it('should have the correct structure', () =>
        {
            const mockAgent = {} as Agent;
            const options: RunOptions = {
                agent: mockAgent,
                messages: [{ role: 'user', content: 'test' }],
                context_variables: { test: 'value' },
                model_override: 'gpt-4',
                max_turns: 5,
                execute_tools: true
            };
            expect(options).toBeDefined();
        });
    });

    describe('AgentFunctionReturn', () =>
    {
        it('should allow string, Agent, or Result', () =>
        {
            const stringReturn: AgentFunctionReturn = 'test';
            const agentReturn: AgentFunctionReturn = {} as Agent;
            const resultReturn: AgentFunctionReturn = { value: 'test' };
            expect(stringReturn).toBeDefined();
            expect(agentReturn).toBeDefined();
            expect(resultReturn).toBeDefined();
        });
    });

    describe('ToolChoice', () =>
    {
        it('should have the correct enum values', () =>
        {
            expect(ToolChoice.none).toBe('none');
            expect(ToolChoice.auto).toBe('auto');
            expect(ToolChoice.required).toBe('required');
        });
    });
});