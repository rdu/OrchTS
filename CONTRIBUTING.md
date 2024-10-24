# Contributing to OrchTS

First off, thank you for considering contributing to OrchTS! It's people like you that make OrchTS a great tool.

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

## Pull Request Process

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. Ensure your code follows the existing style (we use ESLint).
4. Ensure all tests pass.
5. Update the documentation if needed.

### Getting Started

1. Clone your fork:
```bash
git clone https://github.com/YOUR-USERNAME/orchts.git
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Run tests:
```bash
npm test
```

### Running Examples

To run examples locally:
```bash
npm run example src/examples/basic.ts
```

## Code Style

- We use ESLint to maintain code style and formatting.
- We follow the Allman style for braces.
- Run `npm run lint` to check your code style.
- Run `npm run lint:fix` to automatically fix style issues.

## Project Structure

```
src/
  ├── agent.ts          # Agent implementation
  ├── functions.ts      # Function decorators and base classes
  ├── orchts.ts        # Main orchestration logic
  ├── types.ts         # TypeScript types and interfaces
  ├── provider/        # LLM providers
  ├── examples/        # Example implementations
  └── __tests__/       # Test files
```

## Testing

- Write tests for any new functionality.
- Place tests in the `src/__tests__` directory.
- Use Jest for testing.
- Run tests with `npm test`.

## Areas for Contribution

We're currently focusing on:
1. Additional LLM providers (especially Anthropic and Ollama)
2. Bug fixes and performance improvements
3. Documentation improvements
4. More example use cases

## Submitting Changes

1. Push your changes to your fork.
2. Submit a pull request to our repository.
3. The PR title should be descriptive and follow the format:
   - feat: Add new feature
   - fix: Fix specific issue
   - docs: Update documentation
   - refactor: Code refactoring
   - test: Add tests

## Reporting Bugs

We use GitHub issues to track bugs. Report a bug by [opening a new issue](https://github.com/rdu/orchts/issues/new).

### Bug Report Template

When reporting bugs, please include:
- A clear description of the issue
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details (Node.js version, TypeScript version)
- Code examples if applicable

## Feature Requests

We use GitHub issues to track feature requests. When requesting features:
- Explain the use case
- Be specific about the functionality
- Provide examples if possible

## Questions or Problems?

Feel free to open an issue with questions about using OrchTS or contributing to it.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
