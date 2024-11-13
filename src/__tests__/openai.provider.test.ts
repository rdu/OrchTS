// First, define the mock functions
const mockCreate = jest.fn();
const MockOpenAIConstructor = jest.fn(() => ({
    chat: {
        completions: {
            create: mockCreate
        }
    }
}));

// Then use them in the mock (Place this before any imports)
jest.mock('openai', () =>
{
    return {
        __esModule: true,
        default: MockOpenAIConstructor
    }
});

// Now import the modules you need
import { OpenAIProvider } from '../provider/openai.provider.js';
import { LLMProviderParams, Message, ChatCompletionMessage, ToolChoice } from '../types.js';

describe('OpenAIProvider', () =>
{
    let provider: OpenAIProvider;

    beforeEach(() =>
    {
        // Reset all mocks before each test
        jest.clearAllMocks();

        // Create new provider instance with test configuration
        provider = new OpenAIProvider({
            apiKey: 'test-key',
            model: 'test-model',
            debug: false
        });
    });

    describe('initialization', () =>
    {
        it('should create instance with default options', () =>
        {
            const defaultProvider = new OpenAIProvider();
            expect(defaultProvider).toBeInstanceOf(OpenAIProvider);
            expect(MockOpenAIConstructor).toHaveBeenCalled();
        });

        it('should create instance with custom options', () =>
        {
            const customProvider = new OpenAIProvider({
                apiKey: 'custom-key',
                model: 'custom-model',
                debug: true
            });
            expect(customProvider).toBeInstanceOf(OpenAIProvider);
            expect(MockOpenAIConstructor).toHaveBeenCalledWith({ apiKey: 'custom-key' });
        });
    });

    describe('generateCompletion', () =>
    {
        it('should handle basic completion request', async () =>
        {
            // Mock successful API response
            mockCreate.mockResolvedValueOnce({
                id: 'test-id',
                choices: [{
                    index: 0,
                    message: {
                        role: 'assistant',
                        content: 'Test response'
                    },
                    finish_reason: 'stop'
                }]
            });

            const params: LLMProviderParams = {
                messages: [{
                    role: 'user',
                    content: 'Hello'
                }],
                tools: [],
                tool_choice: null
            };

            const result = await provider.generateCompletion(params);
            expect(result).toBeDefined();
            expect(result.content).toBe('Test response');
            expect(mockCreate).toHaveBeenCalledTimes(1);
        });

        it('should handle API error gracefully', async () =>
        {
            // Mock API error
            mockCreate.mockRejectedValueOnce(new Error('API Error'));

            const params: LLMProviderParams = {
                messages: [{
                    role: 'user',
                    content: 'Hello'
                }],
                tools: [],
                tool_choice: null
            };

            await expect(provider.generateCompletion(params)).rejects.toThrow('API Error');
            expect(mockCreate).toHaveBeenCalledTimes(1);
        });

        it('should handle empty response', async () =>
        {
            // Mock response with no choices
            mockCreate.mockResolvedValueOnce({
                id: 'test-id',
                choices: []
            });

            const params: LLMProviderParams = {
                messages: [{
                    role: 'user',
                    content: 'Hello'
                }],
                tools: [],
                tool_choice: null
            };

            await expect(provider.generateCompletion(params)).rejects.toThrow('No completion choices returned from OpenAI');
            expect(mockCreate).toHaveBeenCalledTimes(1);
        });

        it('should handle completion request with tools', async () =>
        {
            // Mock successful API response
            mockCreate.mockResolvedValueOnce({
                id: 'test-id',
                choices: [{
                    index: 0,
                    message: {
                        role: 'assistant',
                        content: 'Test response with tools'
                    },
                    finish_reason: 'stop'
                }]
            });

            const params: LLMProviderParams = {
                messages: [{
                    role: 'user',
                    content: 'Hello with tools'
                }],
                tools: [{
                    type: 'function',
                    function: {
                        name: 'testFunction',
                        description: 'A test function',
                        parameters: {
                            type: 'object',
                            properties: {
                                input: { type: 'String', description: 'An input string' }
                            }
                        }
                    }
                }],
                tool_choice: null
            };

            const result = await provider.generateCompletion(params);
            expect(result).toBeDefined();
            expect(result.content).toBe('Test response with tools');
            expect(mockCreate).toHaveBeenCalledTimes(1);

            // Check that the tools were converted correctly
            const expectedTools = [{
                type: 'function',
                function: {
                    name: 'testFunction',
                    description: 'A test function',
                    parameters: {
                        type: 'object',
                        properties: {
                            input: { type: 'string', description: 'An input string' }
                        }
                    }
                }
            }];
            expect(mockCreate).toHaveBeenCalledWith({
                model: 'test-model',
                messages: expect.any(Array),
                tools: expectedTools,
                tool_choice: undefined
            });
        });

        it('should throw an error when invalid tool is provided', async () =>
        {
            const params: LLMProviderParams = {
                messages: [{
                    role: 'user',
                    content: 'Hello with invalid tool'
                }],
                tools: [{
                    type: 'function',
                    function: null // Invalid function
                } as any],
                tool_choice: null
            };

            await expect(provider.generateCompletion(params)).rejects.toThrow('Invalid function definition');
            expect(mockCreate).not.toHaveBeenCalled();
        });

        // Anpassung in 'should handle messages with role "tool"'
        it('should handle messages with role "tool"', async () =>
        {
            // Mock successful API response
            mockCreate.mockResolvedValueOnce({
                id: 'test-id',
                choices: [{
                    index: 0,
                    message: {
                        role: 'assistant',
                        content: 'Response to tool message'
                    },
                    finish_reason: 'stop'
                }]
            });

            const params: LLMProviderParams = {
                messages: [{
                    role: 'tool',
                    content: 'Tool message content',
                    tool_call_id: 'tool-call-id'
                }],
                tools: [],
                tool_choice: null
            };

            const result = await provider.generateCompletion(params);
            expect(result).toBeDefined();
            expect(result.content).toBe('Response to tool message');
            expect(mockCreate).toHaveBeenCalledTimes(1);

            // Check that the messages were converted correctly
            expect(mockCreate).toHaveBeenCalledWith({
                model: 'test-model',
                messages: [{
                    role: 'tool',
                    content: 'Tool message content',
                    tool_call_id: 'tool-call-id'
                }],
                tools: [],
                tool_choice: undefined
            });
        });

        // Anpassung in 'should handle completion request with tool_choice'
        it('should handle completion request with tool_choice', async () =>
        {
            // Mock successful API response
            mockCreate.mockResolvedValueOnce({
                id: 'test-id',
                choices: [{
                    index: 0,
                    message: {
                        role: 'assistant',
                        content: 'Response with tool_choice'
                    },
                    finish_reason: 'stop'
                }]
            });

            const params: LLMProviderParams = {
                messages: [{
                    role: 'user',
                    content: 'Hello with tool_choice'
                }],
                tools: [],
                tool_choice: 'testFunction' as any
            };

            const result = await provider.generateCompletion(params);
            expect(result).toBeDefined();
            expect(result.content).toBe('Response with tool_choice');
            expect(mockCreate).toHaveBeenCalledTimes(1);

            // Check that the tool_choice was passed correctly
            expect(mockCreate).toHaveBeenCalledWith({
                model: 'test-model',
                messages: expect.any(Array),
                tools: [],
                tool_choice: 'testFunction'
            });
        });
    });

    it('should handle tool with function.parameters undefined', async () =>
    {
        // Mock successful API response
        mockCreate.mockResolvedValueOnce({
            id: 'test-id',
            choices: [{
                index: 0,
                message: {
                    role: 'assistant',
                    content: 'Response with undefined parameters'
                },
                finish_reason: 'stop'
            }]
        });

        const params: LLMProviderParams = {
            messages: [{
                role: 'user',
                content: 'Test message'
            }],
            tools: [{
                type: 'function',
                function: {
                    name: 'testFunction',
                    description: 'Test function without parameters'
                    // parameters is undefined
                }
            }],
            tool_choice: null
        };

        const result = await provider.generateCompletion(params);
        expect(result.content).toBe('Response with undefined parameters');
        expect(mockCreate).toHaveBeenCalledTimes(1);

        // Prüfen, dass die Konvertierung korrekt durchgeführt wurde
        expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
            tools: [{
                type: 'function',
                function: {
                    name: 'testFunction',
                    description: 'Test function without parameters',
                    parameters: undefined
                }
            }]
        }));
    });

    it('should handle tool with function.parameters.properties undefined', async () =>
    {
        // Mock successful API response
        mockCreate.mockResolvedValueOnce({
            id: 'test-id',
            choices: [{
                index: 0,
                message: {
                    role: 'assistant',
                    content: 'Response with undefined properties'
                },
                finish_reason: 'stop'
            }]
        });

        const params: LLMProviderParams = {
            messages: [{
                role: 'user',
                content: 'Test message'
            }],
            tools: [{
                type: 'function',
                function: {
                    name: 'testFunction',
                    description: 'Test function with undefined properties',
                    parameters: {
                        type: 'object'
                        // properties is undefined
                    }
                }
            }],
            tool_choice: null
        };

        const result = await provider.generateCompletion(params);
        expect(result.content).toBe('Response with undefined properties');
        expect(mockCreate).toHaveBeenCalledTimes(1);

        expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
            tools: [{
                type: 'function',
                function: {
                    name: 'testFunction',
                    description: 'Test function with undefined properties',
                    parameters: {
                        type: 'object',
                        properties: undefined
                    }
                }
            }]
        }));
    });

    it('should handle tool with non-string property type', async () =>
    {
        mockCreate.mockResolvedValueOnce({
            id: 'test-id',
            choices: [{
                index: 0,
                message: {
                    role: 'assistant',
                    content: 'Response with non-string property type'
                },
                finish_reason: 'stop'
            }]
        });

        const params: LLMProviderParams = {
            messages: [{
                role: 'user',
                content: 'Test message'
            }],
            tools: [{
                type: 'function',
                function: {
                    name: 'testFunction',
                    description: 'Test function with non-string property type',
                    parameters: {
                        type: 'object',
                        properties: {
                            input: { type: 12345, description: 'A numeric type' }
                        }
                    }
                }
            }],
            tool_choice: null
        };

        const result = await provider.generateCompletion(params);
        expect(result.content).toBe('Response with non-string property type');
        expect(mockCreate).toHaveBeenCalledTimes(1);

        expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
            tools: [{
                type: 'function',
                function: {
                    name: 'testFunction',
                    description: 'Test function with non-string property type',
                    parameters: {
                        type: 'object',
                        properties: {
                            input: { type: 12345, description: 'A numeric type' }
                        }
                    }
                }
            }]
        }));
    });

    it('should handle assistant message with content but no tool_calls', async () =>
    {
        mockCreate.mockResolvedValueOnce({
            id: 'test-id',
            choices: [{
                index: 0,
                message: {
                    role: 'assistant',
                    content: 'Assistant message content'
                },
                finish_reason: 'stop'
            }]
        });

        const params: LLMProviderParams = {
            messages: [{
                role: 'assistant',
                content: 'Assistant message content'
            }],
            tools: [],
            tool_choice: null
        };

        const result = await provider.generateCompletion(params);
        expect(result.content).toBe('Assistant message content');
        expect(result.tool_calls).toBeUndefined();
        expect(mockCreate).toHaveBeenCalledTimes(1);

        expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
            messages: [{
                role: 'assistant',
                content: 'Assistant message content'
            }]
        }));
    });

    it('should log and rethrow unexpected errors', async () =>
    {
        jest.spyOn(provider as any, 'convertMessages').mockImplementation(() =>
        {
            throw new Error('Unexpected error in convertMessages');
        });

        const params: LLMProviderParams = {
            messages: [{
                role: 'user',
                content: 'Trigger unexpected error'
            }],
            tools: [],
            tool_choice: null
        };

        await expect(provider.generateCompletion(params)).rejects.toThrow('Unexpected error in convertMessages');
        expect(mockCreate).not.toHaveBeenCalled();

    });

});
