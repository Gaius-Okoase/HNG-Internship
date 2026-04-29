import { randomBytes, createHash } from 'crypto';

export const generateCodeVerifier = () => {
  const buf = randomBytes(64).toString('base64url');

  return buf;
};

export const generateCodeChallenge = (code_verifier: string) => {
  const hash = createHash('sha256').update(code_verifier).digest('base64url');

  return hash;
};

export const generateState = () => {
  const state: string = randomBytes(16).toString('base64url');

  return state;
};
