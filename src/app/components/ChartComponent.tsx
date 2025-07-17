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
          'rgba(137, 180, 250, 0.7)', // Catppuccin Mocha - Lavender
          'rgba(180, 190, 254, 0.7)', // Catppuccin Mocha - Blue
          'rgba(245, 194, 231, 0.7)', // Catppuccin Mocha - Pink
          'rgba(166, 227, 161, 0.7)', // Catppuccin Mocha - Green
          'rgba(249, 226, 175, 0.7)', // Catppuccin Mocha - Yellow
          'rgba(116, 199, 236, 0.7)', // Catppuccin Mocha - Sky
          'rgba(250, 200, 187, 0.7)', // Catppuccin Mocha - Peach
        ],
        borderColor: [
          'rgba(137, 180, 250, 1)',
          'rgba(180, 190, 254, 1)',
          'rgba(245, 194, 231, 1)',
          'rgba(166, 227, 161, 1)',
          'rgba(249, 226, 175, 1)',
          'rgba(116, 199, 236, 1)',
          'rgba(250, 200, 187, 1)',
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
          color: '#cdd6f4', // Catppuccin Mocha - Text
        },
      },
      title: {
        display: true,
        text: title,
        color: '#89b4fa', // Catppuccin Mocha - Lavender
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
          color: '#cdd6f4', // Catppuccin Mocha - Text
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)', // Subtle grid lines
        },
      },
      y: {
        ticks: {
          color: '#cdd6f4', // Catppuccin Mocha - Text
          stepSize: 1,
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)', // Subtle grid lines
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
