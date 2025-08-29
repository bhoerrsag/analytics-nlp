import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface GA4SuccessResponse {
  success: true;
  rowCount: number;
  rows: Record<string, string>[];
  totals: Record<string, string>;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

interface GA4ErrorResponse {
  success: false;
  error: string;
}

type GA4Response = GA4SuccessResponse | GA4ErrorResponse;

const getGA4Client = () => {
  return new BetaAnalyticsDataClient({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  });
};

const runGA4Report = async (
  dimensions: string[], 
  metrics: string[], 
  startDate = '7daysAgo', 
  endDate = 'yesterday', 
  limit = 100
): Promise<GA4Response> => {
  try {
    const analyticsDataClient = getGA4Client();
    const propertyId = process.env.GA4_PROPERTY_ID;

    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dimensions: dimensions.map(name => ({ name })),
      metrics: metrics.map(name => ({ name })),
      dateRanges: [{
        startDate,
        endDate,
      }],
      limit,
    });

    const rows = response.rows?.map((row) => {
      const result: Record<string, string> = {};
      
      row.dimensionValues?.forEach((value, index) => {
        result[dimensions[index]] = value.value || '';
      });
      
      row.metricValues?.forEach((value, index) => {
        result[metrics[index]] = value.value || '';
      });
      
      return result;
    }) || [];

    const totals = response.totals?.[0]?.metricValues?.reduce((acc: Record<string, string>, value, index) => {
      acc[metrics[index]] = value.value || '';
      return acc;
    }, {}) || {};

    return {
      success: true,
      rowCount: response.rowCount || 0,
      rows,
      totals,
      dateRange: { startDate, endDate }
    };
  } catch (error) {
    console.error('GA4 Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    let ga4Data: GA4Response | null = null;
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('active users') || lowerMessage.includes('traffic')) {
      if (lowerMessage.includes('city') || lowerMessage.includes('florida') || lowerMessage.includes('location')) {
        ga4Data = await runGA4Report(['city'], ['activeUsers', 'sessions'], '7daysAgo', 'yesterday', 20);
      } else if (lowerMessage.includes('device') || lowerMessage.includes('mobile') || lowerMessage.includes('desktop')) {
        ga4Data = await runGA4Report(['deviceCategory'], ['activeUsers', 'sessions', 'bounceRate'], '7daysAgo', 'yesterday');
      } else {
        ga4Data = await runGA4Report(['date'], ['activeUsers', 'sessions'], '7daysAgo', 'yesterday');
      }
    } else if (lowerMessage.includes('vehicle') || lowerMessage.includes('inventory') || lowerMessage.includes('asc_item_pageviews')) {
      ga4Data = await runGA4Report(['eventName', 'customEvent:item_condition'], ['eventCount'], '30daysAgo', 'yesterday', 50);
    } else if (lowerMessage.includes('campaign') || lowerMessage.includes('marketing') || lowerMessage.includes('source')) {
      ga4Data = await runGA4Report(['sessionSource', 'sessionMedium'], ['sessions', 'conversions'], '30daysAgo', 'yesterday', 20);
    }

    // Generate chart data structure
    let chartData = null;
    let dataContext = '';
    
    if (ga4Data?.success) {
      // Convert GA4 data to chart format
      chartData = {
        data: ga4Data.rows.slice(0, 10).map(row => {
          const chartRow: any = {};
          Object.entries(row).forEach(([key, value]) => {
            chartRow[key] = isNaN(Number(value)) ? value : Number(value);
          });
          return chartRow;
        }),
        xKey: Object.keys(ga4Data.rows[0] || {})[0] || 'date',
        yKey: Object.keys(ga4Data.rows[0] || {}).filter(key => !isNaN(Number(ga4Data.rows[0][key]))) || [],
        type: 'bar' as const
      };

      dataContext = `

REAL GA4 DATA FROM YOUR DEALERSHIP:
Date Range: ${ga4Data.dateRange.startDate} to ${ga4Data.dateRange.endDate}
Total Rows: ${ga4Data.rowCount}

Totals: ${JSON.stringify(ga4Data.totals, null, 2)}

Top Results:
${ga4Data.rows.slice(0, 10).map((row, index) => 
  `${index + 1}. ${Object.entries(row).map(([key, value]) => `${key}: ${value}`).join(', ')}`
).join('\n')}

Please analyze this ACTUAL data from the dealership's GA4 account.`;
    } else if (ga4Data && !ga4Data.success) {
      dataContext = `

DATA FETCH ERROR: ${ga4Data.error}
Please provide analysis based on typical dealership patterns and suggest how to get this data.`;
    }

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `You are a Google Analytics expert specializing in automotive dealership data analysis. 

You're helping a Florida car dealership analyze their website performance. The dealership sells new, used, and certified pre-owned (CPO) vehicles.

Key context:
- This is a Florida-based car dealership  
- They track vehicle inventory page views with event "asc_item_pageviews"
- They have a custom dimension "item_condition" with values: new, used, cpo
- They care about: traffic by Florida cities, vehicle model performance, mobile vs desktop usage, lead generation, service vs sales traffic

${dataContext}

User question: ${message}

Please provide a detailed, actionable analysis formatted using markdown for better readability:

- Use **bold** for important metrics and key findings
- Use headers (##, ###) to structure your response
- Use bullet points and numbered lists for recommendations
- Use tables when showing data comparisons
- Use code blocks (\`\`\`) for specific GA4 dimensions/metrics
- Format numbers clearly (e.g., **1,234 sessions** instead of 1234)

Structure your response with clear sections like:
## Key Findings
## Data Analysis  
## Recommendations
## Next Steps

Make it professional and actionable for a marketing team.`
      }]
    });

    const responseText = response.content[0]?.type === 'text' 
      ? response.content[0].text 
      : 'Sorry, I could not process your request.';

    return NextResponse.json({ 
      response: responseText,
      chartData: chartData 
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process your request. Please try again.' },
      { status: 500 }
    );
  }
}