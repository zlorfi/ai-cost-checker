/**
 * Anthropic API Service
 * Handles fetching usage and cost data from Anthropic API
 */

interface AnthropicCostData {
  data: Array<{
    starting_at: string;
    ending_at: string;
    results: Array<{
      currency: string;
      amount: string; // Note: This is a string, not a number!
      workspace_id?: string;
      description?: string;
      cost_type?: string;
      context_window?: string;
      model?: string;
      service_tier?: string;
      token_type?: string;
    }>;
  }>;
  has_more: boolean;
  next_page?: string;
}

interface AnthropicUsageData {
  data: Array<{
    date: string;
    model: string;
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  }>;
  has_more: boolean;
}

export class AnthropicService {
  private proxyUrl: string;

  constructor() {
    // Use env variable or default to localhost:3001
    const baseUrl = import.meta.env.VITE_API_PROXY_URL || 'http://localhost:3001';
    this.proxyUrl = `${baseUrl}/api/anthropic`;
  }

  /**
   * Fetch cost report via proxy server
   */
  async getCostReport(startDate: Date, endDate: Date): Promise<AnthropicCostData> {
    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();

    const url = `${this.proxyUrl}/costs?starting_at=${startDateStr}&ending_at=${endDateStr}`;

    console.log('Fetching Anthropic costs from proxy:', url);

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      throw new Error(`Anthropic API error: ${response.status} ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Fetch usage report via proxy server
   */
  async getUsageReport(startDate: Date, endDate: Date): Promise<AnthropicUsageData> {
    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();

    const url = `${this.proxyUrl}/usage?starting_at=${startDateStr}&ending_at=${endDateStr}`;

    console.log('Fetching Anthropic usage from proxy:', url);

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      throw new Error(`Anthropic API error: ${response.status} ${errorText}`);
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

    try {
      const costData = await this.getCostReport(startOfMonth, endOfMonth);
      if (!costData.data || !Array.isArray(costData.data)) {
        console.warn('Invalid Anthropic cost data structure:', costData);
        return 0;
      }

      const total = costData.data.reduce((sum, bucket) => {
        // Sum all costs in the results array for this time bucket
        const bucketTotal = bucket.results.reduce((bucketSum, result) => {
          const cost = parseFloat(result.amount) || 0;
          return bucketSum + cost;
        }, 0);
        return sum + bucketTotal;
      }, 0);

      console.log('Anthropic current month total:', total);
      return total;
    } catch (error) {
      console.error('Error fetching Anthropic cost:', error);
      // Fallback to calculating from usage data
      return this.calculateCostFromUsage(startOfMonth, endOfMonth);
    }
  }

  /**
   * Get daily costs for the last N days
   */
  async getDailyCosts(days: number = 30): Promise<Array<{ date: string; cost: number }>> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    try {
      const costData = await this.getCostReport(startDate, endDate);
      if (!costData.data || !Array.isArray(costData.data)) {
        console.warn('Invalid Anthropic daily cost data:', costData);
        return [];
      }

      return costData.data.map(bucket => {
        // Sum all costs in the results array for this time bucket
        const totalCost = bucket.results.reduce((sum, result) => {
          const cost = parseFloat(result.amount) || 0;
          return sum + cost;
        }, 0);

        // Extract date from starting_at timestamp
        const date = bucket.starting_at.split('T')[0];

        return {
          date,
          cost: totalCost,
        };
      });
    } catch (error) {
      console.error('Error fetching Anthropic daily costs:', error);
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

      try {
        const costData = await this.getCostReport(startOfMonth, endOfMonth);
        if (!costData.data || !Array.isArray(costData.data)) {
          console.warn('Invalid Anthropic monthly cost data:', costData);
          costs.push({
            month: date.toLocaleDateString('en-US', { month: 'short' }),
            cost: 0,
          });
          continue;
        }

        const totalCost = costData.data.reduce((sum, bucket) => {
          // Sum all costs in the results array for this time bucket
          const bucketTotal = bucket.results.reduce((bucketSum, result) => {
            const cost = parseFloat(result.amount) || 0;
            return bucketSum + cost;
          }, 0);
          return sum + bucketTotal;
        }, 0);
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });

        costs.push({
          month: monthName,
          cost: totalCost,
        });
      } catch (error) {
        console.error(`Error fetching Anthropic cost for month ${i}:`, error);
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
   * Calculate cost from usage data when cost endpoint is unavailable
   */
  private async calculateCostFromUsage(startDate: Date, endDate: Date): Promise<number> {
    try {
      const usage = await this.getUsageReport(startDate, endDate);
      let totalCost = 0;

      // Approximate pricing (as of 2025, subject to change)
      // Claude 3.5 Sonnet pricing
      const COST_PER_1M_INPUT_TOKENS = 3.00;
      const COST_PER_1M_OUTPUT_TOKENS = 15.00;

      for (const entry of usage.data) {
        const inputCost = (entry.input_tokens / 1_000_000) * COST_PER_1M_INPUT_TOKENS;
        const outputCost = (entry.output_tokens / 1_000_000) * COST_PER_1M_OUTPUT_TOKENS;
        totalCost += inputCost + outputCost;
      }

      return totalCost;
    } catch (error) {
      console.error('Error calculating cost from usage:', error);
      return 0;
    }
  }

  /**
   * Get usage breakdown by model
   */
  async getModelBreakdown(startDate: Date, endDate: Date): Promise<Array<{
    model: string;
    inputTokens: number;
    outputTokens: number;
    estimatedCost: number;
  }>> {
    try {
      const usage = await this.getUsageReport(startDate, endDate);
      const modelMap = new Map<string, {
        inputTokens: number;
        outputTokens: number;
      }>();

      for (const entry of usage.data) {
        if (modelMap.has(entry.model)) {
          const existing = modelMap.get(entry.model)!;
          existing.inputTokens += entry.input_tokens;
          existing.outputTokens += entry.output_tokens;
        } else {
          modelMap.set(entry.model, {
            inputTokens: entry.input_tokens,
            outputTokens: entry.output_tokens,
          });
        }
      }

      return Array.from(modelMap.entries()).map(([model, data]) => ({
        model,
        inputTokens: data.inputTokens,
        outputTokens: data.outputTokens,
        estimatedCost: (data.inputTokens / 1_000_000) * 3.00 + (data.outputTokens / 1_000_000) * 15.00,
      }));
    } catch (error) {
      console.error('Error fetching model breakdown:', error);
      return [];
    }
  }
}
