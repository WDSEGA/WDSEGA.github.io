---
layout: post
title: "Claude Fable 5 Is Here: Stripe Used It to Replace 2 Months of Team Work in One Day"
date: 2026-06-12
tags: [ai, anthropic, claude, llm]
description: "Anthropic just released Claude Fable 5 and Mythos 5. Stripe tested it on 50 million lines of Ruby code and finished a 2-month migration in a single day. Here's what changed."
canonical_url: "https://wdsega.github.io/claude-fable-5-mythos-5-release"
---

Anthropic dropped Claude Fable 5 on June 9th. No preview period, no waitlist — just available.

The headline benchmark isn't a leaderboard number. It's a real-world test: Stripe handed it a 50-million-line Ruby codebase and asked it to handle a migration that would've taken their entire engineering team two months. Fable 5 finished it in one day.

That's the kind of result that stops being a talking point and starts being a hiring conversation.

## What "Mythos-Class" Actually Means

Anthropic introduced a new tier above Opus. They're calling it Mythos. Fable 5 is the public-facing version — Mythos 5 is the same base model but with fewer safety restrictions, available to vetted partners in life science and cybersecurity.

The distinction matters because Anthropic is being explicit about what the limits are and why they exist. Fable 5 ships with three hard safety classifiers: one for offensive cybersecurity, one for bio/chem research, and one for model distillation attacks. If you trip them, your request gets handed to Opus 4.8 instead. Trigger rate is under 5% of sessions.

For most developers, you'll never notice.

## The Numbers Worth Keeping

On Cognition's FrontierCode benchmark, Fable 5 scores highest among frontier models. On Hebbia's financial reasoning benchmark — which tests multi-step document analysis the way an actual analyst would use it — Fable 5 is first. On Replit's vibe coding benchmark, it wins while using fewer tokens than competitors.

What's interesting is the vision benchmark. Fable 5 is the first model to beat Pokémon FireRed using only visual input, no cheat tools, no structured game state. It rebuilt a web application from a screenshot. It extracted data from dense scientific charts that previously required manual reading.

None of these are party tricks. They're proxy tests for whether the model can handle ambiguous visual inputs in real workflows.

## The Long-Context Memory Problem Is Getting Solved

Anthropic ran a persistent memory test using *Slay the Spire*. For Fable 5, having persistent memory improved performance 3x compared to Opus 4.8's 1x improvement.

The implication: Fable 5 isn't just better at tasks, it's better at *staying on task* across sessions that span millions of tokens. A CEO quoted in the release reported that in 36 hours, Fable 5 matched four days of GPT-5.5 work on physics research problems, using one-third the reasoning tokens.

That's not a benchmark. That's someone's actual workday.

## Pricing

Input: $10 per million tokens.  
Output: $50 per million tokens.

Anthropic says that's less than half the price of Mythos Preview. Pro, Max, Team, and Enterprise subscribers get free access through June 22nd. After that, you'll need usage credits.

API model name: `claude-fable-5`

## What This Changes

The honest read is that Fable 5 is designed for tasks that have so far required humans specifically because they required sustained attention, multi-step reasoning across long documents, and the ability to recover from ambiguous inputs.

Code migration. Financial analysis. Scientific literature review. These aren't AI demos anymore. They're billable work that organizations are now running through an API.

The question is no longer whether the model can do the work. It's whether the infrastructure, the security review, and the organizational habits can keep up.

---

*Claude Fable 5 is available now via Anthropic API and all major subscription tiers.*
