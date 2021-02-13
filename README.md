# `coinbase-pro-dca`

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/brendanjryan/coinbase-dca)

A simple app for making buys from Coinbase Pro at a user-configured interval. Useful for entering a market via over a long period of time via "dollar cost averaging".

## Strategy

- Runs daily/hourly/monthly at a predefined interval.
- Places _each_ of a set of pre-declared buys for a given amount based on _any_ valid trading pair on Coinbase Pro.
- Supports "best effort" limit buys, placing limit buys when possible but falling back to the "market" if the trade would fail.

## Setup

To install the app you will need the following requirements:

- A Coinbase Pro Account
- A Heroku Account

After setting up at each of the following ☝️, you can press the "deploy to heroku" button above and move on to the next section.

## Configuration

In order to setup the app you will need to request an API key for your Coinbase Pro account. You can retrieve a key by following the [Official Coinbase Guide](https://help.coinbase.com/en/pro/other-topics/api/how-do-i-create-an-api-key-for-coinbase-pro).

After retrieving a key, you can configure the bot to make buys on your behalf using the following settings (available upon installation or in the "settings / config variables" section of the heroku dashboard).

`COINBASE_API_KEY`

The API Key for your coinbase account.

`COINBASE_API_SECRET`

The secret for your Coinbase API key.

`COINBASE_API_PASSPHRASE`

The passphrase for your coinbase API key.

`COINBASE_API_SANDBOX`

Whether or not the coinbase sandbox should be used.

`ORDERS`

"Hash of orders that you wish to place. Must be of the form`{\"orders\": []}`

Each buy can be made up of multiple orders, which must be of the form

```
{
  product: "the name of the product you are buying"
  amount: "the amount of the base trading pair which you wish to use"
}
```

For example: a buy of $20 USD of Bitcoin and $10 USD of Ethereum would be represented by the following:

```
{"orders": [{"product": "BTC-USD", "amount": 20}, {"product": "ETH-USD", "amount": 10}]}
```

`CURRENCY`

The base currency which you want to transact in - normally USD.

`COINBASE_LIMIT`

The multiplier of the current market price which you want to use for limit orders.

For example, if the current market price for BTC-USD is \$100, and your `COINBASE_LIMIT` is set to `0.95` a `LIMIT` order for `$95` will be placed.

## Limitations

The following features are _not_ supported. If you would interested in seeing them implemented please feel free to create a PR or Issue!

- Automatic deposits to Coinbase from an external bank account.
