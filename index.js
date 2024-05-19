"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureApp = void 0;
const knex_1 = __importDefault(require("knex"));
const express_1 = __importDefault(require("express"));
const csv_reader_1 = require("./src/main/csv-reader");
const transactionHandler_1 = require("./src/main/transactionHandler");
const transaction_details_1 = require("./src/main/transaction-details");
const auth_1 = require("./src/middleware/auth");
const balances_1 = require("./src/main/balances");
const deleteData_1 = require("./src/main/deleteData");
const app = (0, express_1.default)();
const port = 3000;
const configureApp = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let deactivators = [];
    const knexConnection = yield (0, knex_1.default)({
        client: 'postgresql',
        useNullAsDefault: true,
        connection: (_a = process.env.DATA_BASE_URL) !== null && _a !== void 0 ? _a : 'postgresql://postgres:postgres@localhost:5432/postgres',
    });
    deactivators.push(() => knexConnection.destroy());
    return {
        app,
        knexConnection,
        deactivate: () => __awaiter(void 0, void 0, void 0, function* () {
            yield Promise.all(deactivators.map((fn) => fn()));
        }),
    };
});
exports.configureApp = configureApp;
app.post('/api/generate-transactions', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let i = 0;
    try {
        const { knexConnection } = yield (0, exports.configureApp)();
        const csvData = yield (0, csv_reader_1.readCSV)();
        for (const row of csvData) {
            i++;
            yield (0, transactionHandler_1.handleTransaction)(knexConnection, row);
        }
        res.status(200).send('CSV data processed successfully');
    }
    catch (error) {
        console.log(i);
        res.status(500).send(`Error processing CSV data: ${error}`);
    }
}));
app.get('/api/balances-raw', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { knexConnection } = yield (0, exports.configureApp)();
        const { fromDate, toDate } = req.query;
        const details = yield (0, transaction_details_1.transactionDetails)(knexConnection, fromDate, toDate);
        res.status(200).json(details);
    }
    catch (error) {
        res.status(500).send(`Error retrieving transaction details: ${error}`);
    }
}));
app.get('/api/balances', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { knexConnection } = yield (0, exports.configureApp)();
        const { fromDate, toDate } = req.query;
        const csvFilePath = yield (0, balances_1.getBalances)(knexConnection, fromDate, toDate);
        res.download(csvFilePath);
    }
    catch (error) {
        res.status(500).send(`Error generating balances CSV: ${error}`);
    }
}));
app.delete('/api/delete-data', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { knexConnection } = yield (0, exports.configureApp)();
        yield (0, deleteData_1.deleteData)(knexConnection);
        res.status(200).send('Data deleted successfully');
    }
    catch (error) {
        res.status(500).send(`Error deleting data: ${error}`);
    }
}));
if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
    });
}
exports.default = app;
