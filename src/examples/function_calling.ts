import { Agent, AgentFunction, FunctionBase, OrchTS, Message, AgentFuncParam, ContextVariables } from '@rdu/orchts';


const client = new OrchTS({ debug: true });

class WeatherFunctions extends FunctionBase
{
    @AgentFunction('get the current weather')
    get_weather(countryCode: string, zipCode: string, @AgentFuncParam({ type: 'ContextVariables' }) contextVars: ContextVariables)
    {
        return `{'temp': ${contextVars['temperature']}, 'unit':'F'}`;
    }
}

const weatherFunctions = new WeatherFunctions();

const agent = new Agent({
    name: 'Agent',
    instructions: (vars: ContextVariables) => { return 'You are a helpful agent. Your name is: ' + vars['name'] + '. You always must introduce yourself'; },
    functions: [weatherFunctions.get_weather]
});

const messages: Message[] = [{ 'role': 'user', 'content': 'I Live in Germany, specific in Hamburg, what clothes should I wear today?' }];

const response = client.run({
    agent: agent,
    messages: messages,
    context_variables: { 'name': 'Willi', temperature: 79 }
});

response.then((response) =>
{
    console.log(response?.messages[(response?.messages?.length || 0) - 1]?.content);
}).catch((error) =>
{
    console.error(error);
});