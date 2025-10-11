"use client";

import { useMemo } from "react";
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import type { ChartOptions } from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Legend,
  Tooltip,
  Title
);

type ReserveSample = {
  timestamp: number;
  reserveETH: number;
  reserveToken: number;
};

type ReservesChartProps = {
  data: ReserveSample[];
  isLoading: boolean;
  error: string | null;
};

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function ReservesChart({
  data,
  isLoading,
  error,
}: ReservesChartProps) {
  const labels = useMemo(
    () => data.map((sample) => formatTimestamp(sample.timestamp)),
    [data]
  );

  const yDomain = useMemo(() => {
    if (!data.length) {
      return null;
    }

    const values = data.flatMap((point) => [
      point.reserveETH,
      point.reserveToken,
    ]);

    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min || 1) * 0.15;

    return {
      min: Math.max(min - padding, 0),
      max: max + padding,
    };
  }, [data]);

  const chartData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: "Reserve ETH",
          data: data.map((point) => point.reserveETH),
          borderColor: "#c084fc",
          backgroundColor: "rgba(192, 132, 252, 0.25)",
          borderWidth: 3,
          tension: 0.35,
          pointBackgroundColor: "rgba(192, 132, 252, 0.95)",
          pointBorderColor: "rgba(250, 245, 255, 0.75)",
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: "Reserve Token",
          data: data.map((point) => point.reserveToken),
          borderColor: "#38bdf8",
          backgroundColor: "rgba(56, 189, 248, 0.2)",
          borderWidth: 3,
          tension: 0.35,
          pointBackgroundColor: "rgba(56, 189, 248, 0.95)",
          pointBorderColor: "rgba(224, 247, 255, 0.8)",
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    }),
    [data, labels]
  );

  const options: ChartOptions<"line"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: "index",
      },
      plugins: {
        legend: {
          position: "top",
          labels: {
            color: "rgba(226, 232, 240, 0.75)",
            boxWidth: 12,
            boxHeight: 12,
            padding: 16,
          },
        },
        tooltip: {
          backgroundColor: "rgba(15, 15, 23, 0.95)",
          titleColor: "#e5e7eb",
          bodyColor: "#e5e7eb",
          borderColor: "rgba(99, 102, 241, 0.35)",
          borderWidth: 1,
          padding: 14,
          displayColors: true,
        },
      },
      scales: {
        x: {
          grid: {
            color: "rgba(148, 163, 184, 0.12)",
            tickLength: 0,
          },
          ticks: {
            color: "rgba(226, 232, 240, 0.65)",
            font: {
              size: 12,
            },
            maxRotation: 0,
            autoSkipPadding: 10,
          },
        },
        y: {
          grid: {
            color: "rgba(148, 163, 184, 0.12)",
          },
          ticks: {
            color: "rgba(226, 232, 240, 0.68)",
            font: {
              size: 12,
            },
          },
          suggestedMin: yDomain?.min ?? 0,
          suggestedMax: yDomain?.max ?? 5,
        },
      },
    }),
    [yDomain]
  );

  return (
    <article className="card dashboard-card dashboard-card--wide">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="dashboard-card__title text-left md:text-left">
          Reserves Chart
        </h2>
        {isLoading && !data.length && (
          <span className="text-sm text-gray-400">Fetching reserves…</span>
        )}
      </div>

      <p className="text-sm text-gray-400">
        Live ETH and token reserves refreshed every 10 seconds.
      </p>

      <div className="h-72 w-full">
        {data.length ? (
          <Line data={chartData} options={options} />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-2xl border border-dashed border-purple-500/30 bg-purple-500/5 text-sm text-purple-200/80">
            {isLoading ? "Awaiting on-chain data…" : "No reserve snapshots yet."}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-rose-400 md:text-left">{error}</p>
      )}
    </article>
  );
}
