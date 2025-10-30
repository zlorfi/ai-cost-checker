<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import {
    Chart,
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Title,
    Tooltip,
    Legend,
    Filler
  } from 'chart.js';

  // Register Chart.js components
  Chart.register(
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Title,
    Tooltip,
    Legend,
    Filler
  );

  interface Props {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor?: string;
      backgroundColor?: string;
      fill?: boolean;
      tension?: number;
    }>;
    title?: string;
    height?: number;
  }

  let {
    labels,
    datasets,
    title = '',
    height = 300
  }: Props = $props();

  let canvas: HTMLCanvasElement;
  let chart: Chart | null = null;

  onMount(() => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: datasets.map(ds => ({
          label: ds.label,
          data: ds.data,
          borderColor: ds.borderColor || '#3b82f6',
          backgroundColor: ds.backgroundColor || 'rgba(59, 130, 246, 0.1)',
          fill: ds.fill !== undefined ? ds.fill : true,
          tension: ds.tension || 0.4,
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: 'rgb(148, 163, 184)',
              font: {
                size: 12,
              },
            },
          },
          title: {
            display: !!title,
            text: title,
            color: 'rgb(148, 163, 184)',
            font: {
              size: 16,
              weight: 'bold',
            },
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleColor: 'rgb(226, 232, 240)',
            bodyColor: 'rgb(226, 232, 240)',
            borderColor: 'rgb(51, 65, 85)',
            borderWidth: 1,
            padding: 12,
            displayColors: true,
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += '$' + context.parsed.y.toFixed(2);
                }
                return label;
              }
            }
          },
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(148, 163, 184, 0.1)',
            },
            ticks: {
              color: 'rgb(148, 163, 184)',
            },
          },
          y: {
            grid: {
              color: 'rgba(148, 163, 184, 0.1)',
            },
            ticks: {
              color: 'rgb(148, 163, 184)',
              callback: function(value) {
                return '$' + value;
              },
            },
            beginAtZero: true,
          },
        },
      },
    });
  });

  onDestroy(() => {
    if (chart) {
      chart.destroy();
    }
  });

  // Update chart when data changes
  $effect(() => {
    if (chart) {
      chart.data.labels = labels;
      chart.data.datasets = datasets.map(ds => ({
        label: ds.label,
        data: ds.data,
        borderColor: ds.borderColor || '#3b82f6',
        backgroundColor: ds.backgroundColor || 'rgba(59, 130, 246, 0.1)',
        fill: ds.fill !== undefined ? ds.fill : true,
        tension: ds.tension || 0.4,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      }));
      chart.update();
    }
  });
</script>

<div style="height: {height}px; position: relative;">
  <canvas bind:this={canvas}></canvas>
</div>
