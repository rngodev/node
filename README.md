# rngo for Node.js

The official Node.js library for rngo. Includes:

1. a lightweight rngo API client
2. library code for downloading and importing simulation data
3. a CLI wrapper

## Installation

To add the library to your Node.js project, run:

```bash
npm install rngo
```

or

```bash
yarn add rngo
```

To install the CLI globaly, run:

## Usage

Start by initializing an instance of the `Rngo` class:

```javascript
import { Rngo } from 'rngo';

const rngo = Rngo.init();
```

This expects the rngo API token to be available in the `RNGO_API_TOKEN` environment variable, and will otherwise use default configuration values.

You can also pass in a configuration object:

```javascript
const rngo = Rngo.init({
  apiToken: env.API_TOKEN,
  directory: 'rngo-data',
})
```

You can use the `Rngo` install to run simulations:

```javascript
const simulation = await rngo.runSimulation()
```

and import simulation data:

```javascript
await rngo.importSimulation(simulation.id)
```

## CLI

You can use the CLI from a local project by running:

```bash
npx rngo
```

or

```bash
yarn rngo
```

To install the CLI globaly, run:

```bash
npm install -g rngo
```

or

```bash
yarn global add rngo
```

For usage details, run:

```bash
rngo --help
```

## Contributing

### Release

To release, run

```bash
npm version <major|minor|patch>
npm push --tags
npm publish
```
