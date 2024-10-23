import { AgentFuncParam, AgentFunction, FunctionBase } from '../functions';

describe('FunctionBase', () =>
{
    class TestFunctions extends FunctionBase
    {
        @AgentFunction('Simple function')
        simpleFunction(param: string): string
        {
            return param;
        }

        @AgentFunction('Function with optional param')
        optionalParamFunction(
            @AgentFuncParam({ description: 'Required param' }) required: string,
            @AgentFuncParam({ description: 'Optional param', optional: true }) optional?: number
        ): void { }

        @AgentFunction()
        noDescriptionFunction(
            @AgentFuncParam({ type: 'array' }) array: string[]
        ): void { }

        @AgentFunction('Complex function')
        complexFunction(
            @AgentFuncParam({ description: 'String param' }) strParam: string,
            @AgentFuncParam({ description: 'Number param', type: 'integer' }) numParam: number,
            @AgentFuncParam({ description: 'Boolean param', optional: true }) boolParam?: boolean
        ): object
        {
            return {};
        }
    }

    let testInstance: any;

    beforeEach(() =>
    {
        testInstance = new TestFunctions() as any;
    });

    it('should correctly create metadata for simple function', () =>
    {
        const functionMetadata = testInstance.functions[0];
        expect(functionMetadata).toEqual({
            name: 'simpleFunction',
            description: 'Simple function',
            params: [{ name: 'param', type: 'String', description: undefined, optional: false }],
            returnType: 'String',
            func: expect.any(Function)
        });
    });

    it('should handle optional parameters correctly pre', () =>
    {
        const functionMetadata = testInstance.functions[1];
        expect(functionMetadata.params).toEqual([
            { name: 'required', type: 'String', description: 'Required param', optional: false },
            { name: 'optional', type: 'Number', description: 'Optional param', optional: true }
        ]);
    });

    it('should work without function description', () =>
    {
        const functionMetadata = testInstance.functions[2];
        expect(functionMetadata.description).toBeUndefined();
    });

    it('should handle complex functions with multiple parameters pre', () =>
    {
        const functionMetadata = testInstance.functions[3];
        expect(functionMetadata.params).toEqual([
            { name: 'strParam', type: 'String', description: 'String param', optional: false },
            { name: 'numParam', type: 'integer', description: 'Number param', optional: false },
            { name: 'boolParam', type: 'Boolean', description: 'Boolean param', optional: true }
        ]);
    });

    it('should include parameter descriptions when provided', () =>
    {
        const functionMetadata = testInstance.functions[3];
        expect(functionMetadata.params[0].description).toBe('String param');
    });

    it('should handle array types correctly', () =>
    {
        const functionMetadata = testInstance.functions[2];
        expect(functionMetadata.params[0].type).toBe('array');
    });
});

describe('FunctionBase', () =>
{
    class TestFunctions extends FunctionBase
    {
        @AgentFunction('Simple function')
        simpleFunction(param: string): string
        {
            return param;
        }

        @AgentFunction('Function with optional param')
        optionalParamFunction(
            @AgentFuncParam({ description: 'Required param' }) required: string,
            @AgentFuncParam({ description: 'Optional param', optional: true }) optional?: number
        ): void { }

        @AgentFunction()
        noDescriptionFunction(
            @AgentFuncParam({ type: 'array' }) array: string[]
        ): void { }

        @AgentFunction('Complex function')
        complexFunction(
            @AgentFuncParam({ description: 'String param' }) strParam: string,
            @AgentFuncParam({ description: 'Number param', type: 'integer' }) numParam: number,
            @AgentFuncParam({ description: 'Boolean param', optional: true }) boolParam?: boolean
        ): object
        {
            return {};
        }

        @AgentFunction('Function with default value')
        defaultValueFunction(
            @AgentFuncParam({ description: 'Param with default' }) param: string = 'default'
        ): void { }

        @AgentFunction('Function with multiple types')
        multiTypeFunction(
            @AgentFuncParam({ type: 'string|number' }) param: string | number
        ): void { }

        plainFunction(param: string): string
        {
            return param;
        }
    }

    let testInstance: any;

    beforeEach(() =>
    {
        testInstance = new TestFunctions() as any;
    });

    it('should correctly create metadata for simple function', () =>
    {
        const functionMetadata = testInstance.functions[0];
        expect(functionMetadata).toEqual({
            name: 'simpleFunction',
            description: 'Simple function',
            params: [{ name: 'param', type: 'String', description: undefined, optional: false }],
            returnType: 'String',
            func: expect.any(Function)
        });
    });

    it('should handle optional parameters correctly', () =>
    {
        const functionMetadata = testInstance.functions[1];
        expect(functionMetadata.params).toEqual([
            { name: 'required', type: 'String', description: 'Required param', optional: false },
            { name: 'optional', type: 'Number', description: 'Optional param', optional: true }
        ]);
    });

    it('should work without function description', () =>
    {
        const functionMetadata = testInstance.functions[2];
        expect(functionMetadata.description).toBeUndefined();
    });

    it('should handle complex functions with multiple parameters', () =>
    {
        const functionMetadata = testInstance.functions[3];
        expect(functionMetadata.params).toEqual([
            { name: 'strParam', type: 'String', description: 'String param', optional: false },
            { name: 'numParam', type: 'integer', description: 'Number param', optional: false },
            { name: 'boolParam', type: 'Boolean', description: 'Boolean param', optional: true }
        ]);
    });

    it('should include parameter descriptions when provided', () =>
    {
        const functionMetadata = testInstance.functions[3];
        expect(functionMetadata.params[0].description).toBe('String param');
    });

    it('should handle array types correctly', () =>
    {
        const functionMetadata = testInstance.functions[2];
        expect(functionMetadata.params[0].type).toBe('array');
    });

    it('should handle functions with default parameter values', () =>
    {
        const functionMetadata = testInstance.functions[4];
        expect(functionMetadata.params[0]).toEqual({
            name: 'param',
            type: 'String',
            description: 'Param with default',
            optional: false
        });
    });

    it('should handle functions with multiple possible types', () =>
    {
        const functionMetadata = testInstance.functions[5];
        expect(functionMetadata.params[0].type).toBe('string|number');
    });

    it('should not include functions without @AgentFunction decorator', () =>
    {
        const plainFunctionMetadata = testInstance.functions.find((f: any) => f.name === 'plainFunction');
        expect(plainFunctionMetadata).toBeUndefined();
    });

    it('should correctly set the function property', () =>
    {
        const functionMetadata = testInstance.functions[0];
        expect(typeof functionMetadata.func).toBe('function');
        expect(functionMetadata.func.name).toBe('bound simpleFunction');
        expect(functionMetadata.func()).toBe(testInstance.simpleFunction());
    });

    it('should handle all defined functions', () =>
    {
        expect(testInstance.functions.length).toBe(6);
    });

    it('should preserve the order of function definitions', () =>
    {
        const functionNames = testInstance.functions.map((f: any) => f.name);
        expect(functionNames).toEqual([
            'simpleFunction',
            'optionalParamFunction',
            'noDescriptionFunction',
            'complexFunction',
            'defaultValueFunction',
            'multiTypeFunction'
        ]);
    });

    describe('FunctionBase and Decorators', () =>
    {
        class TestFunctions extends FunctionBase
        {
            @AgentFunction('Test function')
            testFunction(
                @AgentFuncParam({ description: 'Test param' }) param: string
            ): string
            {
                return `Hello, ${param}!`;
            }

            @AgentFunction('Optional param function')
            optionalParamFunction(
                @AgentFuncParam({ description: 'Required param' }) required: string,
                @AgentFuncParam({ description: 'Optional param', optional: true }) optional?: number
            ): string
            {
                return `${required} ${optional || ''}`;
            }
        }

        let testInstance: TestFunctions;

        beforeEach(() =>
        {
            testInstance = new TestFunctions();
        });

        it('should correctly register functions', () =>
        {
            expect(testInstance.functions.length).toBe(2);
        });

        it('should create correct metadata for simple function', () =>
        {
            const functionMetadata = testInstance.functions[0];
            expect(functionMetadata).toEqual({
                name: 'testFunction',
                description: 'Test function',
                params: [{ name: 'param', type: 'String', description: 'Test param', optional: false }],
                returnType: 'String',
                func: expect.any(Function)
            });
        });

        it('should handle optional parameters correctly', () =>
        {
            const functionMetadata = testInstance.functions[1];
            expect(functionMetadata.params).toEqual([
                { name: 'required', type: 'String', description: 'Required param', optional: false },
                { name: 'optional', type: 'Number', description: 'Optional param', optional: true }
            ]);
        });

        it('should be able to call the registered function', () =>
        {
            const result = testInstance.functions[0].func('World');
            expect(result).toBe('Hello, World!');
        });

        it('should be able to get function by name', () =>
        {
            const func = testInstance.getFunctionByName('testFunction');
            expect(func).toBeDefined();
            expect(func?.name).toBe('testFunction');
        });
    });
});