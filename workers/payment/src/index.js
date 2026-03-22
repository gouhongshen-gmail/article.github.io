import { errorResponse, handleOptions, jsonResponse, readJson, textResponse } from '../../shared/http.js';
import { readAuth } from '../../shared/session.js';

const encoder = new TextEncoder();

function nowIso() {
  return new Date().toISOString();
}

function buildFrontendUrl(env, redirectPath, searchParams = {}) {
  const normalizedPath = String(redirectPath || '/').trim();
  const url = normalizedPath.startsWith('/')
    ? new URL(normalizedPath, env.FRONTEND_URL)
    : new URL(env.FRONTEND_URL);

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

async function stripeRequest(env, path, body) {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured.');
  }

  const response = await fetch(`https://api.stripe.com${path}`, {
    method : 'POST',
    headers: {
      Authorization : `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body.toString()
  });

  if (!response.ok) {
    throw new Error(`Stripe API request failed: ${await response.text()}`);
  }

  return response.json();
}

async function hmacHex(secret, value) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function verifyStripeSignature(signatureHeader, payload, secret) {
  if (!signatureHeader || !secret) {
    return false;
  }

  const items = signatureHeader.split(',').map((entry) => entry.trim());
  const timestamp = items.find((item) => item.startsWith('t='))?.slice(2);
  const signatures = items
    .filter((item) => item.startsWith('v1='))
    .map((item) => item.slice(3));

  if (!timestamp || !signatures.length) {
    return false;
  }

  const expected = await hmacHex(secret, `${timestamp}.${payload}`);
  const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  return ageSeconds <= 300 && signatures.includes(expected);
}

async function createCheckout(request, env) {
  try {
    const auth = await readAuth(request, env);
    const body = await readJson(request);
    const plan = body.plan === 'yearly' ? 'yearly' : 'monthly';
    const priceId = plan === 'yearly' ? env.STRIPE_PRICE_YEARLY : env.STRIPE_PRICE_MONTHLY;
    const redirectPath = body.redirectPath || '/';

    if (!priceId) {
      throw new Error(`Missing Stripe price configuration for ${plan}.`);
    }

    const form = new URLSearchParams();
    form.set('mode', 'subscription');
    form.set('client_reference_id', auth.user.id);
    form.set('customer_email', auth.user.email);
    form.set('success_url', buildFrontendUrl(env, redirectPath, { checkout: 'success' }));
    form.set('cancel_url', buildFrontendUrl(env, redirectPath, { checkout: 'cancelled' }));
    form.set('line_items[0][price]', priceId);
    form.set('line_items[0][quantity]', '1');
    form.set('metadata[userId]', auth.user.id);
    form.set('metadata[plan]', plan);
    form.set('subscription_data[metadata][userId]', auth.user.id);
    form.set('subscription_data[metadata][plan]', plan);

    const session = await stripeRequest(env, '/v1/checkout/sessions', form);
    return jsonResponse({
      sessionId: session.id,
      url      : session.url
    }, { status: 200 }, request, env);
  } catch (error) {
    return errorResponse(error.message || 'Failed to create checkout session.', 401, request, env);
  }
}

async function getPlans(request, env) {
  return jsonResponse({
    free: {
      features: ['3 articles', 'Basic SRS', 'Offline learning'],
      tier    : 'free'
    },
    pro: {
      monthlyPriceId: env.STRIPE_PRICE_MONTHLY || '',
      yearlyPriceId : env.STRIPE_PRICE_YEARLY || '',
      features      : ['Unlimited articles', 'Cross-device sync', 'Advanced statistics'],
      tier          : 'pro'
    }
  }, { status: 200 }, request, env);
}

async function recordBillingEvent(env, event, userId, customerId) {
  await env.DB.prepare(`
    INSERT OR IGNORE INTO billing_events (
      id, user_id, stripe_customer_id, event_type, payload
    ) VALUES (?, ?, ?, ?, ?)
  `).bind(
    event.id,
    userId || null,
    customerId || null,
    event.type,
    JSON.stringify(event)
  ).run();
}

async function handleWebhook(request, env) {
  const signature = request.headers.get('stripe-signature');
  const body = await request.text();
  const isValid = await verifyStripeSignature(signature, body, env.STRIPE_WEBHOOK_SECRET);

  if (!isValid) {
    return textResponse('invalid signature', { status: 400 }, request, env);
  }

  const event = JSON.parse(body);
  const payload = event.data?.object || {};
  const customerId = payload.customer || null;
  const userId = payload.metadata?.userId || payload.client_reference_id || null;

  await recordBillingEvent(env, event, userId, customerId);

  if (event.type === 'checkout.session.completed') {
    await env.DB.prepare(`
      UPDATE users
      SET tier = ?, stripe_customer_id = ?, updated_at = ?
      WHERE id = ?
    `).bind('pro', customerId, nowIso(), userId).run();
  }

  if (event.type === 'customer.subscription.deleted') {
    await env.DB.prepare(`
      UPDATE users
      SET tier = ?, updated_at = ?
      WHERE stripe_customer_id = ?
    `).bind('free', nowIso(), customerId).run();
  }

  return textResponse('ok', { status: 200 }, request, env);
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;

    if (request.method === 'OPTIONS') {
      return handleOptions(request, env);
    }

    if (request.method === 'GET' && path === '/health') {
      return jsonResponse({ ok: true, service: 'payment' }, { status: 200 }, request, env);
    }

    if (request.method === 'GET' && path === '/api/payment/plans') {
      return getPlans(request, env);
    }

    if (request.method === 'POST' && path === '/api/payment/checkout') {
      return createCheckout(request, env);
    }

    if (request.method === 'POST' && path === '/webhook') {
      return handleWebhook(request, env);
    }

    return errorResponse('Route not found.', 404, request, env);
  }
};
