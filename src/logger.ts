import { pino } from 'pino';

const createLogger = (level: string) =>
{
    return pino({
        level: level,
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                colorizeObjects: true,
                translateTime: 'SYS:standard',
                singleLine: true,
                ignore: 'pid,hostname'
            }
        }
    });
};

export default createLogger;
