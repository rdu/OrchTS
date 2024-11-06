import type { Logger } from 'pino';

const mockPinoFn = jest.fn();

// Mock das Modul
jest.mock('pino', () => ({
    pino: mockPinoFn
}));

import createLogger from '../logger';

describe('Logger', () =>
{
    let mockLogger: any;

    beforeEach(() =>
    {
        jest.clearAllMocks();

        mockLogger = {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            trace: jest.fn(),
            child: jest.fn(),
            isLevelEnabled: jest.fn()
        };

        mockPinoFn.mockReturnValue(mockLogger);

        mockLogger.child.mockImplementation(() => ({
            ...mockLogger,
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            trace: jest.fn()
        }));

        // Standard Level Check Implementation
        mockLogger.isLevelEnabled.mockImplementation((checkLevel: string) =>
        {
            const levels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'];
            const currentLevelIndex = levels.indexOf(mockLogger.level);
            const checkLevelIndex = levels.indexOf(checkLevel);
            return checkLevelIndex <= currentLevelIndex;
        });
    });

    describe('Log Level Configuration', () =>
    {
        afterEach(() =>
        {
            jest.clearAllMocks();
        });

        it('should create logger with debug level when debug is specified', () =>
        {
            createLogger('debug');
            const config = mockPinoFn.mock.calls[0][0];
            expect(config.level).toBe('debug');
        });

        it('should create logger with error level when error is specified', () =>
        {
            createLogger('error');
            const config = mockPinoFn.mock.calls[0][0];
            expect(config.level).toBe('error');
        });

        it('should accept warn level', () =>
        {
            createLogger('warn');
            const config = mockPinoFn.mock.calls[0][0];
            expect(config.level).toBe('warn');
        });

        it('should invalid-level level for invalid-level input', () =>
        {
            createLogger('invalid-level');
            const config = mockPinoFn.mock.calls[0][0];
            expect(config.level).toBe('invalid-level');
        });
    });

    describe('Transport Configuration', () =>
    {
        it('should configure pino-pretty transport', () =>
        {
            createLogger('info');
            const config = mockPinoFn.mock.calls[0][0];
            expect(config.transport).toEqual({
                target: 'pino-pretty',
                options: expect.any(Object)
            });
        });

        it('should set correct transport options', () =>
        {
            createLogger('info');
            const config = mockPinoFn.mock.calls[0][0];
            expect(config.transport.options).toEqual({
                colorize: true,
                colorizeObjects: true,
                translateTime: 'SYS:standard',
                singleLine: true,
                ignore: 'pid,hostname'
            });
        });
    });

    describe('Logging Functionality', () =>
    {
        let logger: Logger;

        beforeEach(() =>
        {
            logger = createLogger('debug');
        });

        it('should support info logging', () =>
        {
            const testMsg = 'test message';
            logger.info(testMsg);
            expect(mockLogger.info).toHaveBeenCalledWith(testMsg);
        });

        it('should support error logging', () =>
        {
            const error = new Error('test error');
            const errorMsg = 'error message';
            logger.error(error, errorMsg);
            expect(mockLogger.error).toHaveBeenCalledWith(error, errorMsg);
        });

        it('should support warning logging', () =>
        {
            const warnMsg = 'warning message';
            logger.warn(warnMsg);
            expect(mockLogger.warn).toHaveBeenCalledWith(warnMsg);
        });

        it('should support debug logging', () =>
        {
            const debugMsg = 'debug message';
            logger.debug(debugMsg);
            expect(mockLogger.debug).toHaveBeenCalledWith(debugMsg);
        });

        it('should support logging with metadata', () =>
        {
            const metadata = { user: 'test', action: 'login' };
            const message = 'test message';
            logger.info({ ...metadata }, message);
            expect(mockLogger.info).toHaveBeenCalledWith({ ...metadata }, message);
        });
    });

    describe('Error Handling', () =>
    {
        let logger: Logger;

        beforeEach(() =>
        {
            logger = createLogger('error');
        });

        it('should handle circular references', () =>
        {
            const circularObj: any = { a: 1 };
            circularObj.self = circularObj;

            expect(() =>
            {
                logger.info(circularObj, 'message with circular reference');
            }).not.toThrow();
            expect(mockLogger.info).toHaveBeenCalled();
        });

        it('should handle undefined metadata', () =>
        {
            expect(() =>
            {
                logger.info(undefined, 'message with undefined metadata');
            }).not.toThrow();
            expect(mockLogger.info).toHaveBeenCalled();
        });

        it('should handle null metadata', () =>
        {
            expect(() =>
            {
                logger.info(null, 'message with null metadata');
            }).not.toThrow();
            expect(mockLogger.info).toHaveBeenCalled();
        });
    });

    describe('Child Loggers', () =>
    {
        let logger: Logger;

        beforeEach(() =>
        {
            logger = createLogger('info');
        });

        it('should create child logger with metadata', () =>
        {
            const metadata = { component: 'test' };
            const childLogger = logger.child(metadata);
            expect(mockLogger.child).toHaveBeenCalledWith(metadata);
            expect(childLogger).toBeDefined();
        });

        it('should support nested child loggers', () =>
        {
            const parentMeta = { component: 'parent' };
            const childMeta = { subComponent: 'child' };

            const mockChildLogger = {
                info: jest.fn(),
                error: jest.fn(),
                warn: jest.fn(),
                debug: jest.fn(),
                trace: jest.fn(),
                child: jest.fn(),
                level: 'info'
            };

            mockLogger.child.mockReturnValue(mockChildLogger);
            mockChildLogger.child.mockReturnValue(mockChildLogger);

            const parentLogger = logger.child(parentMeta);
            const childLogger = parentLogger.child(childMeta);

            expect(mockLogger.child).toHaveBeenCalledWith(parentMeta);
            expect(mockChildLogger.child).toHaveBeenCalledWith(childMeta);

            childLogger.info('test');
            expect(mockChildLogger.info).toHaveBeenCalledWith('test');
        });
    });

    describe('Log Level Checks', () =>
    {
        it('should correctly check level hierarchy for debug logger', () =>
        {
            // Setup debug logger
            const debugLogger = createLogger('debug');
            mockLogger.level = 'debug';

            // Debug level should allow all standard levels
            expect(debugLogger.isLevelEnabled('error')).toBe(true);
            expect(debugLogger.isLevelEnabled('warn')).toBe(true);
            expect(debugLogger.isLevelEnabled('info')).toBe(true);
            expect(debugLogger.isLevelEnabled('debug')).toBe(true);
        });

        it('should correctly check level hierarchy for error logger', () =>
        {
            // Setup error logger
            const errorLogger = createLogger('error');
            mockLogger.level = 'error';

            // Error level should only allow error and fatal
            expect(errorLogger.isLevelEnabled('fatal')).toBe(true);
            expect(errorLogger.isLevelEnabled('error')).toBe(true);
            expect(errorLogger.isLevelEnabled('warn')).toBe(false);
            expect(errorLogger.isLevelEnabled('info')).toBe(false);
            expect(errorLogger.isLevelEnabled('debug')).toBe(false);
        });
    });

    describe('Performance', () =>
    {
        let logger: Logger;

        beforeEach(() =>
        {
            logger = createLogger('info');
        });

        it('should handle high volume logging', () =>
        {
            const startTime = Date.now();

            for (let i = 0; i < 1000; i++)
            {
                logger.info(`Test message ${i}`);
            }

            const duration = Date.now() - startTime;
            expect(duration).toBeLessThan(1000);
            expect(mockLogger.info).toHaveBeenCalledTimes(1000);
        });

        it('should handle rapid child logger creation', () =>
        {
            const startTime = Date.now();

            for (let i = 0; i < 100; i++)
            {
                const childLogger = logger.child({ id: i });
                childLogger.info(`Child logger ${i}`);
            }

            const duration = Date.now() - startTime;
            expect(duration).toBeLessThan(1000);
            expect(mockLogger.child).toHaveBeenCalledTimes(100);
        });
    });
});