import winston from 'winston';
declare const logger: winston.Logger;
declare const stream: {
    write: (message: string) => void;
};
export { logger, stream };
export default logger;
//# sourceMappingURL=logger.d.ts.map