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
          'rgba(120, 80, 220, 0.8)',  // Purple
          'rgba(220, 80, 120, 0.8)',  // Pink
          'rgba(80, 200, 180, 0.8)',  // Teal
          'rgba(255, 140, 80, 0.8)',  // Orange
          'rgba(140, 220, 80, 0.8)',  // Green
          'rgba(80, 160, 220, 0.8)',  // Blue
          'rgba(200, 160, 80, 0.8)',  // Gold
          'rgba(160, 80, 200, 0.8)',  // Violet
          'rgba(80, 220, 140, 0.8)',  // Mint
          'rgba(220, 160, 80, 0.8)',  // Amber
        ],
        borderColor: [
          'rgba(120, 80, 220, 1)',
          'rgba(220, 80, 120, 1)',
          'rgba(80, 200, 180, 1)',
          'rgba(255, 140, 80, 1)',
          'rgba(140, 220, 80, 1)',
          'rgba(80, 160, 220, 1)',
          'rgba(200, 160, 80, 1)',
          'rgba(160, 80, 200, 1)',
          'rgba(80, 220, 140, 1)',
          'rgba(220, 160, 80, 1)',
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
          color: '#e0e0e0',
          font: {
            family: 'Space Grotesk',
          }
        },
      },
      title: {
        display: true,
        text: title,
        color: '#ffffff',
        font: {
          family: 'Space Grotesk',
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
          color: '#e0e0e0',
          font: {
            family: 'Space Grotesk',
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      y: {
        ticks: {
          color: '#e0e0e0',
          stepSize: 1,
          font: {
            family: 'Space Grotesk',
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
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
