import {
  exchangeNpssoForAccessCode,
  exchangeAccessCodeForAuthTokens,
  type AuthorizationPayload,
} from 'psn-api';

// El NPSSO caduca ~cada 2 meses: hay que renovarlo manualmente en el .env / Vercel.
// Ver instrucciones en CLAUDE.md (sección PlayStation).
// Se lee en runtime (process.env) para que el valor no quede "congelado" en el build:
// así renovar el token en Vercel + redeploy basta, sin necesidad de un build limpio.
const NPSSO = process.env.PSN_NPSSO ?? import.meta.env.PSN_NPSSO;

// Cache en memoria del proceso (se mantiene mientras la función serverless esté "caliente").
let cached: { auth: AuthorizationPayload; expiresAt: number } | null = null;

/**
 * Devuelve una autorización válida para PSN, reautenticando con el NPSSO
 * solo cuando el access token está por expirar. El access token dura ~1h.
 */
export async function getPsnAuthorization(): Promise<AuthorizationPayload> {
  if (!NPSSO) {
    throw new Error('PSN_NPSSO no está configurado');
  }

  // 60s de margen para no usar un token a punto de expirar.
  if (cached && Date.now() < cached.expiresAt - 60_000) {
    return cached.auth;
  }

  const accessCode = await exchangeNpssoForAccessCode(NPSSO);
  const authorization = await exchangeAccessCodeForAuthTokens(accessCode);

  cached = {
    auth: authorization,
    expiresAt: Date.now() + authorization.expiresIn * 1000,
  };

  return authorization;
}
