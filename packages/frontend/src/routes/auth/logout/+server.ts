import type { RequestEvent } from './$types';
import { redirect } from '@sveltejs/kit';

export function GET(event: RequestEvent): Response {
  event.cookies.delete('token', { path: '/' });
  throw redirect(301, '/');
}
