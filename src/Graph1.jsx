import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
  } from 'chart.js';
  import { Line } from 'react-chartjs-2';
  import { useState } from 'react';
  
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
  );
  
  export default function Graph2({ydata = []}) {
    const graphData = {
      labels: new Array(ydata.length).fill(0).map((x,idx) => idx),
      yData: ydata,
    };
    console.log(graphData)
    const options = {
      animation: false,
      responsive: true,
      plugins: {
        legend: {
          position: 'top'
        },
        title: {
          display: true,
          text: 'Chart.js Line Chart',
        },
      },
    };
  
    const data = {
      labels: graphData.labels,
      datasets: [
        {
          label: 'Dataset 1',
          data: graphData.yData,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
        },
      ],
    };
  
    return (
        <div>
          <Line options={options} data={data} />
        </div>
      )
  }