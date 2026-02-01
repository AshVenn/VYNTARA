// Simple in-memory rate limiter (per-process). Suitable for small deployments.
const buckets = new Map()

export function checkRateLimit(key, { limit = 20, windowMs = 60_000 } = {}) {
  const now = Date.now()
  const bucket = buckets.get(key) || { count: 0, windowStart: now }

  if (now - bucket.windowStart > windowMs) {
    bucket.count = 0
    bucket.windowStart = now
  }

  bucket.count += 1
  buckets.set(key, bucket)

  return bucket.count <= limit
}
