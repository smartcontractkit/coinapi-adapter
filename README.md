# Chainlink CoinApi External Adapter

**This adapter has moved to our [external adapters monorepo](https://github.com/smartcontractkit/external-adapters-js)!**

## Input Params

- `base`, `from`, or `coin`: The coin to query (required)
- `quote`, `to`, or `market`: The currency to convert to (required)

## Output Format

```json
{
 "jobRunID": "1",
 "data": {
  "time": "2020-04-15T14:24:15.3834439Z",
  "asset_id_base": "ETH",
  "asset_id_quote": "USD",
  "rate": 159.1132487376848,
  "result": 159.1132487376848
 },
 "result": 159.1132487376848,
 "statusCode": 200
}
```

## Install

```bash
yarn install
```

## Test

```bash
yarn test
```

## Create the zip

```bash
zip -r cl-coinapi.zip .
```

## Docker

If you wish to use Docker to run the adapter, you can build the image by running the following command:

```bash
docker build . -t coinapi-adapter
```

Then run it with:

```bash
docker run -p 8080:8080 -e API_KEY='YOUR_API_KEY' -it coinapi-adapter:latest
```

## Install to GCP

- In Functions, create a new function, choose to ZIP upload
- Click Browse and select the `cl-coinapi.zip` file
- Select a Storage Bucket to keep the zip in
- Function to execute: gcpservice
- Click More, Add variable
  - NAME: API_KEY
  - VALUE: Your_API_key

## Install to AWS Lambda

- In Lambda Functions, create function
- On the Create function page:
  - Give the function a name
  - Use Node.js 12.x for the runtime
  - Choose an existing role or create a new one
  - Click Create Function
- Under Function code, select "Upload a .zip file" from the Code entry type drop-down
- Click Upload and select the `cl-coinapi.zip` file
- Handler should remain index.handler
- Add the environment variable:
  - Key: API_KEY
  - Value: Your_API_key
- Save
