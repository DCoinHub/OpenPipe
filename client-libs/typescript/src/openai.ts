import * as openai from "openai";
import * as Core from "openai/core";
import { readEnv, type RequestOptions } from "openai/core";
import type {
  ChatCompletion,
  ChatCompletionChunk,
  ChatCompletionCreateParams,
  ChatCompletionCreateParamsBase,
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionCreateParamsStreaming,
} from "openai/resources/chat/completions";

import { WrappedStream } from "./openai/streaming";
import { DefaultService, OPClient } from "./codegen";
import type { Stream } from "openai/streaming";
import { OpenPipeArgs, OpenPipeMeta, type OpenPipeConfig, getTags } from "./shared";

export type ClientOptions = openai.ClientOptions & { openpipe?: OpenPipeConfig };
export default class OpenAI extends openai.OpenAI {
  public opClient?: OPClient;

  constructor({ openpipe, ...options }: ClientOptions = {}) {
    super({ ...options });

    const openPipeApiKey = openpipe?.apiKey ?? readEnv("OPENPIPE_API_KEY");

    if (openPipeApiKey) {
      this.chat.setClient(
        new OPClient({
          BASE:
            openpipe?.baseUrl ?? readEnv("OPENPIPE_BASE_URL") ?? "https://app.openpipe.ai/api/v1",
          TOKEN: openPipeApiKey,
        }),
      );
    } else {
      console.warn(
        "You're using the OpenPipe client without an API key. No completion requests will be logged.",
      );
    }
  }
  chat: WrappedChat = new WrappedChat(this);
}

class WrappedChat extends openai.OpenAI.Chat {
  setClient(client: OPClient) {
    this.completions.opClient = client;
  }

  completions: WrappedCompletions = new WrappedCompletions(this.client);
}

class WrappedCompletions extends openai.OpenAI.Chat.Completions {
  opClient?: OPClient;

  constructor(client: openai.OpenAI, opClient?: OPClient) {
    super(client);
    this.opClient = opClient;
  }

  async _report(args: Parameters<DefaultService["report"]>[0]) {
    try {
      this.opClient ? await this.opClient.default.report(args) : Promise.resolve();
    } catch (e) {
      console.error(
        "OpenPipe: we ran into an error when trying to report usage data back to our servers. Don't worry, your completion still went through as intended and we've logged this on our side for further review.",
      );
    }
  }

  _create(
    body: ChatCompletionCreateParamsNonStreaming,
    options?: Core.RequestOptions,
  ): Core.APIPromise<ChatCompletion>;
  _create(
    body: ChatCompletionCreateParamsStreaming,
    options?: Core.RequestOptions,
  ): Core.APIPromise<Stream<ChatCompletionChunk>>;
  _create(
    body: ChatCompletionCreateParams,
    options?: Core.RequestOptions,
  ): Core.APIPromise<ChatCompletion | Stream<ChatCompletionChunk>> {
    let resp;
    if (body.model.startsWith("openpipe:")) {
      // @ts-expect-error looks like OpenAI has added more client functionality
      // we'll need to match. For now, we'll just ignore the type error.
      resp = this.opClient?.default.createChatCompletion({
        reqPayload: body,
      }) as Core.APIPromise<ChatCompletion>;
    } else {
      resp = body.stream ? super.create(body, options) : super.create(body, options);
    }

    return resp;
  }

  // @ts-expect-error It doesn't like the fact that I added a `Promise<>`
  // wrapper but I actually think the types are correct here.
  create(
    body: ChatCompletionCreateParamsNonStreaming & OpenPipeArgs,
    options?: Core.RequestOptions,
  ): Core.APIPromise<ChatCompletion & { openpipe: OpenPipeMeta }>;
  create(
    body: ChatCompletionCreateParamsStreaming & OpenPipeArgs,
    options?: Core.RequestOptions,
  ): Core.APIPromise<WrappedStream>;
  create(
    body: ChatCompletionCreateParamsBase & OpenPipeArgs,
    options?: Core.RequestOptions,
  ): Core.APIPromise<Stream<ChatCompletionChunk> | ChatCompletion>;
  async create(
    { openpipe, ...body }: ChatCompletionCreateParams & OpenPipeArgs,
    options?: Core.RequestOptions,
  ): Promise<Core.APIPromise<(ChatCompletion & { openpipe: OpenPipeMeta }) | WrappedStream>> {
    const requestedAt = Date.now();
    let reportingFinished: OpenPipeMeta["reportingFinished"] = Promise.resolve();
    let cacheRequested = openpipe?.cache ?? false;
    if (cacheRequested && body.stream) {
      console.warn(
        `Caching is not yet supported for streaming requests. Ignoring cache flag. Vote for this feature at https://github.com/OpenPipe/OpenPipe/issues/159`,
      );
      cacheRequested = false;
    }

    if (cacheRequested) {
      try {
        const cached = await this.opClient?.default
          .checkCache({
            requestedAt,
            reqPayload: body,
            tags: getTags(openpipe),
          })
          .then((res) => res.respPayload);

        if (cached) {
          const meta = {
            cacheStatus: "HIT",
            reportingFinished,
          };
          return {
            ...cached,
            openpipe: meta,
          };
        }
      } catch (e) {
        console.error(e);
      }
    }

    try {
      if (body.stream) {
        const stream = await this._create(body, options);
        let wrappedStream;
        try {
          wrappedStream = new WrappedStream(stream, (response) =>
            this._report({
              requestedAt,
              receivedAt: Date.now(),
              reqPayload: body,
              respPayload: response,
              statusCode: 200,
              tags: getTags(openpipe),
            }),
          );
        } catch (e) {
          console.error("OpenPipe: error creating wrapped stream");
          console.error(e);
          throw e;
        }

        // Do some logging of each chunk here

        return wrappedStream;
      } else {
        const response = await this._create(body, options);

        reportingFinished = this._report({
          requestedAt,
          receivedAt: Date.now(),
          reqPayload: body,
          respPayload: response,
          statusCode: 200,
          tags: getTags(openpipe),
        });
        return {
          ...response,
          openpipe: {
            cacheStatus: cacheRequested ? "MISS" : "SKIP",
            reportingFinished,
          },
        };
      }
    } catch (error: unknown) {
      if (error instanceof openai.APIError) {
        const rawMessage = error.message as string | string[];
        const message = Array.isArray(rawMessage) ? rawMessage.join(", ") : rawMessage;
        reportingFinished = this._report({
          requestedAt,
          receivedAt: Date.now(),
          reqPayload: body,
          respPayload: error.error,
          statusCode: error.status,
          errorMessage: message,
          tags: getTags(openpipe),
        });
      }
      // make sure error is an object we can add properties to
      if (typeof error === "object" && error !== null) {
        error = {
          ...error,
          openpipe: {
            cacheStatus: cacheRequested ? "MISS" : "SKIP",
            reportingFinished,
          },
        };
      }

      throw error;
    }
  }
}
