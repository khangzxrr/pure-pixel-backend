import { ContextType, ExecutionContext } from '@nestjs/common';

//typed by src/types/tieng-viet-khong-dau.d.ts
import * as tvkd from 'tieng-viet-khong-dau';

type GqlContextType = 'graphql' | ContextType;

//the part of @nestjs/graphql used here (optional dependency, loaded lazily)
interface GqlModule {
  GqlExecutionContext: {
    create(context: ExecutionContext): {
      getContext<T>(): T;
    };
  };
}

//claims of a decoded OIDC access token that this app reads
export interface TokenClaims {
  sub: string;
  iss: string;
  aud?: string | string[];
  exp?: number;
  name?: string;
  email?: string;
  preferred_username?: string;
  resource_access?: Record<string, { roles: string[] }>;
}

export class Utils {
  //returns process.env[name] unchanged (undefined when it is not set)
  //for library options typed as string, so a missing variable behaves exactly as before
  static env(name: string): string {
    return process.env[name] as string;
  }

  static getExtension(path: string) {
    return path.split('.').at(-1);
  }

  static removedNullChar(text: string): string {
    return text.replaceAll(/\0/g, '').replaceAll('\\u0000', '');
  }

  //note: an empty string still returns null at runtime
  static normalizeText(text: string): string;
  static normalizeText(text?: string | null): string | null;
  static normalizeText(text?: string | null): string | null {
    if (!text) {
      return null;
    }

    return tvkd.cLowerCase(this.removedNullChar(text).trim().toLowerCase());
  }

  static randomString(length: number) {
    let result = '';
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }

    return result;
  }

  static regexFileExtension = /(?:\.([^.]+))?$/;
}

//both values stay undefined for unsupported context types (response also for ws)
export const extractRequest = <TRequest = unknown, TResponse = unknown>(
  context: ExecutionContext,
): [TRequest | undefined, TResponse | undefined] => {
  let request: TRequest | undefined, response: TResponse | undefined;

  // Check if request is coming from graphql or http
  if (context.getType() === 'http') {
    // http request
    const httpContext = context.switchToHttp();

    request = httpContext.getRequest<TRequest>();
    response = httpContext.getResponse<TResponse>();
  } else if (context.getType<GqlContextType>() === 'graphql') {
    let gql: GqlModule;
    // Check if graphql is installed
    try {
      gql = require('@nestjs/graphql');
    } catch (er) {
      throw new Error('@nestjs/graphql is not installed, cannot proceed');
    }

    // graphql request
    const gqlContext = gql.GqlExecutionContext.create(context).getContext<{
      req: TRequest;
      res: TResponse;
    }>();

    request = gqlContext.req;
    response = gqlContext.res;
  } else if (context.getType() === 'ws') {
    request = context.getArgs<[TRequest]>()[0];
  }

  return [request, response];
};

export const parseToken = (token: string): TokenClaims => {
  const parts = token.split('.');
  return JSON.parse(Buffer.from(parts[1], 'base64').toString());
};
