import { Inject, Injectable, Optional } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify, JWTVerifyGetKey } from 'jose';
import { TokenClaims } from 'src/infrastructure/utils/utils';

export const TOKEN_VERIFIER_OPTIONS = 'TOKEN_VERIFIER_OPTIONS';

export type TokenVerifierOptions = {
  issuer?: string;
  audience?: string;
  jwks?: JWTVerifyGetKey;
};

@Injectable()
export class TokenVerifier {
  private jwks?: JWTVerifyGetKey;

  constructor(
    @Optional()
    @Inject(TOKEN_VERIFIER_OPTIONS)
    private readonly options?: TokenVerifierOptions,
  ) {
    this.jwks = options?.jwks;
  }

  get issuer(): string {
    return this.options?.issuer ?? (process.env.OIDC_ISSUER as string);
  }

  get audience(): string {
    return this.options?.audience ?? (process.env.OIDC_CLIENT_ID as string);
  }

  //the remote key set is fetched lazily so the env can be read at call time
  private getJwks(): JWTVerifyGetKey {
    if (!this.jwks) {
      const url =
        process.env.OIDC_JWKS_URL ?? `${process.env.OIDC_ISSUER ?? ''}jwks/`;

      this.jwks = createRemoteJWKSet(new URL(url));
    }

    return this.jwks;
  }

  async verify(jwt: string): Promise<TokenClaims> {
    const { payload } = await jwtVerify(jwt, this.getJwks(), {
      issuer: this.issuer,
      audience: this.audience,
      algorithms: ['RS256', 'ES256'],
    });

    return payload as unknown as TokenClaims;
  }

  getRoles(claims: Partial<TokenClaims> | undefined): string[] {
    return claims?.resource_access?.[this.audience]?.roles ?? [];
  }
}
