<script>
  import { onMount } from 'svelte';

  // Sample data structure - replace with actual API data later
  let currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  let openaiCost = 0;
  let anthropicCost = 0;
  let totalCost = 0;

  // Mock data for demonstration
  let monthlyData = [
    { month: 'Jan', openai: 45.20, anthropic: 32.15 },
    { month: 'Feb', openai: 52.80, anthropic: 38.90 },
    { month: 'Mar', openai: 61.30, anthropic: 45.20 },
    { month: 'Apr', openai: 48.90, anthropic: 41.60 },
    { month: 'May', openai: 55.40, anthropic: 49.80 },
  ];

  onMount(() => {
    // Simulate loading current month's costs
    openaiCost = 73.45;
    anthropicCost = 58.90;
    totalCost = openaiCost + anthropicCost;
  });

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
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

  <!-- Historical Data -->
  <section>
    <h2 class="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
      Historical Data
    </h2>

    <div class="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-200 dark:border-slate-700">
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
    </div>
  </section>

  <!-- Footer Note -->
  <footer class="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
    <p>Cost data is updated in real-time via API integration</p>
  </footer>
</div>
