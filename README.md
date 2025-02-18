 <p align="center">
  <a href="https://openpipe.ai">
    <img height="70" src="https://github.com/openpipe/openpipe/assets/41524992/70af25fb-1f90-42d9-8a20-3606e3b5aaba" alt="logo">
  </a>
</p>
<h1 align="center">
  OpenPipe
</h1>

<p align="center">
  <i>Turn expensive prompts into cheap fine-tuned models.</i>
</p>

<p align="center">
  <a href="/LICENSE"><img alt="License Apache-2.0" src="https://img.shields.io/github/license/openpipe/openpipe?style=flat-square"></a>
  <a href='http://makeapullrequest.com'><img alt='PRs Welcome' src='https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square'/></a>
  <a href="https://github.com/openpipe/openpipe/graphs/commit-activity"><img alt="GitHub commit activity" src="https://img.shields.io/github/commit-activity/m/openpipe/openpipe?style=flat-square"/></a>
  <a href="https://github.com/openpipe/openpipe/issues"><img alt="GitHub closed issues" src="https://img.shields.io/github/issues-closed/openpipe/openpipe?style=flat-square"/></a>
 <img src="https://img.shields.io/badge/Y%20Combinator-S23-orange?style=flat-square" alt="Y Combinator S23">
</p>

<p align="center">
  <a href="https://app.openpipe.ai/">Hosted App</a> - <a href="#running-locally">Running Locally</a> - <a href="#sample-experiments">Experiments</a>
</p>

<br>
Use powerful but expensive LLMs to fine-tune smaller and cheaper models suited to your exact needs. Evaluate model and prompt combinations in the playground. Query your past requests and export optimized training data. Try it out at https://app.openpipe.ai or <a href="#running-locally">run it locally</a>.
<br>


## Features

 * <b>Experiment</b>
   * Compare models and prompts against one another.
   * Bulk-test wide-reaching scenarios using code templating.
   * Autogenerate scenarios for fresh test perspectives.

 * <b>Fine-Tune (Beta)</b>
   * Easy integration with OpenPipe's SDK in both Python and JS.
   * Swiftly query logs using intuitive built-in filters.
   * Export data in multiple training formats, including Alpaca and ChatGPT, with deduplication.
   
<img src="https://github.com/openpipe/openpipe/assets/41524992/eaa8b92d-4536-4f63-bbef-4b0b1a60f6b5" alt="fine-tune demo">

<!-- <img height="400px" src="https://github.com/openpipe/openpipe/assets/41524992/66bb1843-cb72-4130-a369-eec2df3b8201" alt="playground demo"> -->


## Sample Experiments

These are sample experiments users have created that show how OpenPipe works. Feel free to fork them and start experimenting yourself.

- [Twitter Sentiment Analysis](https://app.openpipe.ai/experiments/62c20a73-2012-4a64-973c-4b665ad46a57)
- [Reddit User Needs](https://app.openpipe.ai/experiments/22222222-2222-2222-2222-222222222222)
- [OpenAI Function Calls](https://app.openpipe.ai/experiments/2ebbdcb3-ed51-456e-87dc-91f72eaf3e2b)
- [Activity Classification](https://app.openpipe.ai/experiments/3950940f-ab6b-4b74-841d-7e9dbc4e4ff8)

## Supported Models

#### OpenAI
  - [GPT 3.5 Turbo](https://platform.openai.com/docs/guides/gpt/chat-completions-api)
  - [GPT 3.5 Turbo 16k](https://platform.openai.com/docs/guides/gpt/chat-completions-api)
  - [GPT 4](https://openai.com/gpt-4)
#### Llama2
  - [7b chat](https://replicate.com/a16z-infra/llama7b-v2-chat)
  - [13b chat](https://replicate.com/a16z-infra/llama13b-v2-chat)
  - [70b chat](https://replicate.com/replicate/llama70b-v2-chat)
#### Llama2 Fine-Tunes
  - [Open-Orca/OpenOrcaxOpenChat-Preview2-13B](https://huggingface.co/Open-Orca/OpenOrcaxOpenChat-Preview2-13B)
  - [Open-Orca/OpenOrca-Platypus2-13B](https://huggingface.co/Open-Orca/OpenOrca-Platypus2-13B)
  - [NousResearch/Nous-Hermes-Llama2-13b](https://huggingface.co/NousResearch/Nous-Hermes-Llama2-13b)
  - [jondurbin/airoboros-l2-13b-gpt4-2.0](https://huggingface.co/jondurbin/airoboros-l2-13b-gpt4-2.0)
  - [lmsys/vicuna-13b-v1.5](https://huggingface.co/lmsys/vicuna-13b-v1.5)
  - [Gryphe/MythoMax-L2-13b](https://huggingface.co/Gryphe/MythoMax-L2-13b)
  - [NousResearch/Nous-Hermes-llama-2-7b](https://huggingface.co/NousResearch/Nous-Hermes-llama-2-7b)
#### Anthropic
  - [Claude 1 Instant](https://www.anthropic.com/index/introducing-claude)
  - [Claude 2](https://www.anthropic.com/index/claude-2)

## Running Locally

1. Install [Postgresql](https://www.postgresql.org/download/).
2. Install [NodeJS 20](https://nodejs.org/en/download/current) (earlier versions will very likely work but aren't tested).
3. Install `pnpm`: `npm i -g pnpm`
4. Clone this repository: `git clone https://github.com/openpipe/openpipe`
5. Install the dependencies: `cd openpipe && pnpm install`
6. Create a `.env` file (`cp .env.example .env`) and enter your `OPENAI_API_KEY`.
7. Update `DATABASE_URL` if necessary to point to your Postgres instance and run `pnpm prisma migrate dev` to create the database.
8. Create a [GitHub OAuth App](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app), set the callback URL to `<your local instance>/api/auth/callback/github`, e.g. `http://localhost:3000/api/auth/callback/github`.
9. Update the `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` values from the Github OAuth app (Note: a PR to make auth optional when running locally would be a great contribution!).
10. Start the app: `pnpm dev`.
11. Navigate to [http://localhost:3000](http://localhost:3000)

## Testing Locally

1. Copy your `.env` file to `.env.test`.
2. Update the `DATABASE_URL` to have a different database name than your development one
3. Run `DATABASE_URL=[your new datatase url] pnpm prisma migrate dev --skip-seed --skip-generate`
4. Run `pnpm test`
