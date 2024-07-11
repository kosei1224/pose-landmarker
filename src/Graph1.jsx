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
  import { useEffect, useState } from 'react';

  
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
  );
  
  export default function Graph1({ydata = [],hyou=["",""]}) {
    const graphData = {
      labels: new Array(ydata.length).fill(0).map((x,idx) => idx),
      yData: ydata,
    };
    //console.log(graphData)
    const options = {
      animation: false,
      responsive: true,
      plugins: {
        legend: {
          display: false,
          position: 'top'
        },
        title: {
          display: true,
          text: 'Chart.js Line Chart',
        },
      },
    };
    const [graph, setGraph] = useState({
      hidarikata: {
        name:'左肩',
        bui: 'hidarikata',
        borderColor: 'rgb(0, 255, 255)',
        hidden: true,
      },
      migikata : {
        name:'右肩',
        bui: 'migikata',
        borderColor: 'rgb(255, 255, 255)',
        hidden: true,
      },
      hidarihiji : {
        name:'左肘',
        bui: 'hidarihiji',
        borderColor: 'rgb(255, 99, 132)',
        hidden: true,
      },
      migihiji : {
        name:'右肘',
        bui: 'migihiji',
        borderColor: 'rgb(0, 0, 255)',
        hidden: true,
      },
      hidaritekubi : {
        name:'左手首',
        bui: 'hidaritekubi',
        borderColor: 'rgb(0, 255, 0)',
        hidden: true,
      },
      migitekubi : {
        name:'右手首',
        bui: 'migitekubi',
        borderColor: 'rgb(255, 255, 0)',
        hidden: true,
      },
      hidarikosi : {
        name:'左腰',
        bui: 'hidarikosi',
        borderColor: 'rgb(255, 192, 203)',
        hidden: true,
      },
      migikosi : {
        name:'右腰',
        bui: 'migikosi',
        borderColor: 'rgb(255, 165, 0)',
        hidden: true,
      },
      hidarihiza : {
        name:'左膝',
        bui: 'hidarihiza',
        borderColor: 'rgb(128,0,0)',
        hidden: true,
      },
      migihiza : {
        name:'右膝',
        bui: 'migihiza',
        borderColor: 'rgb(148,0,215)',
        hidden: true,
      },
      hidaritumasaki : {
        name:'左つま先',
        bui: 'hidaritumasaki',
        borderColor: 'rgb(102,204,255)',
        hidden: true,
      },
      migitumasaki : {
        name:'右つま先',
        bui: 'migitumasaki',
        borderColor: 'rgb(204,255,102)',
        hidden: true,
      }
    });
    
    useEffect(() =>{
      setGraph((j)=>{
        const jj = JSON.parse(JSON.stringify(j));// j copy
        if (hyou[0] !== "") {
          jj[hyou[0]].hidden = false;
        }
        if(hyou[1] !==""){
        jj[hyou[1]].hidden = false;
        }
        return jj;
      })
    },[hyou])

    const data = {
      labels: graphData.labels,
      datasets: Object.values(graph).map(youso => {
        return {label: youso.name,
          data: graphData.yData.map(a =>a[youso.bui].y),
          borderColor: youso.borderColor,
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          hidden: youso.hidden,
        }
      })

      //   {
      //     label: '左肩',
      //     data: graphData.yData.map(a =>a.hidarikata.y),
      //     borderColor: 'rgb(0, 255, 255)',
      //     backgroundColor: 'rgba(255, 99, 132, 0.5)',
      //     hidden: false,
      //   },
      //   {
      //     label: '右肩',
      //     data: graphData.yData.map(b =>b.migikata.y),
      //     borderColor: 'rgb(255,255,255)',
      //     backgroundColor: 'rgba(255, 99, 132, 0.5)',
      //     hidden: true,
      //   },
      //   {
      //     label: '左肘',
      //     data: graphData.yData.map(c =>c.hidarihiji.y),
      //     borderColor: 'rgb(255, 99, 132)',
      //     backgroundColor: 'rgba(255, 99, 132, 0.5)',
      //     hidden: true,
      //   },
      //   {
      //     label: '右肘',
      //     data: graphData.yData.map(d =>d.migihiji.y),
      //     borderColor: 'rgb(0, 0, 255)',
      //     backgroundColor: 'rgba(255, 99, 132, 0.5)',
      //     hidden: true,
      //   },
      //   {
      //     label: '左手首',
      //     data: graphData.yData.map(e =>e.hidaritekubi.y),
      //     borderColor: 'rgb(0, 255, 0)',
      //     backgroundColor: 'rgba(255, 99, 132, 0.5)',
      //     hidden: true,
      //   },
      //   {
      //     label: '右手首',
      //     data: graphData.yData.map(f =>f.migitekubi.y),
      //     borderColor: 'rgb(255, 255, 0)',
      //     backgroundColor: 'rgba(255, 99, 132, 0.5)',
      //     hidden: true,
      //   },
      //   {
      //     label: '左腰',
      //     data: graphData.yData.map(g =>g.hidarikosi.y),
      //     borderColor: 'rgb(255, 192, 203)',
      //     backgroundColor: 'rgba(255, 99, 132, 0.5)',
      //     hidden: true,
      //   },
      //   {
      //     label: '右腰',
      //     data: graphData.yData.map(h =>h.migikosi.y),
      //     borderColor: 'rgb(255, 165, 0)',
      //     backgroundColor: 'rgba(255, 99, 132, 0.5)',
      //     hidden: true,
      //   },
      //   {
      //     label: '左膝',
      //     data: graphData.yData.map(i =>i.hidarihiza.y),
      //     borderColor: 'rgb(128,0,0)',
      //     backgroundColor: 'rgba(255, 99, 132, 0.5)',
      //     hidden: true,
      //   },
      //   {
      //     label: '右膝',
      //     data: graphData.yData.map(j =>j.migihiza.y),
      //     borderColor: 'rgb(148,0,211)',
      //     backgroundColor: 'rgba(255, 99, 132, 0.5)',
      //     hidden: true,
      //   },
      //   {
      //     label: '左つま先',
      //     data: graphData.yData.map(k =>k.hidaritumasaki.y),
      //     borderColor: 'rgb(102,204,255)',
      //     backgroundColor: 'rgba(255, 99, 132, 0.5)',
      //     hidden: true,
      //   },
      //   {
      //     label: '右つま先',
      //     data: graphData.yData.map(l =>l.migitumasaki.y),
      //     borderColor: 'rgb(204,255,102)',
      //     backgroundColor: 'rgba(255, 99, 132, 0.5)',
      //     hidden: true,
      //   },
      // ],
    };
  
    return (
        <div>
          <Line options={options} data={data} />
        </div>
      )
  }