import { Agent, AgentFunction, FunctionBase, OrchTS, Message, ToolChoice } from '@rdu/orchts';

const client = new OrchTS({ debug: true });

const joker = new Agent({
    name: 'Joker',
    instructions: 'You are the Joker. You create jokes about given topics and hand them over to the Critic. You must nothing output but the joke. Always handover to the Critic after creating a joke. When you receive a joke back from the Critic, improve the joke and hand it back to the Critic.',
    tool_choice: ToolChoice.auto
});

const critic = new Agent({
    name: 'Critic',
    instructions: 'You are the Critic. You evaluate jokes provided by the Joker and decide whether to pass them to the Presenter or return them for improvement. If you think the joker improved the joke enough, pass it to the Presenter. Score the joke from 1 to 10. Only transfer to the Presenter if the joke get a score of 7 or higher. If you think the joke is not good enough, return it to the Joker but give him feedback on what you criticize and how he could improve the joke. Don\'t repeat the joke or output anything else than the critique and the score.',
    tool_choice: ToolChoice.auto
});

const presenter = new Agent({
    name: 'Presenter',
    instructions: 'You are the Presenter. You present the final joke to the user. You do this by outputting the joke the critic scored best. You must always output the best joke, event if it was already presented in the messages.'
});

class TransferFunctions extends FunctionBase
{
    constructor() { super(); }

    @AgentFunction('Transfer to Critic')
    transfer_to_critic()
    {
        return critic;
    }

    @AgentFunction('Transfer to Joker')
    transfer_to_joker()
    {
        return joker;
    }

    @AgentFunction('Transfer to Presenter')
    transfer_to_presenter()
    {
        return presenter;
    }
}

const transfers = new TransferFunctions();

joker.appendFunction(transfers.transfer_to_critic);
critic.appendFunction(transfers.transfer_to_joker);
critic.appendFunction(transfers.transfer_to_presenter);

const messages: Message[] = [
    { role: 'user', content: 'tell me a joke about bad software' }
];

async function flow(maxRounds: number)
{
    let response = await client.run({ agent: joker, messages });

    for (let i = 0; i < maxRounds; i++)
    {
        response = await client.run(response);

        if (response.agent.name === presenter.name)
        {
            response = await client.run(response);
            break;
        }
    }

    if (response.agent.name !== presenter.name)
    {
        response.agent = presenter;
        response = await client.run(response);
    }

    console.log(response.messages[response.messages.length - 1].content);
}

flow(10)
    .then(() => console.log('Flow complete'))
    .catch((error) => console.error('Error:', error));