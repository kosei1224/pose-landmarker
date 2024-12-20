import React, { useState, useEffect, useRef } from "react";
import "./App.scss";
import Webcam from "react-webcam";
import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";
import { InputGroup, Form } from "react-bootstrap";
import {
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "@mediapipe/tasks-vision";
import Graph1 from "./Graph1";
//import { averageReferenceData, calculateDifferences } from "./utils"; // 角度計算や差異計算のユーティリティ関数

const targetLandmarkIndex = [
  { index: 11, name: "hidarikata" },
  { index: 12, name: "migikata" },
  { index: 13, name: "hidarihiji" },
  { index: 14, name: "migihiji" },
  { index: 15, name: "hidaritekubi" },
  { index: 16, name: "migitekubi" },
  { index: 23, name: "hidarikosi" },
  { index: 24, name: "migikosi" },
  { index: 25, name: "hidarihiza" },
  { index: 26, name: "migihiza" },
  { index: 31, name: "hidaritumasaki" },
  { index: 32, name: "migitumasaki" },
];

const weight = {
  hidarikata: 1,
  migikata: 1,
  hidarihiji: 0.4,
  migihiji: 0.4,
  hidaritekubi: 0.2,
  migitekubi: 0.4,
  hidarikosi: 1,
  migikosi: 1,
  hidarihiza: 1,
  migihiza: 1,
  hidaritumasaki: 0.5,
  migitumasaki: 0.5,
};

function App() {
  const webcam = useRef();
  const [detectFlag, setDetectFlag] = useState(false);
  const poseLandmarker = useRef();
  const drawingUtils = useRef();
  const canvasRef = useRef();
  const ctxRef = useRef();
  const [cameraOK, setCameraOK] = useState(false);
  const [settingOK, setSettingOK] = useState(false);
  const [con, setCon] = useState([]);
  const [scoreComparison, setScoreComparison] = useState(null);
  const [hyou, setHyou] = useState(["", ""]); // hyouのstateを追加、選択されていない初期値は空文字
  const referenceData = useRef({ 100: [] });
  //const shootingData = [];
  const [kaisi, setKaisi] = useState(false);
  const [hituyou, setHituyou] = useState(0);
  const [hoji, setHoji] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const countRef = useRef(0); // 読み込みカウンター用の useRef
  const frameCount = useRef(0); // フレーム数を追跡するための count
  const startButtonRef = useRef();

  // 100点データを読み込む
  useEffect(() => {
    [1, 2, 3, 4, 5].forEach((i) => {
      fetch(`${import.meta.env.BASE_URL}100/${i}.json`)
        .then((res) => res.json())
        .then((data) => {
          referenceData.current[100][i - 1] = data;
          countRef.current++;
          if (countRef.current === 5) {
            setSettingOK(true);
          }
        })
        .catch((err) =>
          console.error("100点データの読み込みに失敗しました:", err)
        );
    });
  }, []); // 最初のロード時だけ実行

  useEffect(() => {
    if (!kaisi) return;
    setHituyou(referenceData.current[100][4].length);
    setHoji(con.length);
    console.log(referenceData.current);
  }, [kaisi]);

  useEffect(() => {
    if (!kaisi || hituyou == 0 || hoji == 0) return;
    //console.log(con.length)
    //console.log(hoji+hituyou)
    if (con.length > hoji + hituyou) {
      setKaisi(false);
      const k = con.slice(hoji + 1, hoji + 1 + hituyou);
      const { similarityScore, differences, sigmoid_scores } =
        calculateSimilarity(k, referenceData.current[100]);
      setScoreComparison({ similarityScore, differences, sigmoid_scores });
    }
  }, [con]);
  // PoseLandmarkerの初期化
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
    };
    createPoseLandmarker();
  }, []); // 最初のロード時だけ実行

  // XXX : たぶんだけどこの計算だと類似度は出ないと思うよ。
  // そもそもcurrentDataと referenceData の形式が違うんじゃないかな？
  // 一回 console.log で出してみよう。
  //
  // 類似度計算関数

  function calculateSimilarity(currentData, referenceFrames) {
    //console.log("currentData", currentData);
    //console.log("referenceData", referenceFrames[0]);
    const differences = {};
    let localScore = 0;
    Object.keys(currentData[0]).forEach((e) => {
      differences[e] = 0;
    });
    for (let i = 0; i < hituyou; i++) {
      Object.keys(currentData[0]).forEach((a) => {
        // 初期化: 部位ごとの差異を保持する変数をリセット
        let squaredDifferenceSum = 0;
        let numDimensions = 3; // x, y, z の3次元

        // x, y, z の差異を2乗して合計
        squaredDifferenceSum += Math.pow(
          currentData[i][a].x - referenceFrames[4][i][a].x,
          2
        );
        squaredDifferenceSum += Math.pow(
          currentData[i][a].y - referenceFrames[4][i][a].y,
          2
        );
        squaredDifferenceSum += Math.pow(
          currentData[i][a].z - referenceFrames[4][i][a].z,
          2
        );

        // 平均を取る（ここでは次元数3で割る）
        const rmsd = Math.sqrt(squaredDifferenceSum / numDimensions);
        //console.log(`部位: ${a}, フレーム: ${i}, RMSD: ${rmsd}`);
        // 部位ごとのRMSEをdifferencesに追加
        if (!differences[a] || rmsd < differences[a]) {
          differences[a] += rmsd;
        }
      });
    }
    //console.log(differences);
    //const averagedReferenceData = averageReferenceData(referenceFrames); // referenceFramesを平均化
    //const differences = calculateDifferences(averagedReferenceData, currentData);
    const sigmoid_scores = {};
    Object.entries(differences).map(([key, value]) => {
      const a = weight[key];
      console.log(a);
      const sigmoid = (x, a) => 10 / (1 + Math.exp(a * x - 5));
      const score = Math.round(sigmoid(value, a));
      sigmoid_scores[key] = score;
      localScore += score;
      console.log(`RMSD: ${value}, Sigmoidスコア: ${score}`);
    });
    // Object.values(differences).forEach((rmsd, i) => {
    //   const sigmoid = (x) => 10 / (1 + Math.exp(x - 5));
    //   // const sigmoid = 1/(1+Math.exp(rmsd-5));
    //   let score = sigmoid(rmsd);

    //   score = Math.round(score);
    //   // new_scores.differences[i][1].sigmoid = score;

    //   localScore += score;
    //   console.log(`RMSD: ${rmsd}, Sigmoidスコア: ${score}`);
    //   console.log(sigmoid);
    // });

    // const totalScore = Math.min(localScore, 10);
    console.log(`最終スコア: ${localScore}`);

    setTotalScore(localScore);
    return { totalScore: totalScore, differences, sigmoid_scores };
  }

  const windowSize = 5;
  const pastCoordinates = targetLandmarkIndex.map(() => []);

  // ループ処理

  function loop() {
    if (!detectFlag || !ctxRef.current) return; // detectFlagがfalseのときはループを停止

    console.log("cameraOK:", cameraOK);
    console.log("settingOK:", settingOK);

    ctxRef.current.clearRect(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );
    let startTime = performance.now();
    poseLandmarker.current.detectForVideo(
      webcam.current.video,
      startTime,
      (result) => {
        ctxRef.current.fillStyle = "black";
        ctxRef.current.fillRect(
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );

        if (result.landmarks && result.landmarks.length > 0) {
          const currentData = [];
          for (const landmarks of result.landmarks) {
            const kokaku = {};
            targetLandmarkIndex.forEach((index, i) => {
              const point = landmarks[index.index];
              if (point) {
                if (pastCoordinates[i].length > windowSize) {
                  pastCoordinates[i].shift();
                }
                kokaku[index.name] = { x: point.x, y: point.y, z: point.z };
              }
            });
            currentData.push(kokaku);

            // XXX : ↓の中括弧はここじゃない。もっと下に書く。
            // GitHubの(動いてるほうの)コードとよく見比べよう。
            // setCon も、類似度スコア更新も、フレーム数インクリメントも
            // この for 文の中になければならない。
            // ← これを消す

            // 現在のデータと前のデータが異なる場合のみ状態更新
            setCon((prevCon) => {
              if (JSON.stringify(prevCon) !== JSON.stringify(...currentData)) {
                // XXX : currentData → ...currentData
                // なぜなら、currentDataは配列だから。
                // このままだと長さ1とか2とかの配列がどんどこ入ってしまう
                return [...prevCon, ...currentData];
              }
              return prevCon;
            });
            // 類似度スコア更新 (例えばフレームごとに1回だけ更新する)
            if (referenceData.current && frameCount.current % 6 === 0) {
            }
            frameCount.current++; // フレーム数をインクリメント

            // XXX : 以下のコードが足りない (元コードにはあったやろ...？)
            drawingUtils.current.drawLandmarks(landmarks, {
              radius: (data) =>
                DrawingUtils.lerp(data.from.z, -0.15, 0.1, 5, 1),
            });
            drawingUtils.current.drawConnectors(
              landmarks,
              PoseLandmarker.POSE_CONNECTIONS
            );

            // XXX : 上で消した中括弧の正しい位置はここ。
          } // ← これをコメント外して有効にする
        }
      }
    );

    if (detectFlag) requestAnimationFrame(loop); // 次のフレームを呼び出し
  }

  function zeroume(z) {
    return ("0" + z).slice(-2);
  }

  // detectFlagが変わったときにループを開始
  useEffect(() => {
    if (
      detectFlag &&
      poseLandmarker.current &&
      webcam.current.video.readyState === 4
    ) {
      if (canvasRef.current) {
        canvasRef.current.width = webcam.current.video.clientWidth;
        canvasRef.current.height = webcam.current.video.clientHeight;
        ctxRef.current = canvasRef.current.getContext("2d");
        drawingUtils.current = new DrawingUtils(ctxRef.current);
      }
      loop();
    }
  }, [detectFlag, poseLandmarker]);

  const handleStartDetection = () => {
    if (cameraOK && settingOK) {
      setDetectFlag(true); // カメラが準備できたらdetectFlagをtrueに設定
    } else {
      alert("カメラまたは設定が準備できていません。");
    }
  };

  const adviceData = {
    hidarikata: "左肩のやる気がない！見直せ！！",
    migikata: "右肩のやる気がない！見直せ！！",
    hidarihiji: "左肘のやる気がない！見直せ！！",
    migihiji: "右肘のやる気がない！見直せ！！",
    hidaritekubi: "左手首のやる気がない！見直せ！！",
    migitekubi: "右手首のやる気がない！見直せ！！",
    hidarikosi: "左腰のやる気がない！見直せ！！",
    migikosi: "右腰のやる気がない！見直せ！！",
    hidarihiza: "左膝のやる気がない！見直せ！！",
    migihiza: "右膝のやる気がない！見直せ！！",
    hidaritumasaki: "左つま先のやる気がない！見直せ！！",
    migitumasaki: "右つま先のやる気がない！見直せ！！",
  };

  /*const adviceData = {
  hidarikata: "左肩秀",
  migikata: "右肩秀",
  hidarihiji: "左肘秀",
  migihiji: "右肩秀",
  hidaritekubi: "左手首秀",
  migitekubi: "右手首秀",
  hidarikosi: "左腰秀",
  migikosi: "右肩秀",
  hidarihiza: "左膝秀",
  migihiza: "右膝秀",
  hidaritumasaki: "左つま先秀",
  migitumasaki: "右つま先秀",
};*/

  return (
    <div>
      <div className="position-relative">
        <Webcam
          style={{
            width: "100%",
            maxWidth: "500px",
          }}
          audio={false}
          ref={webcam}
          videoConstraints={{
            facingMode: "environment",
            //facingMode: "user",
          }}
          onUserMedia={() => {
            console.log("カメラが準備完了");
            setCameraOK(true);
          }}
        />
        <canvas className="canvas-overlay" ref={canvasRef} />
      </div>
      <Container fluid hidden={detectFlag} className="controls-container">
        <Button
          onClick={handleStartDetection}
          disabled={!(cameraOK && settingOK)}
        >
          姿勢検出開始
        </Button>
      </Container>

      <div className="App">
        {detectFlag && (
          <>
            <Button
              ref={startButtonRef}
              onClick={() => {
                setKaisi(true);
              }}
            >
              シュート開始
            </Button>
            <Button
              onClick={() => {
                const se1 = new Audio("./se/se1.mp3");
                const se2 = new Audio("./se/se2.mp3");
                setTimeout(() => {
                  startButtonRef.current.click();
                }, 7000);
                setTimeout(() => {
                  se2.play();
                }, 6700);
                setTimeout(() => {
                  se1.pause();
                  se1.currentTime = 0;
                  se1.play();
                }, 5900);
                setTimeout(() => {
                  se1.pause();
                  se1.currentTime = 0;
                  se1.play();
                }, 4900);
                setTimeout(() => {
                  se1.pause();
                  se1.currentTime = 0;
                  se1.play();
                }, 3900);
              }}
            >
              10秒後に開始
            </Button>
            <h2 style={{ fontSize: "24px", color: "#FFFFFF" }}>
              シュート評価点数: {totalScore}/120点
            </h2>
            <p style={{ fontSize: "18px", color: "#4CAF50" }}>アドバイス:</p>
            {scoreComparison?.differences && (
              <ul style={{ fontSize: "16px", color: "#000" }}>
                {Object.entries(scoreComparison.differences).map(
                  ([part, diff]) => (
                    <li
                      key={part}
                      style={{
                        fontSize: "16px",
                        color:
                          scoreComparison.sigmoid_scores[part] <= 5
                            ? "pink"
                            : "yellowgreen",
                      }}
                    >
                      {part}のシグモイドスコア:{" "}
                      {scoreComparison.sigmoid_scores[part]?.toFixed(2) ??
                        "値なし"}
                      {scoreComparison.sigmoid_scores[part] >= 8
                        ? " -> 秀"
                        : scoreComparison.sigmoid_scores[part] === 7
                        ? " -> 優"
                        : scoreComparison.sigmoid_scores[part] === 6
                        ? " -> 良"
                        : ` -> ${adviceData[part]}`}
                    </li>
                  )
                )}
              </ul>
            )}
            <h2>Graph 1</h2>
            <div style={{ maxWidth: "500px" }}>
              <InputGroup>
                <InputGroup.Text>骨格点</InputGroup.Text>
                <Form.Select
                  aria-label="Default select example"
                  onChange={(e) => {
                    setHyou((h) => [e.target.value, h[1]]);
                  }}
                >
                  <option value={""}>骨格点の選択</option>
                  {[
                    { name: "左肩", id: "hidarikata" },
                    { name: "右肩", id: "migikata" },
                    { name: "左肘", id: "hidarihiji" },
                    { name: "右肘", id: "migihiji" },
                    { name: "左手首", id: "hidaritekubi" },
                    { name: "右手首", id: "migitekubi" },
                    { name: "左腰", id: "hidarikosi" },
                    { name: "右腰", id: "migikosi" },
                    { name: "左膝", id: "hidarihiza" },
                    { name: "右膝", id: "migihiza" },
                    { name: "左つま先", id: "hidaritumasaki" },
                    { name: "右つま先", id: "migitumasaki" },
                  ].map((s) => (
                    <option
                      key={`hidari-${s.id}`}
                      value={s.id}
                      disabled={hyou[1] === s.id}
                    >
                      {s.name}
                    </option>
                  ))}
                </Form.Select>
                <Form.Select
                  aria-label="Default select example"
                  onChange={(e) => {
                    setHyou((h) => [h[0], e.target.value]);
                  }}
                >
                  <option value={""}>骨格点の選択</option>
                  {[
                    { name: "左肩", id: "hidarikata" },
                    { name: "右肩", id: "migikata" },
                    { name: "左肘", id: "hidarihiji" },
                    { name: "右肘", id: "migihiji" },
                    { name: "左手首", id: "hidaritekubi" },
                    { name: "右手首", id: "migitekubi" },
                    { name: "左腰", id: "hidarikosi" },
                    { name: "右腰", id: "migikosi" },
                    { name: "左膝", id: "hidarihiza" },
                    { name: "右膝", id: "migihiza" },
                    { name: "左つま先", id: "hidaritumasaki" },
                    { name: "右つま先", id: "migitumasaki" },
                  ].map((s) => (
                    <option
                      key={`migi-${s.id}`}
                      value={s.id}
                      disabled={hyou[0] === s.id}
                    >
                      {s.name}
                    </option>
                  ))}
                </Form.Select>
                <Button
                  variant="success"
                  onClick={() => {
                    const hizuke = new Date();
                    const filename = `${hizuke.getFullYear()}${zeroume(
                      hizuke.getMonth() + 1
                    )}${zeroume(hizuke.getDate())}-${zeroume(
                      hizuke.getHours()
                    )}${zeroume(hizuke.getMinutes())}${zeroume(
                      hizuke.getSeconds()
                    )}`;
                    const blob = new Blob([JSON.stringify(con)], {
                      type: "application/json",
                    });
                    const url = (
                      window.URL || window.webkitURL
                    ).createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = filename;
                    a.click();
                    a.remove();
                  }}
                >
                  保存！！
                </Button>
              </InputGroup>
            </div>
            <Graph1 ydata={con} hyou={hyou} />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
