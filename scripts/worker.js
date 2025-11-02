#!/usr/bin/env node
"use strict";
/**
 * Worker de Notificações para Produção (Railway)
 * Este é um arquivo TypeScript que será compilado pelo build
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var notification_worker_1 = require("@/app/lib/notifications/notification-worker");
var redis_config_1 = require("@/app/lib/notifications/redis-config");
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var redisConnected, worker_1, error_1;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("🚀 Iniciando Worker de Notificações (Produção)...");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    console.log("📡 Testando conexão Redis...");
                    return [4 /*yield*/, (0, redis_config_1.testRedisConnection)()];
                case 2:
                    redisConnected = _a.sent();
                    if (!redisConnected) {
                        console.error("❌ Falha na conexão Redis. Verifique a variável REDIS_URL");
                        process.exit(1);
                    }
                    console.log("✅ Conexão Redis OK");
                    console.log("👷 Iniciando worker...");
                    worker_1 = (0, notification_worker_1.getNotificationWorker)();
                    console.log("✅ Worker iniciado com sucesso!");
                    // Graceful shutdown
                    process.on("SIGINT", function () { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    console.log("\n🛑 Parando worker...");
                                    return [4 /*yield*/, worker_1.stop()];
                                case 1:
                                    _a.sent();
                                    console.log("✅ Worker parado");
                                    process.exit(0);
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    process.on("SIGTERM", function () { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    console.log("\n🛑 Parando worker...");
                                    return [4 /*yield*/, worker_1.stop()];
                                case 1:
                                    _a.sent();
                                    console.log("✅ Worker parado");
                                    process.exit(0);
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    // Heartbeat
                    setInterval(function () {
                        console.log("💓 Worker ativo...");
                    }, 60000);
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error("❌ Erro ao iniciar worker:", error_1);
                    process.exit(1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
main().catch(function (error) {
    console.error("❌ Erro inesperado no worker:", error);
    process.exit(1);
});
