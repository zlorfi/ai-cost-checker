<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import {
    Chart,
    BarController,
    BarElement,
    LinearScale,
    CategoryScale,
    Title,
    Tooltip,
    Legend
  } from 'chart.js';

  // Register Chart.js components
  Chart.register(
    BarController,
    BarElement,
    LinearScale,
    CategoryScale,
    Title,
    Tooltip,
    Legend
  );

  interface Props {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
    }>;
    title?: string;
    height?: number;
    stacked?: boolean;
  }

  let {
    labels,
    datasets,
    title = '',
    height = 300,
    stacked = false
  }: Props = $props();

  let canvas: HTMLCanvasElement;
  let chart: Chart | null = null;

  onMount(() => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: datasets.map((ds, index) => ({
          label: ds.label,
          data: ds.data,
          backgroundColor: ds.backgroundColor || (
            index === 0
              ? 'rgba(34, 197, 94, 0.7)'
              : 'rgba(251, 146, 60, 0.7)'
          ),
          borderColor: ds.borderColor || (
            index === 0
              ? 'rgb(34, 197, 94)'
              : 'rgb(251, 146, 60)'
          ),
          borderWidth: 1,
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
            stacked: stacked,
            grid: {
              color: 'rgba(148, 163, 184, 0.1)',
            },
            ticks: {
              color: 'rgb(148, 163, 184)',
            },
          },
          y: {
            stacked: stacked,
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
      chart.data.datasets = datasets.map((ds, index) => ({
        label: ds.label,
        data: ds.data,
        backgroundColor: ds.backgroundColor || (
          index === 0
            ? 'rgba(34, 197, 94, 0.7)'
            : 'rgba(251, 146, 60, 0.7)'
        ),
        borderColor: ds.borderColor || (
          index === 0
            ? 'rgb(34, 197, 94)'
            : 'rgb(251, 146, 60)'
        ),
        borderWidth: 1,
      }));
      chart.update();
    }
  });
</script>

<div style="height: {height}px; position: relative;">
  <canvas bind:this={canvas}></canvas>
</div>
