function loop() {
  ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  let startTime = performance.now();
  poseLandmarker.current.detectForVideo(
    webcam.current.video,
    startTime,
    (result) => {
      ctxRef.current.fillStyle = "black";
      ctxRef.current.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      for (const landmark of result.landmarks) {
        drawingUtils.current.drawLandmarks(landmark, {
          radius: (data) => DrawingUtils.lerp(data.from.z, -0.15, 0.1, 5, 1),
        });
        drawingUtils.current.drawConnectors(
          landmark,
          PoseLandmarker.POSE_CONNECTIONS
        );
      }


    }
  );
  requestAnimationFrame(loop);
}

import "./App.scss";
import Webcam from "react-webcam";
import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
PoseLandmarker,
FilesetResolver,
DrawingUtils,
} from "@mediapipe/tasks-vision";
import Graph1 from './Graph1';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';


function App() {
const webcam = useRef();
const [detectFlag, setDetectFlag] = useState(false);
const poseLandmarker = useRef();
const drawingUtils = useRef();
const canvasRef = useRef();
const ctxRef = useRef();
const [cameraOK, setCameraOK] = useState(false);
const [settingOK, setSettingOK] = useState(false);
const [con,setCon] = useState([]);
//const [clickOK, setClickOK] = useState(false);
let count = 0;

useEffect(() => {
  const createPoseLandmarker = async () => {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );
    poseLandmarker.current = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "models/pose_landmarker_lite.task",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numPoses: 2,
    });
    setSettingOK(true);
  };
  createPoseLandmarker();




}, []);


// 取得したい骨格点のインデックスを配列で指定
const targetLandmarkIndices = [
  {index: 13, name: "hidarihiji"},
  {index: 14, name: "migihiji"}
]; // 例：鼻、左肩、左腰のインデックス
const windowSize = 5; // 移動平均を計算するためのウィンドウサイズ


// 過去の座標データを保持するための配列
const pastCoordinates = targetLandmarkIndices.map(() => []);


function calculateMovingAverage(coords) {
const sum = coords.reduce((acc, coord) => {
  acc.x += coord.x;
  acc.y += coord.y;
  acc.z += coord.z;
  return acc;
}, { x: 0, y: 0, z: 0 });
const count = coords.length;
return {
  x: sum.x / count,
  y: sum.y / count,
  z: sum.z / count,
};
}


function loop() {
ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
let startTime = performance.now();
poseLandmarker.current.detectForVideo(
  webcam.current.video,
  startTime,
  (result) => {
    ctxRef.current.fillStyle = "black";
    ctxRef.current.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);


    // キャンバスの幅と高さ
    const canvasWidth = canvasRef.current.width;
    const canvasHeight = canvasRef.current.height;


    // if文でresult.landmarksが存在し、かつ空でないことを確認
    if (result.landmarks && result.landmarks.length > 0) {
      for (const landmarks of result.landmarks) {
        const kokaku = {}
        // 指定した骨格点の座標を処理
        targetLandmarkIndices.forEach((index, i) => {
          const point = landmarks[index.index];
          if (point) {
            // 新しい座標を追加
            pastCoordinates[i].push(point);
            // ウィンドウサイズを超えた場合は古い座標を削除
            if (pastCoordinates[i].length > windowSize) {
              pastCoordinates[i].shift();
            }


            // 移動平均を計算
            const movingAverage = calculateMovingAverage(pastCoordinates[i]);


            // 移動平均の相対座標をコンソールに出力
            //console.log(`Landmark ${index} Moving Average (Relative): (x: ${movingAverage.x}, y: ${movingAverage.y}, z: ${movingAverage.z})`);
            /*if(count%6==0){
            console.log(movingAverage.y);
            setCon((c) => [...c,movingAverage.y])
            }
            count++;*/
            kokaku[index.name] = movingAverage;


            // 必要に応じて絶対座標に変換してコンソールに出力
            const absoluteX = movingAverage.x * canvasWidth;
            const absoluteY = movingAverage.y * canvasHeight;
            //console.log(`Landmark ${index} Moving Average (Absolute): (x: ${absoluteX}, y: ${absoluteY}, z: ${movingAverage.z})`);
          }
        });
        if(count%6==0){
          console.log(kokaku);
          setCon((c) => [...c,kokaku])
          }
          count++;


        // ランドマークを描画
        drawingUtils.current.drawLandmarks(landmarks, {
          radius: (data) => DrawingUtils.lerp(data.from.z, -0.15, 0.1, 5, 1),
        });
        drawingUtils.current.drawConnectors(
          landmarks,
          PoseLandmarker.POSE_CONNECTIONS
        );
      }
    }
  }
);
requestAnimationFrame(loop);
}


useEffect(() => {
  if (detectFlag) {
    canvasRef.current.width = webcam.current.video.clientWidth;
    canvasRef.current.height = webcam.current.video.clientHeight;
    ctxRef.current = canvasRef.current.getContext("2d");
    drawingUtils.current = new DrawingUtils(ctxRef.current);
    loop();
  }
}, [detectFlag]);



return (
  <div>
    <div className="position-relative">
      <Webcam
        style={{
          width: "100%",
          maxWidth: "500px",
          //visibility: "hidden"
        }}
        audio={false}
        ref={webcam}
        videoConstraints={{
          facingMode: "user",
          //facingMode: {exact: "environment"},
        }}
        onUserMedia={() => {
          setCameraOK(true)
        }}
      />
      <canvas
        className="position-absolute top-0 start-0"
        ref={canvasRef}


        />
    </div>
    <Container fluid hidden={detectFlag}>
      <div>
        <Button
        onClick={() => setDetectFlag(true)}
        disabled={!(cameraOK && settingOK)}
        >姿勢検出!!!!
        </Button>
      </div>
    </Container>
    <div className="App">

    <h2>Graph 1</h2>
    <Graph1 ydata={con}/>

    </div>

    <div>
    <InputGroup>
    <InputGroup.Text>骨格点</InputGroup.Text>
    <Form.Select aria-label="Default select example">
      <option>骨格点の選択</option>
      <option value="hidarihiji">左肘</option>
      <option value="migihiji">右肘</option>
    </Form.Select>
    </InputGroup>
    </div>
  </div>
);
}


export default App;






