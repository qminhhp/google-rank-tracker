# Rate Limiting & Large Keyword Processing

## Overview

Ứng dụng đã được tối ưu hóa để xử lý **lên đến 1000 từ khóa** trong một lần search, tuân thủ Google Search Console API rate limits và tránh timeout trên Vercel.

## Google Search Console API Limits

### Rate Limits (Quota)

**Per-site quota:**
- 1,200 QPM (Queries Per Minute)

**Per-user quota:**
- 1,200 QPM

**Per-project quota:**
- 30,000,000 QPD (Queries Per Day)
- 40,000 QPM

### Load Quota

**Short-term load quota:**
- Measured in 10 minute chunks
- If exceeded, wait 15 minutes and try again

**Long-term load quota:**
- Measured in 1 day chunks
- Queries grouped/filtered by page AND query string are most expensive
- Larger date ranges increase query load

## Implementation

### 1. Rate Limiter Configuration

```typescript
const RATE_LIMIT = {
  MAX_REQUESTS_PER_MINUTE: 1000, // Conservative (below 1,200)
  DELAY_BETWEEN_REQUESTS_MS: 70,  // ~14 requests/second
  BATCH_SIZE: 50,                  // Process in smaller batches
  DELAY_BETWEEN_BATCHES_MS: 2000   // 2 second pause between batches
};
```

**Why these values?**
- **70ms delay** = ~14 requests/second = ~840 requests/minute (safe margin)
- **Batch size 50** = Better progress updates, manageable memory
- **2s between batches** = Prevents short-term quota issues

### 2. Streaming Response

Thay vì đợi tất cả keywords xử lý xong, server **stream results** ngay khi có:

**Benefits:**
- ✅ User thấy progress real-time
- ✅ Tránh timeout (60s limit trên Vercel Hobby)
- ✅ Results hiển thị ngay khi có dữ liệu
- ✅ Có thể xử lý hàng ngàn keywords

**Message Format:**
```json
// Progress message
{
  "type": "result",
  "data": {
    "keyword": "example keyword",
    "clicks": 100,
    "impressions": 1000,
    "avgPosition": 5.2,
    "ctr": 10.0,
    "dailyData": [...]
  },
  "progress": {
    "processed": 50,
    "total": 1000,
    "percentage": 5,
    "success": 48,
    "errors": 2
  }
}

// Completion message
{
  "type": "complete",
  "summary": {
    "total": 1000,
    "success": 995,
    "errors": 5
  }
}
```

### 3. Client-side Processing

Client sử dụng **ReadableStream API** để xử lý streaming response:

```typescript
const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value, { stream: true });
  // Process messages...
}
```

## Processing Time Estimates

Với rate limit configuration hiện tại:

| Keywords | Estimated Time | Notes |
|----------|---------------|-------|
| 10 | ~1 second | Instant |
| 50 | ~4 seconds | One batch |
| 100 | ~9 seconds | Two batches |
| 500 | ~45 seconds | 10 batches |
| 1000 | ~90 seconds | 20 batches |

**Formula:**
```
Time (seconds) = (keywords * 0.07) + (batches * 2)
Where batches = Math.ceil(keywords / 50)
```

## Best Practices

### For Users

**1. Optimize Date Range**
- Shorter date ranges = faster queries
- Use 7 days for quick checks
- Use 90 days for comprehensive data

**2. Batch Keywords**
- Process 100-200 keywords at a time for best experience
- Use 500-1000 only when necessary

**3. Monitor Progress**
- Watch the progress bar
- Check for errors in results
- Note any keywords that failed

### For Developers

**1. Adjust Rate Limits**

If you encounter quota errors, reduce limits:

```typescript
const RATE_LIMIT = {
  DELAY_BETWEEN_REQUESTS_MS: 100,  // Slower: 10 req/sec
  BATCH_SIZE: 25,                   // Smaller batches
  DELAY_BETWEEN_BATCHES_MS: 3000    // Longer pauses
};
```

**2. Handle Errors Gracefully**

```typescript
try {
  const data = await getKeywordRankings(...);
  // Success - send result
} catch (error) {
  // Error - send error result, continue processing
  // Don't stop entire batch due to one failure
}
```

**3. Log for Monitoring**

```typescript
console.log(`[Search API] Processing batch ${batchNumber}/${totalBatches}`);
console.log(`[Search API] Completed. Success: ${successCount}, Errors: ${errorCount}`);
```

## Troubleshooting

### Error: "Quota exceeded"

**Short-term quota exceeded:**
1. Wait 15 minutes
2. Reduce `BATCH_SIZE` to 25
3. Increase `DELAY_BETWEEN_BATCHES_MS` to 3000ms

**Long-term quota exceeded:**
1. Reduce date range (use 7 days instead of 90)
2. Process fewer keywords per request
3. Spread queries throughout the day

### Error: "Timeout" or "Connection lost"

**Vercel timeout (60s for Hobby plan):**
- Current implementation avoids this with streaming
- If still occurring, reduce batch size

**Network timeout:**
- Check internet connection
- Try again with fewer keywords

### Progress stuck at 0%

**Possible causes:**
1. API request failed (check browser console)
2. Authentication expired (refresh page, re-login)
3. Network issues (check DevTools Network tab)

**Solutions:**
1. Check Vercel logs for errors
2. Refresh page and try again
3. Test with smaller keyword list first

### Some keywords return no data

**Normal behavior:**
- Keywords with no impressions return zero data
- This is not an error
- Try expanding date range

**Check for:**
- Spelling errors in keywords
- Keywords not relevant to your site
- Very new keywords (no historical data)

## Monitoring & Optimization

### Server-side Logs

Check Vercel Function Logs:
```
[Search API] Starting to process 1000 keywords
[Search API] Processing batch 1/20 (50 keywords)
[Search API] Batch 1 complete. Waiting 2000ms before next batch...
...
[Search API] Completed. Success: 995, Errors: 5
```

### Client-side Metrics

Monitor in browser DevTools Console:
```javascript
console.log('Processing complete:', {
  total: 1000,
  success: 995,
  errors: 5,
  timeElapsed: '92.5s'
});
```

### Performance Optimization

**Reduce API calls:**
- Cache results (future feature)
- Avoid re-querying same data
- Use longer date ranges less frequently

**Optimize queries:**
- Remove unnecessary filters
- Don't filter by page AND query simultaneously
- Use simpler country filters

## Future Improvements

### Planned Features

1. **Background Processing**
   - Queue keywords for background processing
   - Email notification when complete
   - Process during off-peak hours

2. **Result Caching**
   - Cache results for 24 hours
   - Serve from cache for repeated queries
   - Reduce API calls dramatically

3. **Smart Batching**
   - Adaptive batch sizes based on quota
   - Automatic retry with backoff
   - Priority queue for important keywords

4. **Progress Persistence**
   - Save progress in database
   - Resume interrupted processing
   - View historical processing status

## API Reference

### POST /api/search-console/search

**Request Body:**
```json
{
  "site": "https://example.com",
  "keywords": ["keyword1", "keyword2", ...],
  "dateRange": "30",
  "searchType": "web",
  "country": "usa"
}
```

**Response:** Streaming text (newline-delimited JSON)

**Rate Limits:**
- Max 1000 keywords per request
- Respects Google API limits automatically
- Implements exponential backoff on errors

---

**Last updated:** October 2024
