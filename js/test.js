let currentCheckIndex = 0; // 現在のチェック項目インデックス

// const voices = speechSynthesis.getVoices();
// const selectedVoice = voices.find(voice => voice.name.includes("O-Ren"));
function isNumeric(value) {
  return /^-?\d+(\.\d+)?$/.test(value);
}

// 点検項目定義
const checkList ={
  0:{name:'全長',category:"外装採寸測定"},
  1:{name:'全幅',category:"外装採寸測定"},
  2:{name:'全高',category:"外装採寸測定"},
  3:{name:'ホイールベース',category:"外装採寸測定"},
  4:{name:'トレッド',category:"外装採寸測定"},
  5:{name:'フロントドア開口幅',category:"ドア・開口部"},
  6:{name:'フロントドア開口高さ',category:"ドア・開口部"},
  7:{name:'リアドア開口幅',category:"ドア・開口部"},
  8:{name:'リアドア開口高さ',category:"ドア・開口部"},
  9:{name:'トランク開口幅',category:"ドア・開口部"},
  10:{name:'フレーム幅', category:"シャーシ関連"},
  11:{name:'フレーム高さ', category:"シャーシ関連"},
  12:{name:'アクスル間距離', category:"シャーシ関連"},
  13:{name:'サスペンション取付幅', category:"シャーシ関連"},
  14:{name:'サンルーフ開口寸法', category:"シャーシ関連"},
}
document.getElementById("bunbo").innerHTML = Object.keys(checkList).length

function scroll(targetId) {
  // 新しい項目を強調
  const targetElement = document.getElementById(targetId);
  if (targetElement) {
    // 画面の中央にスクロール
    targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

// アコーディオンを開閉する関数
function openAccordionGroup(groupId) {
  // すべての大項目のアコーディオンを閉じる
  document.querySelectorAll(".accordion-collapse").forEach((item) => {
    let bsCollapse = new bootstrap.Collapse(item, { toggle: false });
    bsCollapse.hide(); // 閉じる
  });

  // 指定されたアコーディオンを開く
  let targetAccordion = document.getElementById(groupId);
  let bsCollapse = new bootstrap.Collapse(targetAccordion, { toggle: false });
  bsCollapse.show();
}

// 音声を読み上げる関数
async function say (text) {
  return new Promise((resolve) => {
    const play_option = new SpeechSynthesisUtterance()
    play_option.text = text
    play_option.lang = 'ja-JP';
    play_option.pitch = 1.2; // ピッチ (0 ～ 2, 通常 1.0)
    const voices = speechSynthesis.getVoices();
    const selectedVoice = voices.find(voice => voice.name.includes("O-Ren"));

    if (selectedVoice) {
      play_option.voice = selectedVoice;
    }
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    window.speechSynthesis.speak(play_option)
    // 読み上げ完了時に実行する処理
    play_option.onend = () => {
      console.log('読み上げが完了しました。');
      resolve()
    };
  })
}


// 音声認識インスタンス作成
const createRecognition = (onResultCallback) => {
  const SpeechRecognition = window.SpeechRecognition || webkitSpeechRecognition
  const recognition = new SpeechRecognition()
  recognition.lang = 'ja-JP'
  recognition.continuous=true
  recognition.onresult = onResultCallback;

  recognition.error = (event) => console.log('エラーが発生しました。', event.error)
  recognition.onaudiostart = () => console.log('録音が開始されました。')
  recognition.onend = () => console.log('音声認識が終了しました!')
  recognition.onnomatch = () => console.log('認識できませんでした。')
  return recognition;
}

// メイン音声認識
const recognition = createRecognition((event) => {
  console.log("-----onresult-----")
  for (let i = event.resultIndex; i < event.results.length; i++) {
    let transcript = event.results[i][0].transcript;
    console.log("📢 認識結果: " + transcript);

    if(isNumeric(transcript)){
      document.getElementById(`inspection-input-${currentCheckIndex+1}`).value = transcript // 音声入力値を現在の項目に反映し表示
      // say(transcript)
      stopRecognition()
      .then(() => say(`${transcript} `)) // 数値入力時のみ復唱
      .then(() => setTimeout(() => recognition.start(), 300)); // 1秒後に音声認識を再開
    }

    if(transcript.includes('次')){
      console.log("^^^^次の項目へ^^^^")
      stopRecognition().then(nextCheck)
    }
    if(transcript.includes('NG')){
      console.log("^^^^問題点の報告へ^^^^")
      recognition.stop()
      // 読み上げ開始
      say("問題点の報告をしてください",()=>{
        console.log('音声認識を開始します')
        recognition.stop()
        recognition2.start()
      })

    }

  }
  console.log(event)
})

// 問題報告音声認識
const recognition2 = createRecognition((event) => {
  console.log("-----onresult2-----")

  for (let i = event.resultIndex; i < event.results.length; i++) {
    let transcript = event.results[i][0].transcript;
    console.log(event.results[i].isFinal)
    if(transcript.includes('完了')){
      console.log("^^^^問題点報告完了^^^^")
      recognition2.stop()
      currentCheckIndex++;
      if(currentCheckIndex < Object.keys(checkList).length){
        checkStart()
      }else{
        console.log('すべての点検が完了しました')
        say('すべての点検が完了しました',{})
      }
    }
  }
  console.log(event)
})

function stopRecognition(){
  return new Promise(function(resolve, reject){
    if(recognition){
      recognition.stop()
      recognition.onend = function (){
        console.log("🎤 音声認識が完全に停止しました");
        resolve()
      }
    }else{
      resolve()
    }

  })
}

// 🔹 次の点検項目へ進む
function nextCheck() {
  document.getElementById(`inspection${currentCheckIndex + 1}`).classList.remove("border-danger");

  currentCheckIndex++;
  if (currentCheckIndex < Object.keys(checkList).length) {
    document.getElementById("bunsi").innerHTML = currentCheckIndex
    let progressPercent = Math.round((currentCheckIndex / Object.keys(checkList).length) * 100);
    document.getElementById("parsent").innerHTML = progressPercent;
    document.getElementsByClassName("progress-bar")[0].style.width = `${progressPercent}%`;

    // **アコーディオンを開閉する**
    if (currentCheckIndex < 5) {
      openAccordionGroup("collapseGroupOne"); // 大項目Aを開く
    } else if (currentCheckIndex < 10) {
      openAccordionGroup("panelsStayOpen-collapseTwo"); // 大項目Bを開く
    } else {
      openAccordionGroup("panelsStayOpen-collapseThree"); // 大項目Cを開く
    }

    checkStart();
  } else {
    
    document.getElementById("bunsi").innerHTML = currentCheckIndex
    let progressPercent = Math.round((currentCheckIndex / Object.keys(checkList).length) * 100);
    document.getElementById("parsent").innerHTML = progressPercent;
    document.getElementsByClassName("progress-bar")[0].style.width = `${progressPercent}%`;
    console.log("🎉 すべての点検が完了しました");
    say("すべての点検が完了しました");
  }
}
// ここからロジック実装
function checkStart(){
  if (currentCheckIndex < Object.keys(checkList).length) {
    const currentItem = checkList[currentCheckIndex];
    console.log(`###${currentItem}を開始します###`)
    say(`${currentItem.name}`)
    .then(()=>{
      document.getElementById(`inspection${currentCheckIndex + 1}`).classList.add("border-danger");
      scroll(`inspection${currentCheckIndex + 1}`);
      recognition.start();
    });
  }else{
    console.log("点検完了")
  }
}


document.addEventListener("DOMContentLoaded", function() {
    // 実行したい処理
    currentCheckIndex = 0; // 初期化
    checkStart();
});
document.getElementById("check-start").addEventListener('click',()=>{
  currentCheckIndex = 0; // 初期化
  checkStart();
})