import { exchangeNpssoForAccessCode, exchangeAccessCodeForAuthTokens } from 'psn-api';

export const prerender = false;

// ⚠️ TEMPORAL — endpoint de diagnóstico. Borrar tras depurar.
export async function GET() {
  const fromProcess = process.env.PSN_NPSSO;
  const fromMeta = import.meta.env.PSN_NPSSO;
  const npsso = fromProcess ?? fromMeta;

  const info: Record<string, unknown> = {
    hasProcessEnv: Boolean(fromProcess),
    processEnvLen: fromProcess ? String(fromProcess).length : 0,
    hasMetaEnv: Boolean(fromMeta),
    metaEnvLen: fromMeta ? String(fromMeta).length : 0,
    nodeVersion: process.version,
  };

  if (!npsso) {
    return new Response(JSON.stringify({ ...info, stage: 'no-npsso' }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const accessCode = await exchangeNpssoForAccessCode(String(npsso).trim());
    info.gotAccessCode = Boolean(accessCode);
    const auth = await exchangeAccessCodeForAuthTokens(accessCode);
    info.gotAccessToken = Boolean(auth.accessToken);
    info.stage = 'ok';
  } catch (err) {
    info.stage = 'auth-failed';
    info.errorName = err instanceof Error ? err.name : typeof err;
    info.errorMessage = err instanceof Error ? err.message : String(err);
  }

  return new Response(JSON.stringify(info, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
