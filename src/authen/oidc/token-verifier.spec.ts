import { generateKeyPair, KeyLike, SignJWT } from 'jose';
import { TokenVerifier } from './token-verifier';

describe('TokenVerifier', () => {
  const issuer = 'https://auth.test/application/o/purepixel/';
  const audience = 'purepixel';

  let publicKey: KeyLike;
  let privateKey: KeyLike;

  beforeAll(async () => {
    const keyPair = await generateKeyPair('RS256');
    publicKey = keyPair.publicKey;
    privateKey = keyPair.privateKey;
  });

  const buildVerifier = () =>
    new TokenVerifier({
      issuer,
      audience,
      jwks: async () => publicKey,
    });

  const signToken = async (
    claims: Record<string, unknown>,
    key: KeyLike,
    opts?: { issuer?: string; audience?: string; expirationTime?: string },
  ) => {
    return new SignJWT(claims)
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuer(opts?.issuer ?? issuer)
      .setAudience(opts?.audience ?? audience)
      .setExpirationTime(opts?.expirationTime ?? '5m')
      .sign(key);
  };

  it('resolves claims with sub for a valid token', async () => {
    const verifier = buildVerifier();
    const token = await signToken(
      {
        sub: 'u1',
        resource_access: { purepixel: { roles: ['photographer'] } },
      },
      privateKey,
    );

    const claims = await verifier.verify(token);

    expect(claims.sub).toBe('u1');
  });

  it('rejects a token with a wrong issuer', async () => {
    const verifier = buildVerifier();
    const token = await signToken({ sub: 'u1' }, privateKey, {
      issuer: 'https://evil/',
    });

    await expect(verifier.verify(token)).rejects.toBeTruthy();
  });

  it('rejects a token with a wrong audience', async () => {
    const verifier = buildVerifier();
    const token = await signToken({ sub: 'u1' }, privateKey, {
      audience: 'other',
    });

    await expect(verifier.verify(token)).rejects.toBeTruthy();
  });

  it('rejects an expired token', async () => {
    const verifier = buildVerifier();
    const token = await new SignJWT({ sub: 'u1' })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuer(issuer)
      .setAudience(audience)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(privateKey);

    await expect(verifier.verify(token)).rejects.toBeTruthy();
  });

  it('rejects a token signed with a different private key', async () => {
    const verifier = buildVerifier();
    const otherKeyPair = await generateKeyPair('RS256');
    const token = await signToken({ sub: 'u1' }, otherKeyPair.privateKey);

    await expect(verifier.verify(token)).rejects.toBeTruthy();
  });

  it('rejects an unsigned token', async () => {
    const verifier = buildVerifier();
    const header = Buffer.from(JSON.stringify({ alg: 'none' })).toString(
      'base64url',
    );
    const payload = Buffer.from(
      JSON.stringify({ sub: 'u1', iss: issuer, aud: audience }),
    ).toString('base64url');
    const token = `${header}.${payload}.`;

    await expect(verifier.verify(token)).rejects.toBeTruthy();
  });

  it('getRoles returns the roles under resource_access for the configured audience', () => {
    const verifier = buildVerifier();

    const roles = verifier.getRoles({
      resource_access: { purepixel: { roles: ['customer', 'manager'] } },
    });

    expect(roles).toEqual(['customer', 'manager']);
  });

  it('getRoles returns an empty array when resource_access has no entry for the audience', () => {
    const verifier = buildVerifier();

    const roles = verifier.getRoles({
      resource_access: { other: { roles: ['x'] } },
    });

    expect(roles).toEqual([]);
  });

  it('getRoles returns an empty array when resource_access is missing', () => {
    const verifier = buildVerifier();

    const roles = verifier.getRoles({});

    expect(roles).toEqual([]);
  });

  it('falls back to env vars OIDC_ISSUER/OIDC_CLIENT_ID when no options are passed', () => {
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      OIDC_ISSUER: 'https://env/app/',
      OIDC_CLIENT_ID: 'cid',
    };

    try {
      const verifier = new TokenVerifier();

      const roles = verifier.getRoles({
        resource_access: { cid: { roles: ['a'] } },
      });

      expect(roles).toEqual(['a']);
    } finally {
      process.env = originalEnv;
    }
  });
});
