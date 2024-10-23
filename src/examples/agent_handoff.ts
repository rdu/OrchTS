import { Agent } from '../agent';
import { AgentFunction, FunctionBase } from '../functions';
import { OrchTS } from '../orchts';
import { Message } from '../types';

const client = new OrchTS({ debug: true });

class TransferFunctions extends FunctionBase
{
    constructor(private readonly spanishAgent: Agent, private readonly englishAgent: Agent) { super(); }

    @AgentFunction('Transfer spanish speaking users immediately.')
    transfer_to_spanish_agent(): Agent
    {
        return this.spanishAgent;
    }
}

const englishAgent = new Agent({
    name: 'English Agent',
    instructions: 'You only speak English.'
});

const spanishAgent = new Agent({
    name: 'Spanish Agent',
    instructions: 'You only speak Spanish.'
});

const transferFunctions = new TransferFunctions(spanishAgent, englishAgent);

englishAgent.appendFunction(transferFunctions.transfer_to_spanish_agent);

const messages: Message[] = [{ 'role': 'user', 'content': 'Hola. ¿Como estás?' }];

const response = client.run({
    agent: englishAgent,
    messages: messages
});

response.then((response) =>
{
    console.log(response?.messages[(response?.messages?.length || 0) - 1]?.content);
}).catch((error) =>
{
    console.error(error);
});