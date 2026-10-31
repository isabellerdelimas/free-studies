# Free Studies

A small static study quiz for science, civics, and math review.

The science questions are based on the book *Everything You Need to Ace Science in One Big Fat Notebook*.

## Features

- Subject-based quiz entries loaded from `data/free-studies.json`
- 5,400 questions in total, with 200 in every selectable chapter, Math lesson, Civics unit, Chapter 15 unit, and the Waves study guide
- 1,000 Math problems across lessons 2–6: area and perimeter, scale factor, currency, and measurement conversions
- Adjustable rounds of up to 200 questions, without repeats
- New practice questions have hints before answering and explanations after answering
- Currency problems use stated practice rates, not live exchange rates
- Every Math problem includes a labeled diagram of its given values, including in missed-answer review
- Four alternatives per question
- Instant feedback with the correct answer and a study tip
- Score, streak, progress, shuffle, and missed-question review

## Science photo additions

- Chapter 22 — Minerals, Rocks, and Earth’s Structure: 200 original practice questions based on the supplied pages 228–236 (IMG_7996–IMG_7999 and IMG_8001–IMG_8005).
- Chapter 23 — Earth’s Crust in Motion: 200 original practice questions based on the supplied pages 239–248 (IMG_8006–IMG_8015).
- Questions include identification, new scenarios, comparisons, and calculations with stated practice values. Each records its source pages and photo filenames. Numerical examples are invented practice data, not measurements of current geological events.
- Explanations distinguish solid, slowly deforming mantle from liquid outer core, and earthquake amplitude from energy. Original photos are not published with the quiz.

## Civics source boundaries

- Unit 1.4: **Fifth Amendment only**, from pages 7–15 of *Copy of 1.4 bill of rights master.pdf*. Other amendments are excluded from the unit's coverage.
- Unit 2.1: *2.1 Federalism master.pptx (1).pdf*, through slide 8 inclusive. Bellwork and its answers (slides 1–2), the test announcement (slide 3), and slides 9 onward are excluded. Practice uses the federal-system diagram, constitutional excerpts, cake comparison, powers chart, and vocabulary on slides 4–8.
- Each new unit has 200 original practice questions with source-page metadata, hints, and answer explanations. Civics questions have no illustrations; visuals remain specific to Math.

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
Vercel runs `npm run build`, which executes the test suite and copies the static
site files into `dist/` for publishing.
