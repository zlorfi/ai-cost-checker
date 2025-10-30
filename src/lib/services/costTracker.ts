/**
 * Cost Tracker Service
 * Combines OpenAI and Anthropic services for unified cost tracking
 */

import { OpenAIService } from './openai';
import { AnthropicService } from './anthropic';

export interface CostSummary {
  openai: number;
  anthropic: number;
  total: number;
  month: string;
}

export interface MonthlyData {
  month: string;
  openai: number;
  anthropic: number;
}

export interface DailyCostData {
  date: string;
  openai: number;
  anthropic: number;
  total: number;
}

export class CostTrackerService {
  private openaiService: OpenAIService | null = null;
  private anthropicService: AnthropicService | null = null;
  private openaiConfigured = false;
  private anthropicConfigured = false;

  /**
   * Initialize services with API keys
   */
  init(config: { openai: boolean; anthropic: boolean }) {
    this.openaiConfigured = config.openai;
    this.anthropicConfigured = config.anthropic;

    this.openaiService = this.openaiConfigured ? new OpenAIService() : null;
    this.anthropicService = this.anthropicConfigured ? new AnthropicService() : null;
  }

  /**
   * Get current month cost summary
   */
  async getCurrentMonthSummary(): Promise<CostSummary> {
    const now = new Date();
    const month = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const [openaiCost, anthropicCost] = await Promise.all([
      this.openaiService?.getCurrentMonthCost() ?? 0,
      this.anthropicService?.getCurrentMonthCost() ?? 0,
    ]);

    return {
      openai: openaiCost,
      anthropic: anthropicCost,
      total: openaiCost + anthropicCost,
      month,
    };
  }

  /**
   * Get historical monthly data
   */
  async getMonthlyData(months: number = 6): Promise<MonthlyData[]> {
    const [openaiData, anthropicData] = await Promise.all([
      this.openaiService?.getMonthlyCosts(months) ?? [],
      this.anthropicService?.getMonthlyCosts(months) ?? [],
    ]);

    // Combine data from both services
    const combinedMap = new Map<string, MonthlyData>();

    // Add OpenAI data
    for (const item of openaiData) {
      combinedMap.set(item.month, {
        month: item.month,
        openai: item.cost,
        anthropic: 0,
      });
    }

    // Add Anthropic data
    for (const item of anthropicData) {
      if (combinedMap.has(item.month)) {
        combinedMap.get(item.month)!.anthropic = item.cost;
      } else {
        combinedMap.set(item.month, {
          month: item.month,
          openai: 0,
          anthropic: item.cost,
        });
      }
    }

    // Sort by month
    return Array.from(combinedMap.values());
  }

  /**
   * Get daily costs for the last N days
   */
  async getDailyCosts(days: number = 30): Promise<DailyCostData[]> {
    const [openaiData, anthropicData] = await Promise.all([
      this.openaiService?.getDailyCosts(days) ?? [],
      this.anthropicService?.getDailyCosts(days) ?? [],
    ]);

    // Combine data from both services
    const combinedMap = new Map<string, DailyCostData>();

    // Add OpenAI data
    for (const item of openaiData) {
      combinedMap.set(item.date, {
        date: item.date,
        openai: item.cost,
        anthropic: 0,
        total: item.cost,
      });
    }

    // Add Anthropic data
    for (const item of anthropicData) {
      if (combinedMap.has(item.date)) {
        const existing = combinedMap.get(item.date)!;
        existing.anthropic = item.cost;
        existing.total = existing.openai + item.cost;
      } else {
        combinedMap.set(item.date, {
          date: item.date,
          openai: 0,
          anthropic: item.cost,
          total: item.cost,
        });
      }
    }

    // Sort by date
    return Array.from(combinedMap.values())
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Check if services are configured
   */
  isConfigured(): { openai: boolean; anthropic: boolean } {
    return {
      openai: this.openaiConfigured,
      anthropic: this.anthropicConfigured,
    };
  }
}

// Export singleton instance
export const costTracker = new CostTrackerService();
