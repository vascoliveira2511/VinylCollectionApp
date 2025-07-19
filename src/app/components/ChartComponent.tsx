'use client'

import React from 'react'
import { Bar, Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface ChartProps {
  data: Record<string, number>
  title: string
  type: 'bar' | 'pie'
}

const ChartComponent: React.FC<ChartProps> = ({ data, title, type }) => {
  const chartData = {
    labels: Object.keys(data),
    datasets: [
      {
        label: title,
        data: Object.values(data),
        backgroundColor: [
          'rgba(203, 166, 247, 0.8)',  // Mauve
          'rgba(245, 194, 231, 0.8)',  // Pink
          'rgba(148, 226, 213, 0.8)',  // Teal
          'rgba(250, 179, 135, 0.8)',  // Peach
          'rgba(166, 227, 161, 0.8)',  // Green
          'rgba(137, 180, 250, 0.8)',  // Blue
          'rgba(249, 226, 175, 0.8)',  // Yellow
          'rgba(180, 190, 254, 0.8)',  // Lavender
          'rgba(137, 220, 235, 0.8)',  // Sky
          'rgba(243, 139, 168, 0.8)',  // Red
        ],
        borderColor: [
          '#cba6f7',  // Mauve
          '#f5c2e7',  // Pink
          '#94e2d5',  // Teal
          '#fab387',  // Peach
          '#a6e3a1',  // Green
          '#89b4fa',  // Blue
          '#f9e2af',  // Yellow
          '#b4befe',  // Lavender
          '#89dceb',  // Sky
          '#f38ba8',  // Red
        ],
        borderWidth: 1,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#cdd6f4',
          font: {
            family: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
            size: 12,
            weight: '500',
          }
        },
      },
      title: {
        display: true,
        text: title,
        color: '#cdd6f4',
        font: {
          family: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
          size: 16,
          weight: '600',
        }
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || '';
            if (label) {
                label += ': ';
            }
            if (context.parsed.y !== undefined) {
                label += context.parsed.y;
            } else if (context.parsed !== undefined) {
                label += context.parsed;
            }
            return label;
          }
        }
      }
    },
    scales: type === 'bar' ? {
      x: {
        ticks: {
          color: '#cdd6f4',
          font: {
            family: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
            size: 11,
            weight: '500',
          }
        },
        grid: {
          color: 'rgba(108, 112, 134, 0.3)',
        },
      },
      y: {
        ticks: {
          color: '#cdd6f4',
          stepSize: 1,
          font: {
            family: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
            size: 11,
            weight: '500',
          }
        },
        grid: {
          color: 'rgba(108, 112, 134, 0.3)',
        },
      },
    } : {},
  }

  return (
    <div style={{ marginBottom: '30px' }}>
      {type === 'bar' ? (
        <Bar data={chartData} options={options} />
      ) : (
        <Pie data={chartData} options={options} />
      )}
    </div>
  )
}

export default ChartComponent
