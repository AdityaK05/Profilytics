"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.httpServer = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const jobs_1 = __importDefault(require("./routes/jobs"));
const applications_1 = __importDefault(require("./routes/applications"));
const chat_1 = __importDefault(require("./routes/chat"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const upload_1 = __importDefault(require("./routes/upload"));
const errorHandler_1 = require("./middleware/errorHandler");
const auth_2 = require("./middleware/auth");
const logger_1 = __importDefault(require("./utils/logger"));
dotenv_1.default.config();
const app = (0, express_1.default)();
exports.app = app;
const httpServer = (0, http_1.createServer)(app);
exports.httpServer = httpServer;
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        credentials: true
    }
});
exports.io = io;
const PORT = process.env.PORT || 5000;
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use((0, helmet_1.default)({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
app.use((0, compression_1.default)());
app.use(limiter);
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, cookie_parser_1.default)());
if (process.env.NODE_ENV !== 'test') {
    app.use((0, morgan_1.default)('combined', {
        stream: { write: (message) => logger_1.default.info(message.trim()) }
    }));
}
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0'
    });
});
app.use('/api/auth', auth_1.default);
app.use('/api/users', auth_2.authMiddleware, users_1.default);
app.use('/api/jobs', jobs_1.default);
app.use('/api/applications', auth_2.authMiddleware, applications_1.default);
app.use('/api/chat', auth_2.authMiddleware, chat_1.default);
app.use('/api/analytics', auth_2.authMiddleware, analytics_1.default);
app.use('/api/upload', auth_2.authMiddleware, upload_1.default);
io.on('connection', (socket) => {
    logger_1.default.info(`User connected: ${socket.id}`);
    socket.on('join-room', (userId) => {
        socket.join(`user-${userId}`);
        logger_1.default.info(`User ${userId} joined room`);
    });
    socket.on('disconnect', () => {
        logger_1.default.info(`User disconnected: ${socket.id}`);
    });
});
app.set('io', io);
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method
    });
});
app.use(errorHandler_1.errorHandler);
process.on('SIGTERM', () => {
    logger_1.default.info('SIGTERM received, shutting down gracefully');
    httpServer.close(() => {
        logger_1.default.info('Process terminated');
        process.exit(0);
    });
});
process.on('SIGINT', () => {
    logger_1.default.info('SIGINT received, shutting down gracefully');
    httpServer.close(() => {
        logger_1.default.info('Process terminated');
        process.exit(0);
    });
});
if (process.env.NODE_ENV !== 'test') {
    httpServer.listen(PORT, () => {
        logger_1.default.info(`🚀 Server running on port ${PORT}`);
        logger_1.default.info(`📝 API documentation available at http://localhost:${PORT}/api/health`);
        logger_1.default.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
}
//# sourceMappingURL=server.js.map