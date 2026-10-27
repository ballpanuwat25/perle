"use client";

import { useState } from "react";
import { QUESTIONS, pick } from "@/lib/finder";
import s from "./Finder.module.css";

// The routine finder: three questions about how skin feels, never about conditions. It runs in
// the page and keeps nothing.
export function Finder() {
  const [answers, setAnswers] = useState<number[]>([]);
  const step = answers.length, done = step === QUESTIONS.length;
  const q = QUESTIONS[step];
  const routine = done ? pick(answers) : [];

  return (
    <section className={s.finder} id="finder" aria-labelledby="finder-title">
      <header className={s.head}>
        <h2 id="finder-title">Find yours.</h2>
        <p>Three questions about how your skin feels. Nothing you pick leaves this page.</p>
      </header>
      <div className={s.card} aria-live="polite">
        {!done ? (
          <fieldset key={q.id} className={s.question}>
            <legend>
              <span className={`mono ${s.count}`}>{step + 1} / {QUESTIONS.length}</span>
              <span className={s.ask}>{q.ask}</span>
            </legend>
            <div className={s.answers}>
              {q.answers.map((a, i) => (
                <button key={a.label} type="button" onClick={() => setAnswers([...answers, i])}>{a.label}</button>
              ))}
            </div>
            {step > 0 && <button type="button" className={s.back} onClick={() => setAnswers(answers.slice(0, -1))}>← Back</button>}
          </fieldset>
        ) : (
          <div className={s.result}>
            <p className={`mono ${s.count}`}>Your routine · {routine.length} {routine.length === 1 ? "step" : "steps"}</p>
            <ol>
              {routine.map((p, i) => (
                <li key={p.id}>
                  <span className={`mono ${s.n}`}>{i + 1}</span>
                  <span className={s.name}><strong>{p.formula.product}</strong><span>{p.feel}</span></span>
                  <span className={`mono ${s.price}`}>{p.formula.price}</span>
                </li>
              ))}
            </ol>
            <div className={s.actions}>
              <a href="#buy">Where to buy</a>
              <button type="button" className={s.back} onClick={() => setAnswers([])}>Start again</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
