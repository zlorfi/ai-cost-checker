<script>
  import { onMount } from 'svelte';
  import { costTracker } from './services/costTracker';
  import LineChart from './components/LineChart.svelte';
  import BarChart from './components/BarChart.svelte';

  let currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  let openaiCost = 0;
  let anthropicCost = 0;
  let totalCost = 0;
  let loading = true;
  let error = null;
  let useMockData = true;

  // Data for charts
  let monthlyData = [];
  let dailyData = [];

  // Mock data for demonstration (used when API keys are not configured)
  const mockMonthlyData = [
    { month: 'Jan', openai: 45.20, anthropic: 32.15 },
    { month: 'Feb', openai: 52.80, anthropic: 38.90 },
    { month: 'Mar', openai: 61.30, anthropic: 45.20 },
    { month: 'Apr', openai: 48.90, anthropic: 41.60 },
    { month: 'May', openai: 55.40, anthropic: 49.80 },
  ];

  const mockDailyData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return {
      date: date.toISOString().split('T')[0],
      openai: Math.random() * 5 + 1,
      anthropic: Math.random() * 4 + 0.5,
      total: 0
    };
  }).map(d => ({ ...d, total: d.openai + d.anthropic }));

  onMount(async () => {
    // Initialize cost tracker with API keys from environment
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const anthropicKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

    if (openaiKey || anthropicKey) {
      costTracker.init(openaiKey, anthropicKey);
      const configured = costTracker.isConfigured();

      if (configured.openai || configured.anthropic) {
        useMockData = false;
        await loadRealData();
      } else {
        loadMockData();
      }
    } else {
      loadMockData();
    }
  });

  async function loadRealData() {
    try {
      loading = true;
      error = null;

      // Fetch current month summary
      const summary = await costTracker.getCurrentMonthSummary();
      openaiCost = summary.openai;
      anthropicCost = summary.anthropic;
      totalCost = summary.total;

      // Fetch historical data
      const [monthly, daily] = await Promise.all([
        costTracker.getMonthlyData(6),
        costTracker.getDailyCosts(30)
      ]);

      monthlyData = monthly;
      dailyData = daily;
    } catch (err) {
      console.error('Error loading cost data:', err);
      error = err.message;
      // Fallback to mock data on error
      loadMockData();
    } finally {
      loading = false;
    }
  }

  function loadMockData() {
    openaiCost = 73.45;
    anthropicCost = 58.90;
    totalCost = openaiCost + anthropicCost;
    monthlyData = mockMonthlyData;
    dailyData = mockDailyData;
    loading = false;
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  // Prepare chart data
  $: monthlyChartLabels = monthlyData.map(d => d.month);
  $: monthlyChartDatasets = [
    {
      label: 'OpenAI',
      data: monthlyData.map(d => d.openai),
      backgroundColor: 'rgba(34, 197, 94, 0.7)',
      borderColor: 'rgb(34, 197, 94)',
    },
    {
      label: 'Anthropic',
      data: monthlyData.map(d => d.anthropic),
      backgroundColor: 'rgba(251, 146, 60, 0.7)',
      borderColor: 'rgb(251, 146, 60)',
    }
  ];

  $: dailyChartLabels = dailyData.map(d => {
    const date = new Date(d.date);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });
  $: dailyChartDatasets = [
    {
      label: 'OpenAI',
      data: dailyData.map(d => d.openai),
      borderColor: 'rgb(34, 197, 94)',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      fill: true,
      tension: 0.4,
    },
    {
      label: 'Anthropic',
      data: dailyData.map(d => d.anthropic),
      borderColor: 'rgb(251, 146, 60)',
      backgroundColor: 'rgba(251, 146, 60, 0.1)',
      fill: true,
      tension: 0.4,
    }
  ];
</script>

<div class="container mx-auto px-4 py-8 max-w-7xl">
  <!-- Header -->
  <header class="mb-8">
    <h1 class="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
      AI API Cost Tracker
    </h1>
    <p class="text-slate-600 dark:text-slate-400">
      Monitor your OpenAI and Anthropic API usage costs
    </p>
  </header>

  <!-- Current Month Summary -->
  <section class="mb-8">
    <h2 class="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
      {currentMonth}
    </h2>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- OpenAI Card -->
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-lg font-medium text-slate-700 dark:text-slate-300">OpenAI</h3>
          <div class="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <p class="text-3xl font-bold text-slate-900 dark:text-slate-100">
          {formatCurrency(openaiCost)}
        </p>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-2">
          GPT-4 & GPT-3.5 usage
        </p>
      </div>

      <!-- Anthropic Card -->
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-lg font-medium text-slate-700 dark:text-slate-300">Anthropic</h3>
          <div class="w-3 h-3 rounded-full bg-orange-500"></div>
        </div>
        <p class="text-3xl font-bold text-slate-900 dark:text-slate-100">
          {formatCurrency(anthropicCost)}
        </p>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Claude usage
        </p>
      </div>

      <!-- Total Card -->
      <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 border border-blue-400 hover:shadow-xl transition-shadow">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-lg font-medium text-white">Total Cost</h3>
          <div class="w-3 h-3 rounded-full bg-white"></div>
        </div>
        <p class="text-3xl font-bold text-white">
          {formatCurrency(totalCost)}
        </p>
        <p class="text-sm text-blue-100 mt-2">
          Combined monthly spend
        </p>
      </div>
    </div>
  </section>

  <!-- Charts Section -->
  <section class="mb-8">
    <h2 class="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
      Cost Trends
    </h2>

    {#if loading}
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-12 border border-slate-200 dark:border-slate-700 text-center">
        <div class="animate-pulse">
          <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mx-auto mb-4"></div>
          <div class="h-64 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    {:else}
      <!-- Daily Costs Chart -->
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-200 dark:border-slate-700 mb-6">
        <h3 class="text-lg font-medium text-slate-800 dark:text-slate-200 mb-4">
          Daily Costs (Last 30 Days)
        </h3>
        <LineChart
          labels={dailyChartLabels}
          datasets={dailyChartDatasets}
          height={300}
        />
      </div>

      <!-- Monthly Comparison Chart -->
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-200 dark:border-slate-700">
        <h3 class="text-lg font-medium text-slate-800 dark:text-slate-200 mb-4">
          Monthly Comparison
        </h3>
        <BarChart
          labels={monthlyChartLabels}
          datasets={monthlyChartDatasets}
          height={300}
          stacked={false}
        />
      </div>
    {/if}
  </section>

  <!-- Historical Data Table -->
  <section>
    <h2 class="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
      Historical Data
    </h2>

    <div class="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-200 dark:border-slate-700">
      {#if loading}
        <div class="animate-pulse space-y-4">
          <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      {:else}
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-slate-200 dark:border-slate-700">
                <th class="text-left py-3 px-4 text-slate-700 dark:text-slate-300 font-semibold">Month</th>
                <th class="text-right py-3 px-4 text-slate-700 dark:text-slate-300 font-semibold">OpenAI</th>
                <th class="text-right py-3 px-4 text-slate-700 dark:text-slate-300 font-semibold">Anthropic</th>
                <th class="text-right py-3 px-4 text-slate-700 dark:text-slate-300 font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {#each monthlyData as data}
                <tr class="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td class="py-3 px-4 text-slate-900 dark:text-slate-100">{data.month}</td>
                  <td class="py-3 px-4 text-right text-slate-900 dark:text-slate-100">{formatCurrency(data.openai)}</td>
                  <td class="py-3 px-4 text-right text-slate-900 dark:text-slate-100">{formatCurrency(data.anthropic)}</td>
                  <td class="py-3 px-4 text-right font-semibold text-slate-900 dark:text-slate-100">
                    {formatCurrency(data.openai + data.anthropic)}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  </section>

  <!-- Footer Note -->
  <footer class="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
    {#if useMockData}
      <p class="text-amber-600 dark:text-amber-400 font-medium mb-2">
        Using demo data - Add API keys to .env file to see real costs
      </p>
    {/if}
    {#if error}
      <p class="text-red-600 dark:text-red-400 mb-2">
        Error loading data: {error}
      </p>
    {/if}
    <p>
      {useMockData ? 'Demo data updated daily' : 'Cost data is updated in real-time via API integration'}
    </p>
  </footer>
</div>
