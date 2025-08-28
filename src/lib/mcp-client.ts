interface GA4ReportParams {
  dimensions: string[];
  metrics: string[];
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export class GA4Client {
  private propertyId: string;
  private credentialsPath: string;

  constructor() {
    this.propertyId = process.env.GA4_PROPERTY_ID || '';
    this.credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || '';
  }

  async runReport(params: GA4ReportParams) {
    // For now, let's create a simple implementation
    // In the next step, we'll connect this to your MCP server
    
    const { BetaAnalyticsDataClient } = await import('@google-analytics/data');
    const analyticsDataClient = new BetaAnalyticsDataClient({
      keyFilename: this.credentialsPath,
    });

    const [response] = await analyticsDataClient.runReport({
      property: `properties/${this.propertyId}`,
      dimensions: params.dimensions.map(name => ({ name })),
      metrics: params.metrics.map(name => ({ name })),
      dateRanges: [{
        startDate: params.startDate || '7daysAgo',
        endDate: params.endDate || 'yesterday',
      }],
      limit: params.limit || 100,
    });

    return this.formatResponse(response, params.dimensions, params.metrics);
  }

  private formatResponse(response: any, dimensions: string[], metrics: string[]) {
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

    return {
      rowCount: response.rowCount || 0,
      rows,
      totals: response.totals?.[0]?.metricValues?.map((value: any, index: number) => ({
        metric: metrics[index],
        value: value.value
      })) || []
    };
  }
}