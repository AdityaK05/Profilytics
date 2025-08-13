"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomError = exports.createError = exports.catchAsync = exports.errorHandler = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
class CustomError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.CustomError = CustomError;
const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new CustomError(message, 400);
};
const handleDuplicateFieldsDB = (err) => {
    const value = err.errmsg?.match(/(["'])(\\?.)*?\1/)?.[0];
    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new CustomError(message, 400);
};
const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new CustomError(message, 400);
};
const handleJWTError = () => new CustomError('Invalid token. Please log in again!', 401);
const handleJWTExpiredError = () => new CustomError('Your token has expired! Please log in again.', 401);
const sendErrorDev = (err, req, res) => {
    if (req.originalUrl.startsWith('/api')) {
        return res.status(err.statusCode || 500).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack,
        });
    }
    logger_1.default.error('ERROR 💥', err);
    return res.status(err.statusCode || 500).json({
        title: 'Something went wrong!',
        msg: err.message,
    });
};
const sendErrorProd = (err, req, res) => {
    if (req.originalUrl.startsWith('/api')) {
        if (err.isOperational) {
            return res.status(err.statusCode || 500).json({
                status: err.status,
                message: err.message,
            });
        }
        logger_1.default.error('ERROR 💥', err);
        return res.status(500).json({
            status: 'error',
            message: 'Something went very wrong!',
        });
    }
    if (err.isOperational) {
        return res.status(err.statusCode || 500).json({
            title: 'Something went wrong!',
            msg: err.message,
        });
    }
    logger_1.default.error('ERROR 💥', err);
    return res.status(err.statusCode || 500).json({
        title: 'Something went wrong!',
        msg: 'Please try again later.',
    });
};
const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);
    }
    else if (process.env.NODE_ENV === 'production') {
        let error = { ...err };
        error.message = err.message;
        if (error.name === 'CastError')
            error = handleCastErrorDB(error);
        if (error.code === 11000)
            error = handleDuplicateFieldsDB(error);
        if (error.name === 'ValidationError')
            error = handleValidationErrorDB(error);
        if (error.name === 'JsonWebTokenError')
            error = handleJWTError();
        if (error.name === 'TokenExpiredError')
            error = handleJWTExpiredError();
        sendErrorProd(error, req, res);
    }
};
exports.errorHandler = errorHandler;
const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};
exports.catchAsync = catchAsync;
const createError = (message, statusCode = 500) => {
    return new CustomError(message, statusCode);
};
exports.createError = createError;
//# sourceMappingURL=errorHandler.js.map