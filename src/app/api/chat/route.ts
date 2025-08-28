import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface GA4SuccessResponse {
  success: true;
  rowCount: number;
  rows: any[];
  totals: any;
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

// Initialize GA4 client
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

    const rows = response.rows?.map((row: any) => {
      const result: any = {};
      
      row.dimensionValues?.forEach((value: any, index: number) => {
        result[dimensions[index]] = value.value;
      });
      
      row.metricValues?.forEach((value: any, index: number) => {
        result[metrics[index]] = value.value;
      });
      
      return result;
    }) || [];

    const totals = response.totals?.[0]?.metricValues?.reduce((acc: any, value: any, index: number) => {
      acc[metrics[index]] = value.value;
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

    // Analyze the message to determine what GA4 data to fetch
    let ga4Data: GA4Response | null = null;
    const lowerMessage = message.toLowerCase();

    // Simple keyword detection for common queries
    if (lowerMessage.includes('active users') || lowerMessage.includes('traffic')) {
      if (lowerMessage.includes('city') || lowerMessage.includes('florida') || lowerMessage.includes('location')) {
        // Traffic by city
        ga4Data = await runGA4Report(['city'], ['activeUsers', 'sessions'], '7daysAgo', 'yesterday', 20);
      } else if (lowerMessage.includes('device') || lowerMessage.includes('mobile') || lowerMessage.includes('desktop')) {
        // Traffic by device
        ga4Data = await runGA4Report(['deviceCategory'], ['activeUsers', 'sessions', 'bounceRate'], '7daysAgo', 'yesterday');
      } else {
        // General active users
        ga4Data = await runGA4Report(['date'], ['activeUsers', 'sessions'], '7daysAgo', 'yesterday');
      }
    } else if (lowerMessage.includes('vehicle') || lowerMessage.includes('inventory') || lowerMessage.includes('asc_item_pageviews')) {
      // Vehicle inventory analysis - using your custom event
      ga4Data = await runGA4Report(['eventName', 'customEvent:item_condition'], ['eventCount'], '30daysAgo', 'yesterday', 50);
    } else if (lowerMessage.includes('campaign') || lowerMessage.includes('marketing') || lowerMessage.includes('source')) {
      // Marketing campaign analysis
      ga4Data = await runGA4Report(['sessionSource', 'sessionMedium'], ['sessions', 'conversions'], '30daysAgo', 'yesterday', 20);
    }

    // Create the prompt with actual data if available
    let dataContext = '';
    if (ga4Data?.success) {
      dataContext = `

REAL GA4 DATA FROM YOUR DEALERSHIP:
Date Range: ${ga4Data.dateRange.startDate} to ${ga4Data.dateRange.endDate}
Total Rows: ${ga4Data.rowCount}

Totals: ${JSON.stringify(ga4Data.totals, null, 2)}

Top Results:
${ga4Data.rows.slice(0, 10).map((row: any, index: number) => 
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

Please provide a detailed, actionable analysis. Format your response in a clear, professional manner that a marketing team can understand and act upon. If you have real data above, focus on that. If not, explain what specific GA4 reports would be needed.`
      }]
    });

    const responseText = response.content[0]?.type === 'text' 
      ? response.content[0].text 
      : 'Sorry, I could not process your request.';

    return NextResponse.json({ response: responseText });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process your request. Please try again.' },
      { status: 500 }
    );
  }
}