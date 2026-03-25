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

async function creemRequest(env, method, path, body = null) {
  if (!env.CREEM_API_KEY) {
    throw new Error('CREEM_API_KEY is not configured.');
  }

  const options = {
    method,
    headers: {
      'x-api-key'  : env.CREEM_API_KEY,
      'Content-Type': 'application/json'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const base = env.CREEM_API_BASE || 'https://api.creem.io';
  const response = await fetch(`${base}${path}`, options);

  if (!response.ok) {
    throw new Error(`Creem API request failed: ${await response.text()}`);
  }

  return response.json();
}

async function verifyCreemSignature(payload, signature, secret) {
  if (!signature || !secret) {
    return false;
  }

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const computed = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  if (computed.length !== signature.length) {
    return false;
  }

  // Constant-time comparison
  let mismatch = 0;
  for (let i = 0; i < computed.length; i++) {
    mismatch |= computed.charCodeAt(i) ^ signature.charCodeAt(i);
  }

  return mismatch === 0;
}

async function createCheckout(request, env) {
  try {
    const auth = await readAuth(request, env);
    const body = await readJson(request);
    const plan = body.plan === 'yearly' ? 'yearly' : 'monthly';
    const productId = plan === 'yearly' ? env.CREEM_PRODUCT_YEARLY : env.CREEM_PRODUCT_MONTHLY;
    const redirectPath = body.redirectPath || '/';

    if (!productId || productId.includes('placeholder')) {
      throw new Error(`Missing Creem product configuration for ${plan}.`);
    }

    const checkout = await creemRequest(env, 'POST', '/v1/checkouts', {
      product_id : productId,
      success_url: buildFrontendUrl(env, redirectPath, { checkout: 'success' }),
      customer   : { email: auth.user.email },
      metadata   : { userId: auth.user.id, plan }
    });

    return jsonResponse({
      checkoutId: checkout.id,
      url       : checkout.checkout_url
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
      monthlyProductId: env.CREEM_PRODUCT_MONTHLY || '',
      yearlyProductId : env.CREEM_PRODUCT_YEARLY || '',
      features        : ['Unlimited articles', 'Cross-device sync', 'Advanced statistics'],
      tier            : 'pro'
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
    event.eventType || event.type || 'unknown',
    JSON.stringify(event)
  ).run();
}

async function handleWebhook(request, env) {
  const signature = request.headers.get('creem-signature');
  const body = await request.text();
  const isValid = await verifyCreemSignature(body, signature, env.CREEM_WEBHOOK_SECRET);

  if (!isValid) {
    return textResponse('invalid signature', { status: 400 }, request, env);
  }

  const event = JSON.parse(body);
  const payload = event.object || {};
  const customerId = payload.customer?.id || null;
  const userId = payload.metadata?.userId || null;

  await recordBillingEvent(env, event, userId, customerId);

  const grantEvents = ['subscription.active', 'subscription.paid', 'subscription.trialing'];
  const revokeEvents = ['subscription.expired', 'subscription.paused'];

  if (event.eventType === 'checkout.completed' && userId) {
    await env.DB.prepare(`
      UPDATE users
      SET tier = ?, updated_at = ?
      WHERE id = ?
    `).bind('pro', nowIso(), userId).run();
  }

  if (grantEvents.includes(event.eventType) && userId) {
    await env.DB.prepare(`
      UPDATE users
      SET tier = ?, updated_at = ?
      WHERE id = ?
    `).bind('pro', nowIso(), userId).run();
  }

  if (revokeEvents.includes(event.eventType)) {
    const target = userId || customerId;
    if (target) {
      const col = userId ? 'id' : 'stripe_customer_id';
      await env.DB.prepare(`
        UPDATE users
        SET tier = ?, updated_at = ?
        WHERE ${col} = ?
      `).bind('free', nowIso(), target).run();
    }
  }

  return textResponse('ok', { status: 200 }, request, env);
}

async function createPortal(request, env) {
  try {
    const auth = await readAuth(request, env);
    const user = await env.DB.prepare(
      'SELECT stripe_customer_id FROM users WHERE id = ?'
    ).bind(auth.user.id).first();

    if (!user?.stripe_customer_id) {
      return errorResponse('No billing account found.', 404, request, env);
    }

    const portal = await creemRequest(env, 'POST', '/v1/customers/billing', {
      customer_id: user.stripe_customer_id
    });

    return jsonResponse({ url: portal.url }, { status: 200 }, request, env);
  } catch (error) {
    return errorResponse(error.message || 'Failed to create portal.', 500, request, env);
  }
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

    if (request.method === 'POST' && path === '/api/payment/portal') {
      return createPortal(request, env);
    }

    if (request.method === 'POST' && path === '/webhook') {
      return handleWebhook(request, env);
    }

    return errorResponse('Route not found.', 404, request, env);
  }
};
