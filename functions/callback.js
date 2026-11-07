import worker from './_lib/github-oauth.js';

export function onRequest({ request, env }) {
  return worker.fetch(request, env);
}
