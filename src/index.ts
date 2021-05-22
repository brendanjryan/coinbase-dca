import { CoinbasePro, OrderSide, OrderType, Currency } from "coinbase-pro-node";

import type {
  Account,
  LimitOrder,
  MarketOrder,
  Order,
} from "coinbase-pro-node";

import { AxiosError } from "axios";
var Decimal = require("decimal.js");

require("dotenv").config();

declare const process: {
  env: {
    COINBASE_API_KEY: string;
    COINBASE_API_SECRET: string;
    COINBASE_API_PASSPHRASE: string;
    COINBASE_API_SANDBOX: string;
    COINBASE_LIMIT: string;
    CURRENCY: string;
    ORDERS: string;
  };
};

// API Keys can be generated here:
// https://pro.coinbase.com/profile/api
// https://public.sandbox.pro.coinbase.com/profile/api
const auth = {
  apiKey: process.env.COINBASE_API_KEY,
  apiSecret: process.env.COINBASE_API_SECRET,
  passphrase: process.env.COINBASE_API_PASSPHRASE,
  // The Sandbox is for testing only and offers a subset of the products/assets:
  // https://docs.pro.coinbase.com/#sandbox
  useSandbox: JSON.parse(process.env.COINBASE_API_SANDBOX),
};

type ProductOrders = {
  buy: Array<ProductOrder>;
  sell: Array<ProductOrder>;
};

type ProductOrder = {
  product: string;
  amount: number;
};

type ParsedProduct = {
  to: string;
  from: string;
};

function parseProduct(p: string): [string, string] {
  let parts = p.split("-");
  return [parts[0], parts[1]];
}

type CurrencyDetails = {
  currency: string;
  minPrecision: number;
  minSize: typeof Decimal;
};

class Orderer {
  client: CoinbasePro;
  limit: number;
  currency: string;
  currencyInfo: [string, CurrencyDetails] | {};

  constructor(client: CoinbasePro, limit: number, currency: string) {
    this.client = client;
    this.limit = limit;
    this.currency = currency;
    this.currencyInfo = {};
  }

  init = async (): Promise<void> => {
    console.log("Initializing orderer");

    // retrieve currency info for base currency
    this.getCurrency(this.currency);
  };

  // retrieves information about a given currency
  getCurrency = async (currency: string): Promise<CurrencyDetails | null> => {
    if (this.currencyInfo[currency]) {
      // currency details already exist -- return
      return this.currencyInfo[currency];
    }
    let allCurrencies = await this.client.rest.currency.listCurrencies();

    let validCurrencies = allCurrencies.filter(
      (c: Currency) => c.id === currency
    );

    let desiredCurrency = validCurrencies && validCurrencies[0];

    if (!desiredCurrency) {
      throw new Error(`Could not retrieve currency: ${currency}`);
    }

    let minSize = new Decimal(desiredCurrency.min_size);

    let res = {
      currency: currency,
      minPrecision: minSize.precision() + 1,
      minSize: minSize,
    };

    this.currencyInfo[currency] = res;

    return res;
  };

  // calculates the bid price for a product based off of the current market price and our global modifier
  bidPrice = async (product: string): Promise<number> => {
    let stats = await this.client.rest.product.getProductStats(product);

    console.log(`Market price of ${product}: ${stats.last}`);

    return Number(stats.last) * this.limit;
  };

  // gets the usd account for the given keys
  getAccounts = async (currency: string): Promise<Array<Account>> => {
    let accounts = await this.client.rest.account.listAccounts();

    return accounts.filter((account) => account.currency === currency);
  };

  placeLimitOrder = async (
    product: string,
    price: typeof Decimal,
    size: typeof Decimal,
    side: OrderSide,
  ): Promise<Order> => {
    let [to, from] = parseProduct(product);

    let toCurrency = await this.getCurrency(to);
    let fromCurrency = await this.getCurrency(from);

    let sizeFixed = size.toNearest(toCurrency.minSize, Decimal.ROUND_DOWN);
    let priceFixed = price.toNearest(fromCurrency.minSize, Decimal.ROUND_DOWN);
    console.log(
      `Placing a limit order for ${product}: ${sizeFixed} @ $${priceFixed}`
    );
    let order: LimitOrder = {
      type: OrderType.LIMIT,
      product_id: product,
      price: priceFixed.toString(),
      size: sizeFixed.toString(),
      side: side,
    };

    return await this.client.rest.order.placeOrder(order);
  };

  placeMarketOrder = async (
    product: string,
    amount: typeof Decimal,
    side: OrderSide,
  ): Promise<Order> => {
    let [_, from] = parseProduct(product);

    let fromCurrency = await this.getCurrency(from);

    let amountFixed = amount.toNearest(
      fromCurrency.minSize,
      Decimal.ROUND_DOWN
    );
    console.log(`Placing a market order for ${product}: $${amountFixed}`);

    let order: MarketOrder = {
      type: OrderType.MARKET,
      product_id: product,
      funds: amountFixed.toString(),
      side: side,
    };

    return await this.client.rest.order.placeOrder(order);
  };
}

function getErrorMessage(error: AxiosError): string {
  return error.response?.data.message || error.message;
}

async function placeOrders(orderer: Orderer, orders: Array<ProductOrder>,side: OrderSide) {
   for (const order of orders) {
    console.log("Placing order: ", order);

    let bidPrice = await orderer.bidPrice(order.product);

    let placedOrder = await orderer
      .placeLimitOrder(
        order.product,
        new Decimal(bidPrice),
        new Decimal(order.amount).div(bidPrice),
        side,
      )
      .catch(async (err) => {
        // try to place a market order if limit order didn't work
        console.log("Error placing limit order: ", getErrorMessage(err));
        console.log("Attempting to place market order...");
        placedOrder = await orderer
          .placeMarketOrder(order.product, new Decimal(order.amount), side)
          .catch(async (err) => {
            console.log("Error placing market order: ", getErrorMessage(err));
          });
      });

    placedOrder &&
      console.log(
        `Successfully placed order: ${placedOrder.product_id}: ${placedOrder.size} @ $${placedOrder.price}`
      );
  }
}

async function main(): Promise<void> {
  let orders: ProductOrders = JSON.parse(process.env.ORDERS);

  let orderer = new Orderer(
    new CoinbasePro(auth),
    Number(process.env.COINBASE_LIMIT),
    process.env.CURRENCY
  );

  await orderer.init();

  let accounts = await orderer.getAccounts(process.env.CURRENCY);
  console.log("Got accounts: ", accounts);

  // We place sell orders _before_ buy orders in case we need to use the proceeds for a 
  // downstream buy.

  console.log("Placing sell orders...");
  await placeOrders(
    orderer,
    orders.sell,
    OrderSide.SELL,
  )

  console.log("Placing buy orders...");
  await placeOrders(
    orderer,
    orders.buy,
    OrderSide.BUY,
  )

  console.log("finished placing all orders!");
}

(async () => {
  console.log("Running script...");
  try {
    await main()
      .catch(console.error)
      .then(() => {
        console.log("Finished placing orders");
      });
  } catch (e) {
    console.log("error while processing: ", e);
  }
})();
