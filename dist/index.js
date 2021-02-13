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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
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
exports.__esModule = true;
var coinbase_pro_node_1 = require("coinbase-pro-node");
var Sentry = require("@sentry/node");
var Decimal = require("decimal.js");
require("dotenv").config();
Sentry.init({
    dsn: "https://f9ebc13023364348a1e6cbeea863c7e3@o413551.ingest.sentry.io/5300318",
    environment: process.env.NODE_ENV
});
// API Keys can be generated here:
// https://pro.coinbase.com/profile/api
// https://public.sandbox.pro.coinbase.com/profile/api
var auth = {
    apiKey: process.env.COINBASE_API_KEY,
    apiSecret: process.env.COINBASE_API_SECRET,
    passphrase: process.env.COINBASE_API_PASSPHRASE,
    // The Sandbox is for testing only and offers a subset of the products/assets:
    // https://docs.pro.coinbase.com/#sandbox
    useSandbox: !!process.env.COINBASE_SANDBOX
};
function parseProduct(p) {
    var parts = p.split("-");
    return [parts[0], parts[1]];
}
var Orderer = /** @class */ (function () {
    function Orderer(client, limit, currency) {
        var _this = this;
        this.init = function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.log("Initializing orderer");
                // retrieve currency info for base currency
                this.getCurrency(this.currency);
                return [2 /*return*/];
            });
        }); };
        // retrieves information about a given currency
        this.getCurrency = function (currency) { return __awaiter(_this, void 0, void 0, function () {
            var allCurrencies, validCurrencies, desiredCurrency, minSize, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.currencyInfo[currency]) {
                            // currency details already exist -- return
                            return [2 /*return*/, this.currencyInfo[currency]];
                        }
                        return [4 /*yield*/, this.client.rest.currency.listCurrencies()];
                    case 1:
                        allCurrencies = _a.sent();
                        validCurrencies = allCurrencies.filter(function (c) { return c.id === currency; });
                        desiredCurrency = validCurrencies && validCurrencies[0];
                        if (!desiredCurrency) {
                            throw new Error("Could not retrieve currency: " + currency);
                        }
                        minSize = new Decimal(desiredCurrency.min_size);
                        res = {
                            currency: currency,
                            minPrecision: minSize.precision() + 1,
                            minSize: minSize
                        };
                        this.currencyInfo[currency] = res;
                        return [2 /*return*/, res];
                }
            });
        }); };
        // calculates the bid price for a product based off of the current market price and our global modifier
        this.bidPrice = function (product) { return __awaiter(_this, void 0, void 0, function () {
            var stats;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client.rest.product.getProductStats(product)];
                    case 1:
                        stats = _a.sent();
                        console.log("Market price of " + product + ": " + stats.last);
                        return [2 /*return*/, Number(stats.last) * this.limit];
                }
            });
        }); };
        // gets the usd account for the given keys
        this.getAccounts = function (currency) { return __awaiter(_this, void 0, void 0, function () {
            var accounts;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client.rest.account.listAccounts()];
                    case 1:
                        accounts = _a.sent();
                        return [2 /*return*/, accounts.filter(function (account) { return account.currency === currency; })];
                }
            });
        }); };
        this.placeLimitOrder = function (product, price, size) { return __awaiter(_this, void 0, void 0, function () {
            var _a, to, from, toCurrency, fromCurrency, sizeFixed, priceFixed, order;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = parseProduct(product), to = _a[0], from = _a[1];
                        return [4 /*yield*/, this.getCurrency(to)];
                    case 1:
                        toCurrency = _b.sent();
                        return [4 /*yield*/, this.getCurrency(from)];
                    case 2:
                        fromCurrency = _b.sent();
                        sizeFixed = size.toNearest(toCurrency.minSize, Decimal.ROUND_DOWN);
                        priceFixed = price.toNearest(fromCurrency.minSize, Decimal.ROUND_DOWN);
                        console.log("Placing a limit order for " + product + ": " + sizeFixed + " @ $" + priceFixed);
                        order = {
                            type: coinbase_pro_node_1.OrderType.LIMIT,
                            product_id: product,
                            side: coinbase_pro_node_1.OrderSide.BUY,
                            price: priceFixed.toString(),
                            size: sizeFixed.toString()
                        };
                        return [4 /*yield*/, this.client.rest.order.placeOrder(order)];
                    case 3: return [2 /*return*/, _b.sent()];
                }
            });
        }); };
        this.placeMarketOrder = function (product, amount) { return __awaiter(_this, void 0, void 0, function () {
            var _a, _, from, fromCurrency, amountFixed, order;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = parseProduct(product), _ = _a[0], from = _a[1];
                        return [4 /*yield*/, this.getCurrency(from)];
                    case 1:
                        fromCurrency = _b.sent();
                        amountFixed = amount.toNearest(fromCurrency.minSize, Decimal.ROUND_DOWN);
                        console.log("Placing a market order for " + product + ": $" + amountFixed);
                        order = {
                            type: coinbase_pro_node_1.OrderType.MARKET,
                            product_id: product,
                            side: coinbase_pro_node_1.OrderSide.BUY,
                            funds: amountFixed.toString()
                        };
                        return [4 /*yield*/, this.client.rest.order.placeOrder(order)];
                    case 2: return [2 /*return*/, _b.sent()];
                }
            });
        }); };
        this.client = client;
        this.limit = limit;
        this.currency = currency;
        this.currencyInfo = {};
    }
    return Orderer;
}());
function getErrorMessage(error) {
    var _a;
    return ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data.message) || error.message;
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var orders, orderer, accounts, _loop_1, _i, _a, order;
        var _this = this;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    orders = JSON.parse(process.env.ORDERS);
                    orderer = new Orderer(new coinbase_pro_node_1.CoinbasePro(auth), Number(process.env.COINBASE_LIMIT), process.env.CURRENCY);
                    return [4 /*yield*/, orderer.init()];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, orderer.getAccounts(process.env.CURRENCY)];
                case 2:
                    accounts = _b.sent();
                    console.log("Got accounts: ", accounts);
                    _loop_1 = function (order) {
                        var bidPrice, placedOrder;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    console.log("Placing order: ", order);
                                    return [4 /*yield*/, orderer.bidPrice(order.product)];
                                case 1:
                                    bidPrice = _a.sent();
                                    return [4 /*yield*/, orderer
                                            .placeLimitOrder(order.product, new Decimal(bidPrice), new Decimal(order.amount).div(bidPrice))["catch"](function (err) { return __awaiter(_this, void 0, void 0, function () {
                                            var _this = this;
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0:
                                                        // try to place a market order if limit order didn't work
                                                        console.log("Error placing limit order: ", getErrorMessage(err));
                                                        console.log("Attempting to place market order...");
                                                        return [4 /*yield*/, orderer
                                                                .placeMarketOrder(order.product, new Decimal(order.amount))["catch"](function (err) { return __awaiter(_this, void 0, void 0, function () {
                                                                return __generator(this, function (_a) {
                                                                    console.log("Error placing market order: ", getErrorMessage(err));
                                                                    return [2 /*return*/];
                                                                });
                                                            }); })];
                                                    case 1:
                                                        placedOrder = _a.sent();
                                                        return [2 /*return*/];
                                                }
                                            });
                                        }); })];
                                case 2:
                                    placedOrder = _a.sent();
                                    placedOrder &&
                                        console.log("Successfully placed order: " + placedOrder.product_id + ": " + placedOrder.size + " @ $" + placedOrder.price);
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, _a = orders.orders;
                    _b.label = 3;
                case 3:
                    if (!(_i < _a.length)) return [3 /*break*/, 6];
                    order = _a[_i];
                    return [5 /*yield**/, _loop_1(order)];
                case 4:
                    _b.sent();
                    _b.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6: return [2 /*return*/];
            }
        });
    });
}
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var e_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log("Running script...");
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, main()["catch"](console.error)
                        .then(function () {
                        console.log("Finished placing orders");
                    })];
            case 2:
                _a.sent();
                return [3 /*break*/, 4];
            case 3:
                e_1 = _a.sent();
                console.log("error while processing: ", e_1);
                Sentry.captureException(e_1);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); })();
