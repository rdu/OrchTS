import { Agent } from '../agent.js';
import { OrchTS } from '../orchts.js';
import { Message } from '../types.js';

const client = new OrchTS();

const agent = new Agent({
    name: 'Super Agent',
    instructions: 'You are a helpful agent'
});

const messages: Message[] = [{ 'role': 'user', 'content': 'why are cats gray at night?' }];

const response = client.run({
    agent: agent,
    messages: messages
});

response.then((response) =>
{
    console.log(response?.messages[(response?.messages?.length || 0) - 1]?.content);
}).catch((error) =>
{
    console.error(error);
});