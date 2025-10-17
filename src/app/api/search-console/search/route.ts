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

    const results = [];

    // Process keywords in batches to respect rate limits
    const batchSize = 100;
    for (let i = 0; i < keywords.length; i += batchSize) {
      const batch = keywords.slice(i, i + batchSize);
      
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

          results.push({
            keyword,
            data,
            ...metrics
          });

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Error fetching data for keyword "${keyword}":`, error);
          results.push({
            keyword,
            data: null,
            clicks: 0,
            impressions: 0,
            avgPosition: 0,
            ctr: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Longer delay between batches
      if (i + batchSize < keywords.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error in search API:', error);
    
    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to search rankings' },
      { status: 500 }
    );
  }
}
