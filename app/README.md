# YAPPING

### PLAN

1. Dockerize + redis setup
2. Setup core API + bruno docs
3. Analytics speed test + TTL
4. Rate limiting impl

### NOTES

- bikin base62 converter for id => code (key)
- KV: code (key) -> url (value)
- use namespace for everything
- API: create short url + redirect to original url from code
- use INCR buat idnya (url:counter)
- url:counter, url:${code} url:${code}:clicks
- TTL expr ditaro both di urlcode and clicks (cascading)
- Rate limit itu by IP (berapa requests each IP address can make), not by URL
- Rate limit bisa pake normal expiry (60), bisa pake sliding window yang slides every requests (better, bisa show retryAfter)

### EXTRA

- 302 itu temporary (ask server every req)
- 301 itu permanent (browser caches redirect forever)
- Kenapa make 302? -> biar bisa ganti destination, track clicks, etc
- click: curl -L http://localhost:3000/1
- docker exec -it url-shortener-project-redis-1 redis-cli

### Testing

Rate limiting

```
for i in {1..15}; do
curl -X POST http://localhost:3000/shorten \
 -H "Content-Type: application/json" \
 -d "{\"url\":\"https://test$i.com\"}" \
 && echo ""
done
```

Commands

```
  # Get all keys (careful in prod)
  KEYS *

  # Find all rate limit keys
  KEYS ratelimit:*

  # Find all URL keys
  KEYS url:*

  # Find all click counters
  KEYS url:*:clicks

  # Count all keys
  DBSIZE

  FLUSHDB

```
