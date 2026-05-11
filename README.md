# Free Studies

A small static study quiz for science review.

The science questions are based on the book *Everything You Need to Ace Science in One Big Fat Notebook*.

## Features

- 150 quiz entries loaded from `data/free-studies.json`
- Four alternatives per question
- Instant feedback with the correct answer and a study tip
- Score, streak, progress, shuffle, and missed-question review

## Run Locally

```bash
npm start
```

Then open:

```text
http://127.0.0.1:5173/
```

If that port is already busy, start it on another port:

```bash
PORT=5174 npm start
```

## Test

```bash
npm test
```

## Deploy on Vercel

This project is configured as a static Vercel deployment from the repository root.
Vercel runs `npm run build`, which executes the test suite, then publishes the
static files in this directory.
