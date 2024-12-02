import { ContextType, ExecutionContext } from '@nestjs/common';
import KeycloakConnect from 'keycloak-connect';
import {
  KeycloakMultiTenantService,
  KeycloakConnectConfig,
} from 'nest-keycloak-connect';

import * as tvkd from 'tieng-viet-khong-dau';

type GqlContextType = 'graphql' | ContextType;

export class Utils {
  static getExtension(path: string) {
    return path.split('.').at(-1);
  }

  static removedNullChar(text: string): string {
    return text.replaceAll(/\0/g, '').replaceAll('\\u0000', '');
  }

  static normalizeText(text?: string) {
    if (!text) {
      return null;
    }

    return tvkd.cLowerCase(this.removedNullChar(text).toLowerCase());
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

export const useKeycloak = async (
  request: any,
  jwt: string,
  singleTenant: KeycloakConnect.Keycloak,
  multiTenant: KeycloakMultiTenantService,
  opts: KeycloakConnectConfig,
): Promise<KeycloakConnect.Keycloak> => {
  if (opts.multiTenant && opts.multiTenant.realmResolver) {
    const resolvedRealm = opts.multiTenant.realmResolver(request);
    const realm =
      resolvedRealm instanceof Promise ? await resolvedRealm : resolvedRealm;
    return await multiTenant.get(realm, request);
  } else if (!opts.realm) {
    const payload = parseToken(jwt);
    const issuerRealm = payload.iss.split('/').pop();
    return await multiTenant.get(issuerRealm, request);
  }
  return singleTenant;
};

export const extractRequest = (context: ExecutionContext): [any, any] => {
  let request: any, response: any;

  // Check if request is coming from graphql or http
  if (context.getType() === 'http') {
    // http request
    const httpContext = context.switchToHttp();

    request = httpContext.getRequest();
    response = httpContext.getResponse();
  } else if (context.getType<GqlContextType>() === 'graphql') {
    let gql: any;
    // Check if graphql is installed
    try {
      gql = require('@nestjs/graphql');
    } catch (er) {
      throw new Error('@nestjs/graphql is not installed, cannot proceed');
    }

    // graphql request
    const gqlContext = gql.GqlExecutionContext.create(context).getContext();

    request = gqlContext.req;
    response = gqlContext.res;
  } else if (context.getType() === 'ws') {
    request = context.getArgs()[0];
  }

  return [request, response];
};

export const parseToken = (token: string): any => {
  const parts = token.split('.');
  return JSON.parse(Buffer.from(parts[1], 'base64').toString());
};
