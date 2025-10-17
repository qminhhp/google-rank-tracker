import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

async function getAuthenticatedClient(request: NextRequest) {
  const accessToken = request.cookies.get('session_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  if (!accessToken) {
    throw new Error('Not authenticated');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  // Handle token refresh if needed
  try {
    await oauth2Client.getAccessToken();
  } catch (error) {
    if (refreshToken) {
      const { credentials } = await (oauth2Client as any).refreshToken(refreshToken);
      oauth2Client.setCredentials(credentials);
    } else {
      throw new Error('Token refresh failed');
    }
  }

  return oauth2Client;
}

function calculateDateRange(
  dateRangeType: string,
  customStartDate?: string,
  customEndDate?: string
) {
  const today = new Date();
  let startDate: Date;
  let endDate: Date;

  switch (dateRangeType) {
    case 'this_month':
      // Tháng này
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = today;
      break;

    case 'last_month':
      // Tháng trước
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      endDate = new Date(today.getFullYear(), today.getMonth(), 0); // Ngày cuối tháng trước
      break;

    case 'custom':
      // Tùy chỉnh
      if (!customStartDate || !customEndDate) {
        throw new Error('Custom date range requires start and end dates');
      }
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
      break;

    default:
      // 7, 30, 90 ngày
      endDate = today;
      startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(dateRangeType));
      break;
  }

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
}

async function getKeywordRankings(
  searchconsole: any,
  siteUrl: string,
  keyword: string,
  startDate: string,
  endDate: string,
  country?: string,
  searchType: string = 'web'
) {
  const request: any = {
    startDate,
    endDate,
    dimensions: ['date'],
    dimensionFilterGroups: [{
      filters: [{
        dimension: 'query',
        operator: 'equals',
        expression: keyword
      }]
    }],
    rowLimit: 25000,
    type: searchType
  };

  if (country) {
    request.dimensionFilterGroups[0].filters.push({
      dimension: 'country',
      operator: 'equals',
      expression: country
    });
  }

  const response = await searchconsole.searchanalytics.query({
    siteUrl,
    requestBody: request
  });

  return response.data;
}

function calculateMetrics(data: any, startDate: string, endDate: string) {
  if (!data || !data.rows || data.rows.length === 0) {
    return {
      clicks: 0,
      impressions: 0,
      avgPosition: 0,
      ctr: 0,
      dailyData: []
    };
  }

  let totalClicks = 0;
  let totalImpressions = 0;
  let totalPosition = 0;
  let positionCount = 0;

  // Tạo map để lưu dữ liệu theo ngày
  const dailyMap = new Map<string, any>();

  for (const row of data.rows) {
    const date = row.keys[0]; // date dimension
    totalClicks += row.clicks || 0;
    totalImpressions += row.impressions || 0;
    if (row.position && row.position > 0) {
      totalPosition += row.position;
      positionCount++;
    }

    // Lưu dữ liệu theo ngày
    dailyMap.set(date, {
      date,
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      avgPosition: row.position ? Math.round(row.position * 10) / 10 : 0,
      ctr: row.impressions > 0 ? Math.round((row.clicks / row.impressions) * 10000) / 100 : 0
    });
  }

  // Tạo mảng dailyData với tất cả các ngày trong khoảng thời gian
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dailyData = [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    dailyData.push(dailyMap.get(dateStr) || {
      date: dateStr,
      clicks: 0,
      impressions: 0,
      avgPosition: 0,
      ctr: 0
    });
  }

  const avgPosition = positionCount > 0 ? totalPosition / positionCount : 0;
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  return {
    clicks: totalClicks,
    impressions: totalImpressions,
    avgPosition: Math.round(avgPosition * 10) / 10,
    ctr: Math.round(ctr * 100) / 100,
    dailyData
  };
}

// Rate limiter configuration
// Google Search Console API limits: 1,200 QPM (20 QPS)
// We use conservative limits to avoid hitting quotas
const RATE_LIMIT = {
  MAX_REQUESTS_PER_MINUTE: 1000, // Conservative limit (below 1,200)
  DELAY_BETWEEN_REQUESTS_MS: 70,  // ~14 requests/second
  BATCH_SIZE: 50,                  // Process in smaller batches
  DELAY_BETWEEN_BATCHES_MS: 2000   // 2 second pause between batches
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { site, keywords, dateRange, customStartDate, customEndDate, searchType = 'web', country } = body;

    if (!site || !keywords || !Array.isArray(keywords)) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const auth = await getAuthenticatedClient(request);
    const searchconsole = google.searchconsole({ version: 'v1', auth });

    const { startDate, endDate } = calculateDateRange(dateRange, customStartDate, customEndDate);

    // Use streaming to avoid timeout and show progress
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const totalKeywords = keywords.length;
        let processedCount = 0;
        let successCount = 0;
        let errorCount = 0;

        console.log(`[Search API] Starting to process ${totalKeywords} keywords`);

        // Process keywords in batches
        for (let i = 0; i < keywords.length; i += RATE_LIMIT.BATCH_SIZE) {
          const batch = keywords.slice(i, i + RATE_LIMIT.BATCH_SIZE);
          const batchNumber = Math.floor(i / RATE_LIMIT.BATCH_SIZE) + 1;
          const totalBatches = Math.ceil(keywords.length / RATE_LIMIT.BATCH_SIZE);

          console.log(`[Search API] Processing batch ${batchNumber}/${totalBatches} (${batch.length} keywords)`);

          for (const keyword of batch) {
            try {
              const data = await getKeywordRankings(
                searchconsole,
                site,
                keyword,
                startDate,
                endDate,
                country,
                searchType
              );

              const metrics = calculateMetrics(data, startDate, endDate);

              const result = {
                keyword,
                data,
                ...metrics
              };

              // Send result to client
              const message = JSON.stringify({
                type: 'result',
                data: result,
                progress: {
                  processed: processedCount + 1,
                  total: totalKeywords,
                  percentage: Math.round(((processedCount + 1) / totalKeywords) * 100),
                  success: successCount + 1,
                  errors: errorCount
                }
              }) + '\n';

              controller.enqueue(encoder.encode(message));

              processedCount++;
              successCount++;

              // Delay to respect rate limits
              await new Promise(resolve => setTimeout(resolve, RATE_LIMIT.DELAY_BETWEEN_REQUESTS_MS));
            } catch (error) {
              console.error(`[Search API] Error for keyword "${keyword}":`, error);

              const errorResult = {
                keyword,
                data: null,
                clicks: 0,
                impressions: 0,
                avgPosition: 0,
                ctr: 0,
                dailyData: [],
                error: error instanceof Error ? error.message : 'Unknown error'
              };

              // Send error result to client
              const message = JSON.stringify({
                type: 'result',
                data: errorResult,
                progress: {
                  processed: processedCount + 1,
                  total: totalKeywords,
                  percentage: Math.round(((processedCount + 1) / totalKeywords) * 100),
                  success: successCount,
                  errors: errorCount + 1
                }
              }) + '\n';

              controller.enqueue(encoder.encode(message));

              processedCount++;
              errorCount++;

              // Continue with delay even on error
              await new Promise(resolve => setTimeout(resolve, RATE_LIMIT.DELAY_BETWEEN_REQUESTS_MS));
            }
          }

          // Longer delay between batches to avoid quota issues
          if (i + RATE_LIMIT.BATCH_SIZE < keywords.length) {
            console.log(`[Search API] Batch ${batchNumber} complete. Waiting ${RATE_LIMIT.DELAY_BETWEEN_BATCHES_MS}ms before next batch...`);
            await new Promise(resolve => setTimeout(resolve, RATE_LIMIT.DELAY_BETWEEN_BATCHES_MS));
          }
        }

        // Send completion message
        const completionMessage = JSON.stringify({
          type: 'complete',
          summary: {
            total: totalKeywords,
            success: successCount,
            errors: errorCount
          }
        }) + '\n';

        controller.enqueue(encoder.encode(completionMessage));
        controller.close();

        console.log(`[Search API] Completed. Success: ${successCount}, Errors: ${errorCount}`);
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (error) {
    console.error('[Search API] Fatal error:', error);

    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to search rankings', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
