/**
 * OpenAI API Service
 * Handles fetching usage and billing data from OpenAI API
 * Uses the new organization/costs API endpoint
 */

interface OpenAICostData {
  object: string;
  data: Array<{
    start_time: number;
    end_time: number;
    results: Array<{
      object: string;
      amount: {
        value: number;
        currency: string;
      };
      line_item?: string;
      project_id?: string;
    }>;
  }>;
  has_more: boolean;
}

interface DailyCost {
  date: string;
  cost: number;
  requests: number;
}

export class OpenAIService {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Fetch cost data using the new /organization/costs endpoint
   */
  async getCosts(startDate: Date, endDate?: Date): Promise<OpenAICostData> {
    // Convert to Unix timestamp (seconds)
    const startTime = Math.floor(startDate.getTime() / 1000);
    const endTime = endDate ? Math.floor(endDate.getTime() / 1000) : Math.floor(Date.now() / 1000);

    const url = `${this.baseUrl}/organization/costs?start_time=${startTime}&end_time=${endTime}&bucket_width=1d&limit=180`;

    console.log('Fetching OpenAI costs from:', url);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Calculate total cost for the current month
   */
  async getCurrentMonthCost(): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    try {
      const costData = await this.getCosts(startOfMonth, endOfMonth);
      return this.calculateTotalCost(costData);
    } catch (error) {
      console.error('Error fetching OpenAI costs:', error);
      return 0;
    }
  }

  /**
   * Get daily costs for the last N days
   */
  async getDailyCosts(days: number = 30): Promise<DailyCost[]> {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    try {
      const costData = await this.getCosts(startDate, endDate);
      return this.groupCostsByDay(costData);
    } catch (error) {
      console.error('Error fetching OpenAI daily costs:', error);
      return [];
    }
  }

  /**
   * Get monthly costs for the last N months
   */
  async getMonthlyCosts(months: number = 6): Promise<Array<{ month: string; cost: number }>> {
    const costs: Array<{ month: string; cost: number }> = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);

      try {
        const costData = await this.getCosts(startOfMonth, endOfMonth);
        const cost = this.calculateTotalCost(costData);
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });

        costs.push({
          month: monthName,
          cost: cost,
        });
      } catch (error) {
        console.error(`Error fetching OpenAI cost for month ${i}:`, error);
        costs.push({
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          cost: 0,
        });
      }

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return costs;
  }

  /**
   * Calculate total cost from cost data
   * OpenAI returns costs in cents/smallest currency unit
   */
  private calculateTotalCost(costData: OpenAICostData): number {
    let totalCost = 0;

    for (const bucket of costData.data) {
      for (const result of bucket.results) {
        // OpenAI returns amounts in cents, convert to dollars
        totalCost += result.amount.value / 100;
      }
    }

    return totalCost;
  }

  /**
   * Group cost data by day
   */
  private groupCostsByDay(costData: OpenAICostData): DailyCost[] {
    const dailyMap = new Map<string, { cost: number }>();

    for (const bucket of costData.data) {
      const date = new Date(bucket.start_time * 1000);
      const dateStr = date.toISOString().split('T')[0];

      let bucketCost = 0;
      for (const result of bucket.results) {
        // Convert from cents to dollars
        bucketCost += result.amount.value / 100;
      }

      if (dailyMap.has(dateStr)) {
        dailyMap.get(dateStr)!.cost += bucketCost;
      } else {
        dailyMap.set(dateStr, { cost: bucketCost });
      }
    }

    return Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        cost: data.cost,
        requests: 0, // Not available in costs API
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
