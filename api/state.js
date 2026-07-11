import { Redis } from '@upstash/redis';

const KEY = 'task_order_state_v1';

// Supports both env var naming conventions Vercel storage integrations use
const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = new Redis({ url, token });

export default async function handler(req, res) {
  try {
    if (!url || !token) {
      res.status(500).json({
        error: 'Redis is not configured. Add a Redis (Upstash) storage integration to this Vercel project.'
      });
      return;
    }

    if (req.method === 'GET') {
      const value = await redis.get(KEY);
      res.status(200).json({ value: value || null });
      return;
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        body = JSON.parse(body);
      }
      if (!body || typeof body !== 'object') {
        res.status(400).json({ error: 'Invalid state payload' });
        return;
      }
      await redis.set(KEY, body);
      res.status(200).json({ ok: true });
      return;
    }

    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end('Method Not Allowed');
  } catch (err) {
    console.error('state API error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
