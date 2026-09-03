---
name: deep-interview
description: Run a focused requirements interview before building, to surface the real goal behind the request, scope boundaries, edge cases, constraints, and success criteria — then write a short brief the user confirms and build from it. Use this whenever someone asks to build, make, create, design, or implement something whose requirements are not already pinned down: "만들어줘", "build me a…", "I need a tool that…", a new project, a vague feature request, or a rewrite. Also use it when a request looks clear but hides real decisions — who uses it, what the data looks like, what happens when it fails, what "done" means. Do NOT use it for small fully-specified changes (fix a typo, rename a symbol, bump a version, apply this diff) or when the user already handed over a detailed spec; questions there just burn their time.
---

# Deep interview

## Why this exists

The expensive failure in build work is not bad code — it is well-built code that
answers the wrong question. That failure is set in motion in the first sixty
seconds, when a one-line request ("make me a dashboard") gets treated as a
complete specification. The gap between what someone types and what they
actually need is filled by guesses, and the guesses only surface after the work
is done, when the cost of changing direction is highest.

This skill closes that gap up front — but on a strict budget. An interrogation
is its own failure mode: fifteen questions before a single line of code is worse
than a reasonable guess, because it pushes the work back onto the person who
asked for it. Few questions, high leverage, then build.

## How much to ask

Match the questioning to what a wrong guess would cost:

| Situation | Budget |
|---|---|
| Local, reversible change in existing code | 0 questions — just do it |
| A feature inside a system you can read | 1–3 questions, one batch |
| New project, new user-facing surface, or anything touching money, privacy, or data loss | Up to ~6 questions, two batches max |

Then stop asking and start building. If uncertainty remains, name it as a
written assumption and proceed — a stated assumption the user can correct is
worth more than a question that stalls the work.

## The filter that decides what to ask

Before asking anything, run this test on the question:

> Imagine the two most likely answers. Would I build something **materially
> different** depending on which one it is?

If yes, ask. If no, decide it yourself, note the choice in one clause, and move
on. This single filter is what separates a useful interview from a survey.

"Should the button be blue or green?" fails the test — pick one. "Is this for
one person or a team?" usually passes, because it changes storage, auth, and
concurrency all at once.

## Step 1 — Research before you ask

Never spend a question on something the codebase, the files, or the
conversation can answer. Read the repo, look at neighboring code, check for
existing conventions and prior art. Nothing erodes trust faster than being
asked what language the project is in.

Research also makes the remaining questions sharper: instead of "what's your
stack?", you get to ask "you're on vanilla JS with no build step — do you want
to keep it that way, or is adding a bundler on the table?"

## Step 2 — Ask in batches, with concrete options

Put the questions in one batch rather than a back-and-forth trickle; each
round-trip costs the user a context switch. Where a question has a small set of
plausible answers, offer them as options with the trade-off spelled out —
recognizing an option is far easier than generating one from a blank prompt.
Lead with the option you would pick and say it is your recommendation, so
someone who does not care can accept the default and move on.

Where the tooling offers a structured question UI, use it. Otherwise ask in
prose, numbered, so answers can be mapped back.

## Step 3 — Probe edge cases by proposing them, not asking for them

"Any edge cases I should know about?" almost always returns "no", and is almost
always wrong. People recognize edge cases instantly but rarely enumerate them
cold.

So propose the handling instead, and let them correct you:

> 빈 목록일 때는 안내 문구를 띄우고, 중복 제출은 무시하고, 네트워크가 끊기면
> 로컬에 저장했다가 재시도하겠습니다. 이 중 다르게 가야 할 게 있나요?

Three named cases with a proposed behavior surfaces more real requirements than
any open-ended prompt. Draw the candidates from the failure modes this kind of
system actually has: empty and huge inputs, duplicates, concurrent use,
partial failure, permissions, and what happens on the second run.

## Step 4 — Get an observable finish line

Ask how they will know it worked. Vague goals produce endless revisions, and
"완료 기준" is the cheapest thing to pin down:

- What should be true when this is done?
- How will you check it — a test, a screen you look at, a number you compare?
- What is explicitly **not** in scope this round?

Non-goals are worth as much as goals. They are cheap to state and they stop
scope drift before it starts.

## Step 5 — Write the brief and confirm once

Play the answers back as a short brief before building. This is where
misunderstandings surface while they are still free to fix. Keep it to a
screenful:

```markdown
## 목표
한 문장으로: 누가, 무엇을, 왜.

## 만들 것
- 범위 안에 있는 항목

## 만들지 않을 것
- 이번 라운드에서 제외하는 항목

## 정해진 것
- 인터뷰에서 확인된 결정들

## 가정
- 답을 받지 못해 이렇게 가정하고 진행하는 부분 (틀리면 알려달라고 명시)

## 완료 기준
- 관찰 가능한 확인 방법
```

Ask for one confirmation ("이대로 진행할까요?"), then build. Do not run a
second interview round on the brief itself — corrections come as edits, not as
a new questionnaire.

Keep the brief in the conversation by default. Write it to a file only when the
work is large enough to span sessions or other people need to read it.

## Step 6 — Build, and keep the assumptions visible

Carry the assumptions into the work. When one turns out to be wrong mid-build,
say so and adjust rather than silently building around it. When you deliver,
restate which assumptions the result rests on — that is what lets the user spot
a wrong turn in one glance instead of one review cycle.

## Question bank

Draw from these only as far as the budget allows, and only for questions that
pass the filter in Step 2.

**Purpose** — What breaks or annoys you today that this fixes? What do you do
instead right now?

**Users** — Who touches this besides you? One person or many at once? What do
they know already?

**Data** — What goes in, what comes out? How much of it, realistically? Where
does it live between runs, and does it need to survive a restart?

**Constraints** — Anything fixed: language, framework, hosting, deadline,
things it must interoperate with, things you are stuck with?

**Failure** — What happens when it breaks? Is it worse to be wrong or to be
slow? Can a mistake be undone?

**Done** — What does the finished thing look like? What is out of scope?

## Conduct

Interview in the language the user is writing in. Ask about their problem, not
their proposed solution — when someone requests a specific mechanism, find out
what it is for, because the goal often admits a better means than the one they
named. Take "I don't know" or "just pick something" as a real answer: record it
as an assumption and keep moving. Stop interviewing the moment you know enough
to build something worth reacting to; a rough working thing generates better
requirements than any further questioning.
