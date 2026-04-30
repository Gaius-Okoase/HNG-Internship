import { randomBytes, createHash } from 'crypto';

export const generateCodeVerifier = () => {
  return randomBytes(64).toString('base64url');
};

export const generateCodeChallenge = (code_verifier: string) => {
  return createHash('sha256').update(code_verifier).digest('base64url');
};

export const generateState = () => {
  const state: string = randomBytes(16).toString('base64url');

  return state;
};
