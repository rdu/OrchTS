import 'reflect-metadata';

/**
 * Symbol keys for storing metadata
 */
const FUNCTION_METADATA_KEY = Symbol('function_metadata');
const PARAM_METADATA_KEY = Symbol('agent:param:metadata');

/**
 * Interface describing the structure of function metadata
 * Contains information about the function name, description, parameters, return type, and the actual function
 */
export interface FunctionMetadata
{
    name: string;
    description?: string;
    params: Array<{
        name: string;
        type: string;
        optional: boolean;
        description?: string;
    }>;
    returnType: string;
    func: Function;
}

/**
 * Base class that provides functionality for registering and managing decorated functions
 * Automatically collects metadata from decorated methods during instantiation
 */
export class FunctionBase
{
    /** Array storing metadata for all decorated functions */
    functions: FunctionMetadata[] = [];

    constructor()
    {
        this.registerFunctions();
    }

    /**
     * Scans the prototype chain for decorated methods and registers their metadata
     * Binds function contexts to the instance and stores metadata for later retrieval
     * @private
     */
    private registerFunctions()
    {
        const prototype = Object.getPrototypeOf(this);

        const methodNames = Object.getOwnPropertyNames(prototype).filter(
            (prop) => typeof prototype[prop] === 'function' && prop !== 'constructor'
        );

        for (const methodName of methodNames)
        {
            const method = prototype[methodName];
            const metadata = Reflect.getMetadata(
                FUNCTION_METADATA_KEY,
                method
            ) as FunctionMetadata | undefined;

            if (metadata)
            {
                metadata.func = (this as any)[methodName].bind(this); // eslint-disable-line @typescript-eslint/no-explicit-any
                this.functions.push(metadata);
                (this as any)[methodName].functionMetadata = metadata; // eslint-disable-line @typescript-eslint/no-explicit-any
            }
        }
    }

    /**
     * Retrieves function metadata by function name
     * @param name - The name of the function to look up
     * @returns The function metadata if found, undefined otherwise
     */
    getFunctionByName(name: string): FunctionMetadata | undefined
    {
        return this.functions.find((f) => f.name === name);
    }
}

/**
 * Decorator factory for marking methods as agent functions
 * Collects and stores metadata about the function including its parameters and return type
 * @param description - Optional description of the function's purpose
 * @returns A method decorator that processes and stores function metadata
 */
export function AgentFunction(description?: string): MethodDecorator
{
    return (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor): void =>
    {
        const func = descriptor.value as Function;

        try 
        {
            const paramTypes = Reflect.getMetadata('design:paramtypes', target, propertyKey) || [];
            const returnType = Reflect.getMetadata('design:returntype', target, propertyKey);
            const paramNames = getParamNames(func);
            const constructor = target.constructor as Function;
            const classParams: Record<string | symbol, any[]> = Reflect.getMetadata(PARAM_METADATA_KEY, constructor) || {}; // eslint-disable-line @typescript-eslint/no-explicit-any
            const agentParams = classParams[propertyKey] || [];

            const metadata: FunctionMetadata = {
                name: propertyKey.toString(),
                description,
                params: paramNames.map((name, index) =>
                {
                    const param = {
                        name,
                        type: agentParams[index]?.type ||
                            (paramTypes[index] ? paramTypes[index]?.name || 'any' : 'any'),
                        optional: agentParams[index]?.optional ?? false,
                        description: agentParams[index]?.description
                    };

                    return param;
                }),
                returnType: returnType?.name || 'void',
                func
            };

            Reflect.defineMetadata(FUNCTION_METADATA_KEY, metadata, descriptor.value as Function);
        }
        catch (error)
        {
            console.error('Error in AgentFunction decorator:', error);
            // Provide a fallback metadata
            const metadata: FunctionMetadata = {
                name: propertyKey.toString(),
                description: description || 'No description available',
                params: [],
                returnType: 'any',
                func
            };

            Reflect.defineMetadata(FUNCTION_METADATA_KEY, metadata, descriptor.value as Function);
        }
    };
}

/**
 * Extracts parameter names from a function's string representation
 * Removes single-line comments and parses the parameter list
 * @param func - The function to extract parameter names from
 * @returns An array of parameter names
 * @private
 */
function getParamNames(func: Function): string[]
{
    const fnStr = func.toString().replace(/[/][/].*$/gm, ''); // Remove single-line comments
    const result = fnStr
        .slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')'))
        .match(/([^\s,]+)/g);

    return result === null ? [] : result;
}

/**
 * Parameter decorator factory for adding metadata to function parameters
 * Allows specification of parameter type, optionality, and description
 * @param options - Configuration object for parameter metadata
 * @param options.type - The parameter type
 * @param options.optional - Whether the parameter is optional
 * @param options.description - Description of the parameter's purpose
 * @returns A parameter decorator that stores the metadata
 */
export function AgentFuncParam(options: {
    type?: string;
    optional?: boolean;
    description?: string;
} = {}): (target: Object, propertyKey: string | symbol, parameterIndex: number) => void
{
    return (target: Object, propertyKey: string | symbol, parameterIndex: number): void =>
    {
        const constructor = target.constructor as Function;
        const existingParams: Record<string | symbol, any[]> = Reflect.getMetadata(PARAM_METADATA_KEY, constructor) || {}; // eslint-disable-line @typescript-eslint/no-explicit-any

        if (!existingParams[propertyKey])
        {
            existingParams[propertyKey] = [];
        }
        existingParams[propertyKey][parameterIndex] = options;
        Reflect.defineMetadata(PARAM_METADATA_KEY, existingParams, constructor);
    };
}