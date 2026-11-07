const stateCookieName = 'cms_oauth_state';
const stateCookieMaxAge = 600;
const allowedGitHubUserId = 105994376;

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getAllowedDomainPatterns(env) {
  return (env.ALLOWED_DOMAINS ?? '')
    .split(',')
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean)
    .map((domain) => new RegExp(`^${escapeRegExp(domain).replaceAll('\\*', '.+')}$`));
}

function isAllowedOrigin(origin, patterns) {
  if (!patterns.length) return false;

  try {
    const url = new URL(origin);
    const isLocalhost =
      url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    if (
      (url.protocol !== 'https:' && !(isLocalhost && url.protocol === 'http:')) ||
      url.username ||
      url.password
    ) {
      return false;
    }

    return patterns.some((pattern) => pattern.test(url.hostname.toLowerCase()));
  } catch {
    return false;
  }
}

function getAllowedOrigin(request, patterns) {
  const originHeader = request.headers.get('Origin');
  const refererHeader = request.headers.get('Referer');
  let origin = originHeader;

  if (!origin && refererHeader) {
    try {
      origin = new URL(refererHeader).origin;
    } catch {
      return null;
    }
  }

  return origin && isAllowedOrigin(origin, patterns) ? origin : null;
}

function createState() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(
    '',
  );
}

function readStateCookie(request, patterns) {
  const cookie = request.headers
    .get('Cookie')
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${stateCookieName}=`));

  if (!cookie) return null;

  try {
    const transaction = JSON.parse(
      decodeURIComponent(cookie.slice(stateCookieName.length + 1)),
    );
    if (
      typeof transaction.state === 'string' &&
      typeof transaction.origin === 'string' &&
      isAllowedOrigin(transaction.origin, patterns)
    ) {
      return transaction;
    }
  } catch {
    return null;
  }

  return null;
}

function clearStateCookie() {
  return `${stateCookieName}=; HttpOnly; Secure; SameSite=Lax; Path=/callback; Max-Age=0`;
}

function callbackError(message, status) {
  return new Response(message, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Set-Cookie': clearStateCookie(),
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const allowedDomainPatterns = getAllowedDomainPatterns(env);

    if (url.pathname !== '/auth' && url.pathname !== '/callback') {
      return new Response('Not Found', { status: 404 });
    }

    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: { Allow: 'GET' },
      });
    }

    if (url.pathname === '/auth') {
      if (!allowedDomainPatterns.length) {
        return new Response('OAuth is not configured', { status: 500 });
      }
      const origin = getAllowedOrigin(request, allowedDomainPatterns);
      if (!origin) return new Response('Forbidden', { status: 403 });
      if (!env.GITHUB_CLIENT_ID) {
        return new Response('OAuth is not configured', { status: 500 });
      }

      const state = createState();
      const githubUrl = new URL('https://github.com/login/oauth/authorize');
      githubUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
      githubUrl.searchParams.set('redirect_uri', new URL('/callback', origin).toString());
      githubUrl.searchParams.set('allow_signup', 'false');
      githubUrl.searchParams.set('state', state);

      return new Response(null, {
        status: 302,
        headers: {
          Location: githubUrl.toString(),
          'Cache-Control': 'no-store',
          'Referrer-Policy': 'no-referrer',
          'Set-Cookie': `${stateCookieName}=${encodeURIComponent(
            JSON.stringify({ state, origin }),
          )}; HttpOnly; Secure; SameSite=Lax; Path=/callback; Max-Age=${stateCookieMaxAge}`,
        },
      });
    }

    if (!allowedDomainPatterns.length) {
      return callbackError('OAuth is not configured', 500);
    }
    const code = url.searchParams.get('code');
    const returnedState = url.searchParams.get('state');
    const transaction = readStateCookie(request, allowedDomainPatterns);
    if (
      !code ||
      !returnedState ||
      !transaction ||
      returnedState !== transaction.state
    ) {
      return callbackError('Invalid OAuth callback', 400);
    }
    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
      return callbackError('OAuth is not configured', 500);
    }

    let result;
    try {
      const response = await fetch(
        'https://github.com/login/oauth/access_token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'User-Agent': 'Cloudflare-Worker',
          },
          body: JSON.stringify({
            client_id: env.GITHUB_CLIENT_ID,
            client_secret: env.GITHUB_CLIENT_SECRET,
            code,
            redirect_uri: new URL('/callback', transaction.origin).toString(),
          }),
        },
      );

      if (!response.ok) {
        return callbackError('GitHub token exchange failed', 502);
      }

      result = await response.json();

      if (typeof result?.access_token !== 'string' || !result.access_token) {
        return callbackError('GitHub token exchange failed', 502);
      }

      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${result.access_token}`,
          'User-Agent': 'Hamlamadong-CMS',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });

      if (!userResponse.ok) {
        return callbackError('Unable to verify GitHub account', 502);
      }

      const user = await userResponse.json();
      if (user?.id !== allowedGitHubUserId) {
        return callbackError('This GitHub account is not authorized to use this CMS', 403);
      }
    } catch (error) {
      console.error('GitHub OAuth verification failed', error);
      return callbackError('Unable to verify GitHub account', 502);
    }

    const content = JSON.stringify({
      token: result.access_token,
      provider: 'github',
    }).replace(/</g, '\\u003c');
    const target = JSON.stringify(transaction.origin);

    return new Response(
      `<!doctype html>
      <html lang="en">
        <head><meta charset="utf-8"><title>GitHub authorization</title></head>
        <body>
          <script>
            (() => {
              const target = ${target};
              const payload = ${content};
              if (window.opener) {
                window.opener.postMessage("authorizing:github", target);
                window.opener.postMessage("authorization:github:success:" + JSON.stringify(payload), target);
                setTimeout(() => window.close(), 200);
              }
            })();
          </script>
        </body>
      </html>`,
      {
        headers: {
          'Content-Type': 'text/html;charset=UTF-8',
          'Cache-Control': 'no-store',
          'Content-Security-Policy':
            "default-src 'none'; script-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
          'Referrer-Policy': 'no-referrer',
          'Set-Cookie': clearStateCookie(),
          'X-Content-Type-Options': 'nosniff',
        },
      },
    );
  },
};
