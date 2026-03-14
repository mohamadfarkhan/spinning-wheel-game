const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");

let data = [];
let winners = [];
const prizes = [
  "Advan Smartwatch S2 Pro Gold",
  "Deerma DX700",
  "Oppo Enco Air 2 Pro White",
];
let angle = 0;
let spinning = false;
let currentRotation = 0;
let currentWinnerIndex = null;
let currentWinnerName = null;

function addData() {
  let input = document.getElementById("dataInput");

  if (input.value.trim() != "") {
    data.push(input.value);
    input.value = "";
    drawWheel();
  }
}

function drawWheel() {
  ctx.clearRect(0, 0, 500, 500);

  if (data.length === 0) return;

  let arc = (2 * Math.PI) / data.length;

  const colors = ["#ff4d4d", "#ffd633", "#3399ff", "#33cc66", "#4dfff6"];

  data.forEach((item, i) => {
    let start = arc * i - Math.PI / 2;

    ctx.beginPath();
    ctx.moveTo(250, 250);
    ctx.arc(250, 250, 250, start, start + arc);
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();

    ctx.save();

    ctx.translate(250, 250);
    ctx.rotate(start + arc / 2);

    ctx.fillStyle = "#000";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    /* radius posisi text (lebih ke pinggir roda) */
    let textRadius = 240;

    /* ukuran font mengikuti besar segmen */
    let fontSize = Math.min(26, arc * 140);

    ctx.font = fontSize + "px Arial";

    ctx.fillText(item, textRadius, 0);

    ctx.restore();
  });
}

function spinWheel() {
  if (spinning || data.length == 0) return;

  spinning = true;

  let spinSound = document.getElementById("spinSound");

  spinSound.currentTime = 0;
  spinSound.loop = true;
  spinSound.play().catch(() => {});

  let spin = Math.random() * 5000 + 5000;

  angle += spin;

  animateSpin(spin);
}

function animateSpin(spin) {
  let start = performance.now();
  let duration = 5000;
  let lastTick = 0;

  function frame(time) {
    let progress = (time - start) / duration;

    if (progress > 1) progress = 1;

    let ease = 1 - Math.pow(1 - progress, 3);

    let current = ease * spin;

    currentRotation = angle - spin + current;

    canvas.style.transform = `rotate(${currentRotation}deg)`;

    let tick = Math.floor((angle - spin + current) / 20);

    if (tick !== lastTick) {
      let sound = document.getElementById("tickSound");

      sound.currentTime = 0;
      sound.play().catch(() => {});

      lastTick = tick;
    }

    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      spinning = false;

      let spinSound = document.getElementById("spinSound");
      spinSound.pause();
      spinSound.currentTime = 0;

      showWinner();
    }
  }

  requestAnimationFrame(frame);
}

function showWinner() {
  if (data.length === 0) return;

  let arc = 360 / data.length;

  /* normalisasi rotasi roda */
  let normalizedRotation = ((currentRotation % 360) + 360) % 360;

  /* sudut yang berada di pointer */
  let winningAngle = (360 - normalizedRotation) % 360;

  /* cari index segmen */
  let index = Math.floor(winningAngle / arc);

  let winner = data[index];

  /* simpan sementara */
  currentWinnerIndex = index;
  currentWinnerName = winner;

  let prizeIndex = winners.length;

  let prizeText = "";

  if (prizeIndex < prizes.length) {
    prizeText = "Hadiah: " + prizes[prizeIndex];
  } else {
    prizeText = "TERIMAKASIH ATAS PARTISIPASINYA :)";
  }

  document.getElementById("winnerName").innerText = winner;
  document.getElementById("winnerPrize").innerText = prizeText;

  let modal = new bootstrap.Modal(document.getElementById("winnerModal"));
  modal.show();

  document.getElementById("winSound").play();

  launchConfetti();
}

function launchConfetti() {
  confetti({
    particleCount: 200,
    spread: 120,
    origin: { y: 0.6 },
  });
}

function addWinnerToList(name) {
  let list = document.getElementById("winnerList");

  let item = document.createElement("li");

  let prizeIndex = winners.length - 1;

  let prizeText = "";

  if (prizeIndex < prizes.length) {
    prizeText = " - " + prizes[prizeIndex];
  }

  item.className = "list-group-item";

  item.innerText = name + prizeText;

  list.appendChild(item);
}

function exportWinner() {
  let sheet = XLSX.utils.json_to_sheet(winners.map((w) => ({ Winner: w })));

  let book = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(book, sheet, "Winners");

  XLSX.writeFile(book, "pemenang.xlsx");
}

document.getElementById("excelFile").addEventListener("change", function (e) {
  let file = e.target.files[0];

  let reader = new FileReader();

  reader.onload = function (evt) {
    let dataExcel = new Uint8Array(evt.target.result);

    let workbook = XLSX.read(dataExcel, { type: "array" });

    let sheet = workbook.Sheets[workbook.SheetNames[0]];

    let json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    data = []; // reset roda

    json.forEach((row, index) => {
      if (index === 0) return; // skip header

      if (row[0]) {
        data.push(row[0].toString().trim());
      }
    });

    drawWheel();
  };

  reader.readAsArrayBuffer(file);
});

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

document.addEventListener("fullscreenchange", function () {
  const panel = document.getElementById("controlPanel");
  if (document.fullscreenElement) {
    panel.classList.remove("show-panel");
    panel.classList.add("hide-panel");
  } else {
    panel.classList.remove("hide-panel");
    panel.classList.add("show-panel");
  }

  const wheel = document.getElementById("wheelWrapper");

  if (document.fullscreenElement) {
    wheel.classList.add("fullscreen-wheel");
  } else {
    wheel.classList.remove("fullscreen-wheel");
  }
});

function closeWinnerModal() {
  if (currentWinnerIndex !== null) {
    winners.push(currentWinnerName);

    addWinnerToList(currentWinnerName);

    data.splice(currentWinnerIndex, 1);

    drawWheel();

    currentWinnerIndex = null;
    currentWinnerName = null;
  }

  let modalElement = document.getElementById("winnerModal");
  let modal = bootstrap.Modal.getInstance(modalElement);
  modal.hide();
}
