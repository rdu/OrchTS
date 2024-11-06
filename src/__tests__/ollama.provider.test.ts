import { OllamaProvider } from '../provider/ollama.provider';
import { Message, LLMProviderParams, ToolChoice } from '../types';

// Mock Ollama class
jest.mock('ollama', () =>
{
    return {
        Ollama: jest.fn().mockImplementation(() => ({
            chat: jest.fn().mockResolvedValue({
                message: {
                    role: 'assistant',
                    content: 'Test response'
                }
            })
        }))
    };
});

describe('OllamaProvider', () =>
{
    let provider: OllamaProvider;
    // Spy on console.error and silence it during tests
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() =>
    {
        provider = new OllamaProvider('mistral');
        // Silence console.error but keep track of calls
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() =>
    {
        consoleErrorSpy.mockRestore();
    });

    it('should create an instance with default model', () =>
    {
        expect(provider).toBeInstanceOf(OllamaProvider);
    });

    it('should create an instance with custom host', () =>
    {
        const customProvider = new OllamaProvider('mistral', 'http://localhost:11434');
        expect(customProvider).toBeInstanceOf(OllamaProvider);
    });

    it('should generate completion with basic message', async () =>
    {
        const params: LLMProviderParams = {
            messages: [
                {
                    role: 'user',
                    content: 'Hello'
                }
            ],
            tools: [],
            tool_choice: null
        };

        const response = await provider.generateCompletion(params);

        expect(response).toHaveProperty('role');
        expect(response).toHaveProperty('content');
        expect(response.role).toBe('assistant');
        expect(response.content).toBe('Test response');
        expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should transform messages correctly', () =>
    {
        const messages: Message[] = [
            {
                role: 'user',
                content: 'Test message'
            }
        ];

        // @ts-ignore - accessing private method for testing
        const transformed = provider['transformMessagesForOllama'](messages);

        expect(transformed).toHaveLength(1);
        expect(transformed[0]).toHaveProperty('role', 'user');
        expect(transformed[0]).toHaveProperty('content', 'Test message');
        expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () =>
    {
        // Mock a failed response
        const mockOllama = require('ollama').Ollama;
        mockOllama.mockImplementationOnce(() => ({
            chat: jest.fn().mockRejectedValue(new Error('Test error'))
        }));

        const params: LLMProviderParams = {
            messages: [
                {
                    role: 'user',
                    content: 'Hello'
                }
            ],
            tools: [],
            tool_choice: null
        };

        await expect(provider.generateCompletion(params))
            .rejects
            .toThrow('OllamaProvider error: Test error');

        // Verify that the error was logged
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Error in OllamaProvider:',
            expect.any(Error)
        );
    });

    it('should handle function calls correctly', async () =>
    {
        const functionArgs = { param: 'test' };
        const mockOllama = require('ollama').Ollama;
        mockOllama.mockImplementationOnce(() => ({
            chat: jest.fn().mockResolvedValue({
                message: {
                    role: 'assistant',
                    content: null,
                    tool_calls: [{
                        id: 'test-id',
                        type: 'function',
                        function: {
                            name: 'testFunction',
                            arguments: functionArgs  // Nicht vorher stringifiziert
                        }
                    }]
                }
            })
        }));

        const params: LLMProviderParams = {
            messages: [{
                role: 'user',
                content: 'Test function call'
            }],
            tools: [{
                type: 'function',
                function: {
                    name: 'testFunction',
                    description: 'Test function',
                    parameters: {
                        type: 'object',
                        properties: {
                            param: {
                                type: 'string'
                            }
                        }
                    }
                }
            }],
            tool_choice: ToolChoice.auto
        };

        const response = await provider.generateCompletion(params);

        expect(response.tool_calls).toBeDefined();
        expect(response.tool_calls?.length).toBe(1);
        expect(response.tool_calls?.[0].function.name).toBe('testFunction');

        // Parse zurück zu einem Objekt für den Vergleich
        const receivedArgs = JSON.parse(response.tool_calls?.[0].function.arguments || '{}');
        expect(receivedArgs).toEqual(functionArgs);

        expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should handle tool choice options correctly', async () =>
    {
        // Test with different tool_choice values
        const toolChoices: ToolChoice[] = [
            ToolChoice.none,
            ToolChoice.auto,
            ToolChoice.required
        ];

        for (const choice of toolChoices)
        {
            const params: LLMProviderParams = {
                messages: [{
                    role: 'user',
                    content: 'Test with tool choice: ' + choice
                }],
                tools: [{
                    type: 'function',
                    function: {
                        name: 'testFunction',
                        description: 'Test function',
                        parameters: {
                            type: 'object',
                            properties: {}
                        }
                    }
                }],
                tool_choice: choice
            };

            await provider.generateCompletion(params);

            // Verify that Ollama was called with the correct tool_choice
            const mockOllama = require('ollama').Ollama;
            const mockInstance = mockOllama.mock.results[mockOllama.mock.results.length - 1].value;

            expect(mockInstance.chat).toHaveBeenCalledWith(
                expect.objectContaining({
                    tool_choice: choice
                })
            );
        }

        expect(consoleErrorSpy).not.toHaveBeenCalled();
    });


    it('should handle system messages correctly', async () =>
    {
        const mockOllama = require('ollama').Ollama;
        mockOllama.mockImplementationOnce(() => ({
            chat: jest.fn().mockResolvedValue({
                message: {
                    role: 'assistant',
                    content: 'Response following system instruction'
                }
            })
        }));

        const params: LLMProviderParams = {
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful assistant'
                },
                {
                    role: 'user',
                    content: 'Hello'
                }
            ],
            tools: [],
            tool_choice: null
        };

        const response = await provider.generateCompletion(params);

        // Verify that Ollama was called with correct message transformation
        const mockInstance = mockOllama.mock.results[mockOllama.mock.results.length - 1].value;
        const chatCall = mockInstance.chat.mock.calls[0][0];

        expect(chatCall.messages).toHaveLength(2);
        expect(chatCall.messages[0]).toEqual({
            role: 'system',
            content: 'You are a helpful assistant'
        });
        expect(response.content).toBe('Response following system instruction');
        expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should maintain conversation context correctly', async () =>
    {
        const mockOllama = require('ollama').Ollama;
        mockOllama.mockImplementationOnce(() => ({
            chat: jest.fn().mockResolvedValue({
                message: {
                    role: 'assistant',
                    content: 'Response in context'
                }
            })
        }));

        const params: LLMProviderParams = {
            messages: [
                {
                    role: 'user',
                    content: 'Hello'
                },
                {
                    role: 'assistant',
                    content: 'Hi there!'
                },
                {
                    role: 'user',
                    content: 'How are you?'
                }
            ],
            tools: [],
            tool_choice: null
        };

        await provider.generateCompletion(params);

        // Verify that all messages were passed to maintain context
        const mockInstance = mockOllama.mock.results[mockOllama.mock.results.length - 1].value;
        const chatCall = mockInstance.chat.mock.calls[0][0];

        expect(chatCall.messages).toHaveLength(3);
        expect(chatCall.messages).toEqual([
            {
                role: 'user',
                content: 'Hello'
            },
            {
                role: 'assistant',
                content: 'Hi there!'
            },
            {
                role: 'user',
                content: 'How are you?'
            }
        ]);
        expect(consoleErrorSpy).not.toHaveBeenCalled();
    });


    it('should handle various content edge cases correctly', async () =>
    {
        const testCases = [
            {
                response: {
                    message: {
                        role: 'assistant',
                        content: null
                    }
                },
                expected: ''  // Leerer String bei null
            },
            {
                response: {
                    message: {
                        role: 'assistant',
                        content: ''
                    }
                },
                expected: ''  // Leerer String bleibt leer
            },
            {
                response: {
                    message: {
                        role: 'assistant',
                        content: '    ' // Nur Whitespace
                    }
                },
                expected: '    '  // Whitespace wird beibehalten
            }
        ];

        const mockOllama = require('ollama').Ollama;

        for (const testCase of testCases)
        {
            mockOllama.mockImplementationOnce(() => ({
                chat: jest.fn().mockResolvedValue(testCase.response)
            }));

            const params: LLMProviderParams = {
                messages: [{
                    role: 'user',
                    content: 'Test'
                }],
                tools: [],
                tool_choice: null
            };

            const response = await provider.generateCompletion(params);

            expect(response.role).toBe('assistant');
            expect(response.content).toBe(testCase.expected);
        }

        expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
});