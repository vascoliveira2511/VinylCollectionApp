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
          'rgba(251, 73, 52, 0.6)', // Gruvbox Red
          'rgba(254, 128, 25, 0.6)', // Gruvbox Orange
          'rgba(250, 189, 47, 0.6)', // Gruvbox Yellow
          'rgba(177, 98, 134, 0.6)', // Gruvbox Purple
          'rgba(131, 165, 152, 0.6)', // Gruvbox Aqua
          'rgba(142, 192, 124, 0.6)', // Gruvbox Green
          'rgba(104, 157, 106, 0.6)', // Gruvbox Dark Green
        ],
        borderColor: [
          'rgba(251, 73, 52, 1)',
          'rgba(254, 128, 25, 1)',
          'rgba(250, 189, 47, 1)',
          'rgba(177, 98, 134, 1)',
          'rgba(131, 165, 152, 1)',
          'rgba(142, 192, 124, 1)',
          'rgba(104, 157, 106, 1)',
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
          color: '#ebdbb2', // Gruvbox Foreground
        },
      },
      title: {
        display: true,
        text: title,
        color: '#fabd2f', // Gruvbox Yellow
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
          color: '#ebdbb2',
        },
        grid: {
          color: '#504945',
        },
      },
      y: {
        ticks: {
          color: '#ebdbb2',
          stepSize: 1,
        },
        grid: {
          color: '#504945',
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
