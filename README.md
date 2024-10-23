# OrchTS

OrchTS is an experimental TypeScript framework for orchestrating Large Language Models (LLMs), heavily inspired by OpenAI's Python-based [Swarm](https://github.com/openai/swarm) framework. It provides a simple, lightweight approach to building LLM-powered applications with minimal boilerplate code.

## Status: Experimental 🧪

This project is in an experimental state and far from complete. It's meant to serve as a foundation for exploring LLM orchestration patterns in TypeScript. While it's functional and usable, expect changes and improvements as the project evolves.

## Key Features

- **Simple Architecture**: Follows Swarm's philosophy of minimalism and clarity
- **TypeScript Native**: Built from the ground up with TypeScript, providing full type safety and IDE support
- **Provider Agnostic**: Extensible LLMProvider interface (currently implemented for OpenAI)
- **Function Calling**: Support for LLM function calling with type-safe decorators
- **Agent Communication**: Flexible agent-to-agent communication with optional message history transfer
- **Minimal Boilerplate**: Get started quickly with minimal configuration

## Installation

```bash
npm install @rdu/orchts
```

## Quick Start

Here's a simple example of using OrchTS:

```typescript
import { Agent, OrchTS } from '@rdu/orchts';

const client = new OrchTS();

const agent = new Agent({
    name: 'SimpleAgent',
    instructions: "You are a helpful agent",
});

const messages = [{ 
    role: "user", 
    content: "What's the weather like?" 
}];

const response = await client.run({
    agent: agent,
    messages: messages
});

console.log(response.messages[response.messages.length - 1].content);
```

For more examples, check out the [examples directory](src/examples).

## Architecture

OrchTS is built around three main concepts:

1. **Agents**: Entities that can process messages and make decisions
2. **Functions**: Type-safe function calling using decorators
3. **LLMProviders**: Abstraction layer for different LLM services

### Example with Function Calling

```typescript
import { Agent, AgentFunction, FunctionBase, OrchTS } from '@rdu/orchts';

class WeatherFunctions extends FunctionBase {
    @AgentFunction("Get the current weather")
    getWeather(city: string): string {
        return `The weather in ${city} is sunny`;
    }
}

const weatherFunctions = new WeatherFunctions();
const agent = new Agent({
    name: 'WeatherAgent',
    instructions: "You help with weather information",
    functions: [weatherFunctions.getWeather],
});
```

## Compatibility

- Requires TypeScript 4.8+
- Works with Node.js 18+
- Currently supports OpenAI models with function calling capabilities
- Requires experimental decorators enabled in TypeScript config

## Contributing

Contributions are very welcome! This project is meant to be a collaborative effort to explore and improve LLM orchestration patterns.

### Areas for Contribution

- Additional LLM providers (especially Anthropic and Ollama)
- Bug fixes and improvements
- Documentation enhancements
- Examples and use cases

### How to Contribute

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a Pull Request

For bug reports and feature requests, please use GitHub Issues.

## Relationship to OpenAI's Swarm

OrchTS is heavily inspired by OpenAI's Swarm framework and follows many of its design principles. However, it's reimplemented in TypeScript and includes some additional features:

- TypeScript-first implementation with full type safety
- Provider-agnostic design through the LLMProvider interface
- Enhanced message history handling in agent transfers

## License

MIT

## Acknowledgments

- OpenAI's Swarm framework for the inspiration and architecture patterns
- All contributors who help improve this experimental framework

---

**Note**: This is an experimental project and should be used accordingly. While functional, it's still evolving and may undergo significant changes.