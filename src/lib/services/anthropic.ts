/**
 * Anthropic API Service
 * Handles fetching usage and cost data from Anthropic API
 */

interface AnthropicCostData {
  data: Array<{
    date: string;
    cost_usd: number;
    workspace_id?: string;
  }>;
  has_more: boolean;
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
  private adminApiKey: string;
  private baseUrl = 'https://api.anthropic.com/v1/organizations';
  private anthropicVersion = '2023-06-01';

  constructor(adminApiKey: string) {
    this.adminApiKey = adminApiKey;
  }

  /**
   * Fetch cost report for a specific date range
   */
  async getCostReport(startDate: Date, endDate: Date): Promise<AnthropicCostData> {
    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();

    const response = await fetch(
      `${this.baseUrl}/cost_report?starting_at=${startDateStr}&ending_at=${endDateStr}&bucket_width=1d`,
      {
        headers: {
          'anthropic-version': this.anthropicVersion,
          'x-api-key': this.adminApiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Fetch usage report for a specific date range
   */
  async getUsageReport(startDate: Date, endDate: Date): Promise<AnthropicUsageData> {
    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();

    const response = await fetch(
      `${this.baseUrl}/usage_report/messages?starting_at=${startDateStr}&ending_at=${endDateStr}&group_by[]=model&bucket_width=1d`,
      {
        headers: {
          'anthropic-version': this.anthropicVersion,
          'x-api-key': this.adminApiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
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
      return costData.data.reduce((sum, entry) => sum + entry.cost_usd, 0);
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
      return costData.data.map(entry => ({
        date: entry.date,
        cost: entry.cost_usd,
      }));
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
        const totalCost = costData.data.reduce((sum, entry) => sum + entry.cost_usd, 0);
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
