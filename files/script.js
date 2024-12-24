// 讀取指定名稱的 cookie
function readCookie(name) {
    const value = `; ${document.cookie}`; // 為了處理 cookie，添加分號
    console.log('Current cookies:', document.cookie); // Debug log，顯示當前 cookie
    const parts = value.split(`; ${name}=`); // 根據 cookie 名稱拆分
    return parts.length === 2 ? parts.pop().split(';').shift() : null; // 返回 cookie 值，或返回 null
}

// 設置 cookie
function setCookie(name, value, days) {
    const expires = `expires=${new Date(Date.now() + days * 864e5).toUTCString()}`;
    document.cookie = `${name}=${encodeURIComponent(value)}; ${expires}; path=/`;
    console.log(`Cookie set: ${name}=${value}`); // 檢查設置的 cookie
}

// 初始化 textarea 的內容
function initializeContent() {
    const savedContent = readCookie("savedContent");
    inputContent.value = savedContent ? decodeURIComponent(savedContent) : DEFAULT_CONTENT;
}

// 儲存 textarea 的內容到 cookie
function saveContent() {
    setCookie("savedContent", inputContent.value, 3650); // 儲存 cookie，有效期 3650 天
    alert("內容已儲存!"); // 提示用戶內容已儲存
}

// 讀取 cookie 中的內容並顯示在 textarea 中
function loadContent() {
    reset();
    const savedContent = readCookie("savedContent");
    if (savedContent) {
        inputContent.value = decodeURIComponent(savedContent);
        alert("內容已讀取!"); // 提示用戶內容已讀取
    } else {
        alert("沒有找到儲存的內容!"); // 如果沒有找到，則顯示提示
    }
    updateWheelSegments();
    renderWheel();
}

// 用戶資料輸入
var inputContent = document.querySelector("#inputContent");
var spinSpeedInput = document.querySelector("#customSpinSpeed");
var isBatchMode = true;
const DEFAULT_CONTENT = "1\n2\n3\n4\n5\n6";
const displayResultElement = document.querySelector("#resultDisplay");
const prizeRecordTable = document.querySelector("#recordList");

let autoDrawTime = 0;
let wheelSegments = []; // 將 segments 定義為全局變量

// 更新轉盤的選項
function updateWheelSegments() {
    wheelSegments = inputContent.value.split('\n').filter(segment => segment.trim() !== ""); // 更新全局的 segments
    if (wheelSegments.length === 0) {
        wheelSegments = ["#"];
    }
}

// 初始化轉盤內容
function initializeWheelContent() {
    spinSpeedMultiplier = (0.9 + spinSpeedInput.value);
    inputContent.value = DEFAULT_CONTENT;
    prizeRecordTable.innerHTML = ``;
    displayResultElement.textContent = "#";
    updateWheelSegments();
}

// 監聽用戶輸入事件
inputContent.addEventListener("keyup", () => {
    updateWheelSegments();
    renderWheel();
});
spinSpeedInput.addEventListener("change", () => {
    spinSpeedMultiplier = (0.9 + spinSpeedInput.value);
    console.log(spinSpeedMultiplier);
});

// 轉盤區
const wheelCanvas = document.getElementById("wheelCanvas");
const wheelContext = wheelCanvas.getContext("2d");
const segmentColors = ["#FFB6C1", "#8A2BE2", "#3CB371", "#FFD700", "#FF4500", "#1E90FF"];

// 渲染轉盤
function renderWheel() {
    wheelContext.clearRect(0, 0, wheelCanvas.width, wheelCanvas.height);
    const centerX = wheelCanvas.width / 2;
    const centerY = wheelCanvas.height / 2;
    const radius = 200;

    const numSegments = wheelSegments.length; // 在這裡獲取 numSegments
    const segmentAngle = (2 * Math.PI) / numSegments;

    for (let i = 0; i < numSegments; i++) {
        wheelContext.beginPath();
        wheelContext.moveTo(centerX, centerY);
        wheelContext.arc(centerX, centerY, radius, segmentAngle * i + rotationAngle, segmentAngle * (i + 1) + rotationAngle);
        wheelContext.closePath();
        wheelContext.fillStyle = segmentColors[i % segmentColors.length]; // 確保顏色數量不會出錯
        wheelContext.fill();

        // 標記每個區塊的文字
        wheelContext.save();
        wheelContext.translate(centerX, centerY);
        wheelContext.rotate(segmentAngle * i + rotationAngle + segmentAngle / 2);
        wheelContext.textAlign = "center";
        wheelContext.fillStyle = "#000";
        wheelContext.font = "24px Arial";
        wheelContext.fillText(wheelSegments[i], radius * 0.65, 10);
        wheelContext.restore();
    }

    // 繪製指針
    wheelContext.fillStyle = 'red';
    wheelContext.beginPath();
    wheelContext.moveTo(420, 252); // 頂端點
    wheelContext.lineTo(464, 242); // 左上角
    wheelContext.lineTo(464, 262); // 左下角
    wheelContext.fill();
}

// 開始旋轉
let rotationAngle = 0;
let currentSpinSpeed = 0;

// 音效配置
const SOUNDS = {
    tick: new Audio('//cdnjs.cloudflare.com/ajax/libs/blockly/1.0.0/media/disconnect.mp3'),
    bell: new Audio('//cdnjs.cloudflare.com/ajax/libs/ion-sound/3.0.7/sounds/bell_ring.mp3')
};

// 確保 tick 聲音循環播放
SOUNDS.tick.loop = false;
SOUNDS.tick.volume = 1; // 調整音量
SOUNDS.bell.volume = 0.15; // 調整音量

// 開始旋轉轉盤
function startWheelSpin() {
    currentSpinSpeed = Math.random() * 0.3 + 0.2; // 設置初始旋轉速度
    animateRotation();
}

// 旋轉動畫
let lastSegmentIndex = -1;

function animateRotation() {
    rotationAngle += currentSpinSpeed;
    currentSpinSpeed *= spinSpeedMultiplier; // 逐漸減速

    const numSegments = wheelSegments.length;
    const segmentAngle = (2 * Math.PI) / numSegments;
    const currentSegmentIndex = Math.floor((rotationAngle % (2 * Math.PI)) / segmentAngle);

    if (currentSegmentIndex !== lastSegmentIndex) {
        SOUNDS.tick.currentTime = 0; // 重置音效播放時間
        SOUNDS.tick.play(); // 播放經過每個區塊時的音效
        lastSegmentIndex = currentSegmentIndex;
    }

    if (currentSpinSpeed < 0.001) { // 停止條件
        currentSpinSpeed = 0;
        SOUNDS.bell.play(); // 播放結束音效
        showSpinResult();
    } else {
        requestAnimationFrame(animateRotation);
    }
    renderWheel();
}

// 記錄區
function recordPrize() {
    var checkbox = document.getElementById('auto-record');

    if (checkbox.checked) {
        const newRow = document.createElement("tr");
        newRow.innerHTML = `<th>${prizeRecordTable.children.length + 1}.</th><td>${displayResultElement.textContent}</td>`;

        // 插入到表格的第一個子節點之前
        const firstChild = prizeRecordTable.firstChild; // 獲取第一個子節點
        prizeRecordTable.insertBefore(newRow, firstChild);

        console.log(prizeRecordTable.innerHTML);
    }
}

// 顯示結果
function showSpinResult() {
    if (wheelSegments[0] != "#") {
        const numSegments = wheelSegments.length; // 獲取段數
        const winningSegmentIndex = Math.floor((numSegments - (rotationAngle % (2 * Math.PI)) / (2 * Math.PI / numSegments)) % numSegments);
        displayResultElement.textContent = wheelSegments[winningSegmentIndex];
        recordPrize();
        autoRemove();
    } else {
        displayResultElement.textContent = "請輸入選項";
    }
    if (document.getElementById("auto-draw").checked & wheelSegments.length > 0) {
        start();
    }
    updateWheelSegments();
}

// 批量生成數字
function batch() {
    if (isBatchMode) {
        inputContent.value = ""; // 如果處於批量模式，清空內容
    }
    isBatchMode = false; // 退出批量模式

    // 獲取用戶輸入的起始和結束數字
    const start = parseInt(document.querySelector("#start").value);
    const end = parseInt(document.querySelector("#end").value);

    // 驗證輸入的數字
    if (isNaN(start) || isNaN(end)) {
        alert("請輸入有效的數字！"); // 提示用戶輸入有效數字
        return; // 退出函數
    }

    // 從起始數字到結束數字進行迴圈
    for (let i = start; i <= end; i++) {
        inputContent.value += `${i}\n`; // 使用 \n 來進行換行
    }
}

// 自動刪除
function autoRemove() {
    var checkbox = document.getElementById('auto-content-remove');

    if (checkbox.checked) {
        const numSegments = wheelSegments.length;
        const winningSegmentIndex = Math.floor((numSegments - (rotationAngle % (2 * Math.PI)) / (2 * Math.PI / numSegments)) % numSegments);
        
        // 刪除贏得的區段
        wheelSegments.splice(winningSegmentIndex, 1); // 從 wheelSegments 中刪除該段
        inputContent.value = wheelSegments.join('\n'); // 更新 inputContent 的值

        // 重新渲染轉盤
        renderWheel();
    }
}

// Console
function start() {
    if(wheelSegments.length != 0){
        startWheelSpin();
    }
}

function reset() {
    initializeWheelContent();
    renderWheel();
}

// 初始化轉盤
initializeWheelContent();
initializeContent();
updateWheelSegments();
renderWheel();