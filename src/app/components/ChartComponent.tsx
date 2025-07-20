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
          '#cba6f7cc',  // Mauve with 80% opacity
          '#f5c2e7cc',  // Pink with 80% opacity
          '#94e2d5cc',  // Teal with 80% opacity
          '#fab387cc',  // Peach with 80% opacity
          '#a6e3a1cc',  // Green with 80% opacity
          '#89b4facc',  // Blue with 80% opacity
          '#f9e2afcc',  // Yellow with 80% opacity
          '#b4befecc',  // Lavender with 80% opacity
          '#89dcebcc',  // Sky with 80% opacity
          '#f38ba8cc',  // Red with 80% opacity
        ],
        borderColor: [
          'var(--ctp-mauve)',  // Mauve
          'var(--ctp-pink)',  // Pink
          'var(--ctp-teal)',  // Teal
          'var(--ctp-peach)',  // Peach
          'var(--ctp-green)',  // Green
          'var(--ctp-blue)',  // Blue
          'var(--ctp-yellow)',  // Yellow
          'var(--ctp-lavender)',  // Lavender
          'var(--ctp-sky)',  // Sky
          'var(--ctp-red)',  // Red
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
            weight: 500,
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
          weight: 600,
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
            weight: 500,
          }
        },
        grid: {
          color: '#6c708650',
        },
      },
      y: {
        ticks: {
          color: '#cdd6f4',
          stepSize: 1,
          font: {
            family: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
            size: 11,
            weight: 500,
          }
        },
        grid: {
          color: '#6c708650',
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
