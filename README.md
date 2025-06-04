# Demineur

This project is a relaxing Minesweeper clone. Tests are written with [Jest](https://jestjs.io/).

## Custom Boards

You can create custom games with dimensions from 5x5 up to 500x500 cells via the
"Custom" button on the main menu. Mine counts are limited to 30% of the total
tiles.

## Running Tests

Install dependencies once:

```bash
npm install
```

Execute the test suite:

```bash
npm test
```

This runs Jest and reports the results for all files in the `tests/` directory.
