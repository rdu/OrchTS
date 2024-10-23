import { Agent } from '../agent.js';
import { AgentFunction, FunctionBase } from '../functions.js';
import { OrchTS } from '../orchts.js';
import { Message, ToolChoice } from '../types.js';

const client = new OrchTS({ debug: true });

const viewA = new Agent({
    name: 'Traditional',
    instructions: 'You have traditional views. You are taking part in a discussion with a more progressive opponent. You are arguing from your point of view on the given topic and referring to your opponent\'s arguments. Then you hand over to your opponent every time. Identify yourself as the traditional view at ANY! handover.',
    tool_choice: ToolChoice.auto
});

const viewB = new Agent({
    name: 'Progressive',
    instructions: 'You have modern and progressive views. You are taking part in a discussion with a more traditional opponent. You are arguing from your point of view on the given topic and referring to your opponent\'s arguments. Then you hand over to your opponent every time. Identify yourself as the progressive view at ANY! handover.',
    tool_choice: ToolChoice.auto
});

const analyzer = new Agent({
    name: 'Analyzer',
    instructions: 'You are the analyzer of the discussion. You will analyze the discussion between the two agents and provide a summary of the arguments made by each agent. Declare the winner of the debate based on the arguments made by each agent. You do not have to take part in the discussion and you are not allowed to have any opinions on the topic.'
});

class TransferFunctions extends FunctionBase
{
    constructor() { super(); }

    @AgentFunction('Transfer to Traditional View')
    transfer_to_traditional()
    {
        return viewA;
    }

    @AgentFunction('Transfer to Progressive View')
    transfer_to_progressive()
    {
        return viewB;
    }
}

const transfers = new TransferFunctions();

viewA.appendFunction(transfers.transfer_to_progressive);
viewB.appendFunction(transfers.transfer_to_traditional);

const messages: Message[] = [{
    'role': 'user',
    'content': 'can AI replace human intelligence?'
}];

async function simulate(rounds: number)
{
    let response = await client.run({
        agent: viewB,
        messages: messages
    });

    for (let i = 1; i < rounds; i++)
    {
        response = await client.run(response);
    }

    return client.run({
        agent: analyzer,
        messages: response.messages
    });
}

simulate(4)
    .then(result => console.log('Debate Analysis Complete!', result['messages'][result['messages'].length - 1]['content']))
    .catch(error => console.error('Error:', error));