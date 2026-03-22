"use strict";

let isDark = false;

function setTheme(mode) {
  isDark = mode === "dark";
  document.body.classList.toggle("dark", isDark);
  document.getElementById("opt-light").classList.toggle("active", !isDark);
  document.getElementById("opt-dark").classList.toggle("active", isDark);
  updateChartTheme();
  finChart.update();
}

function getChartColors() {
  return isDark
    ? { gridColor: "rgba(255,255,255,0.05)", tickColor: "#475569" }
    : { gridColor: "rgba(0,0,0,0.06)", tickColor: "#64748b" };
}

function updateChartTheme() {
  const { gridColor, tickColor } = getChartColors();
  finChart.options.scales.x.ticks.color = tickColor;
  finChart.options.scales.y.ticks.color = tickColor;
  finChart.options.scales.y.grid.color = gridColor;
}

const CHART_DATA = {
  "1W": {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    income: [32000, 35000, 31000, 38000, 40000, 36000, 34000],
    expense: [24000, 26000, 23000, 28000, 30000, 27000, 25000],
  },
  "1M": {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    income: [55000, 62000, 58000, 65000],
    expense: [42000, 47000, 44000, 49000],
  },
  "6M": {
    labels: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
    income: [180000, 195000, 210000, 200000, 221000, 240000],
    expense: [150000, 155000, 162000, 158000, 174000, 180000],
  },
  "1Y": {
    labels: ["Apr","May","Jun", "Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb", "Mar",
    ],
    income: [
      160000, 165000, 170000, 172000, 175000, 178000, 180000, 195000, 210000,
      200000, 221000, 240000,
    ],
    expense: [
      130000, 132000, 138000, 140000, 143000, 147000, 150000, 155000, 162000,
      158000, 174000, 180000,
    ],
  },
};

const LINE_COLORS = {
  Income: "#2563eb",
  Expense: "#dc2626",
  "Net Margin": "#16a34a",
};

let curTime = "1W";
let curView = "all";

function getMargin(timeKey) {
  const { income, expense } = CHART_DATA[timeKey];
  return income.map((v, i) => v - expense[i]);
}

function buildDatasets() {
  const { income, expense } = CHART_DATA[curTime];
  const margin = getMargin(curTime);

  const base = {
    tension: 0.4,
    fill: true,
    pointRadius: 3,
    pointHoverRadius: 6,
    pointHoverBorderColor: "#fff",
    pointHoverBorderWidth: 2,
    borderWidth: 2,
  };

  const incomeDs = {
    ...base,
    label: "Income",
    data: income,
    borderColor: LINE_COLORS.Income,
    backgroundColor: "rgba(37,99,235,0.07)",
    pointBackgroundColor: LINE_COLORS.Income,
  };

  const expenseDs = {
    ...base,
    label: "Expense",
    data: expense,
    borderColor: LINE_COLORS.Expense,
    backgroundColor: "rgba(220,38,38,0.05)",
    pointBackgroundColor: LINE_COLORS.Expense,
  };

  const marginDs = {
    ...base,
    label: "Net Margin",
    data: margin,
    borderColor: LINE_COLORS["Net Margin"],
    backgroundColor: "rgba(22,163,74,0.07)",
    pointBackgroundColor: LINE_COLORS["Net Margin"],
  };

  const viewMap = {
    income: [incomeDs],
    expense: [expenseDs],
    margin: [marginDs],
    all: [incomeDs, expenseDs, marginDs],
  };

  return viewMap[curView];
}

function updateLegend() {
  document.getElementById("chart-legend").innerHTML = finChart.data.datasets
    .map(
      ({ label }) =>
        `<span style="display:flex;align-items:center;gap:5px">
        <span style="display:inline-block;width:12px;height:2px;background:${LINE_COLORS[label]};border-radius:2px"></span>
        <span style="font-size:11px;font-weight:600;color:${LINE_COLORS[label]}">${label}</span>
      </span>`,
    )
    .join("");
}

const crosshairPlugin = {
  id: "crosshair",

  afterEvent(chart, { event: e }) {
    if (e.type === "mousemove") {
      chart._crosshairX = e.x;
      chart.draw();
    } else if (e.type === "mouseout") {
      chart._crosshairX = null;
      chart.draw();
    }
  },

  afterDraw(chart) {
    const x = chart._crosshairX;
    if (!x) return;
    const { top, bottom, left, right } = chart.chartArea;
    if (x < left || x > right) return;
    const ctx = chart.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(100,116,139,0.5)";
    ctx.stroke();
    ctx.restore();
  },
};

const { gridColor, tickColor } = getChartColors();

const finChart = new Chart(document.getElementById("finChart"), {
  type: "line",
  plugins: [crosshairPlugin],
  data: {
    labels: CHART_DATA["1W"].labels,
    datasets: buildDatasets(),
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1e293b",
        titleColor: "#94a3b8",
        bodyColor: "#f1f5f9",
        padding: 10,
        cornerRadius: 8,
        titleFont: { size: 11, weight: "600" },
        bodyFont: { size: 12, weight: "600" },
        callbacks: {
          title: (items) => items[0].label,
          label: (item) =>
            `${item.dataset.label}: ₹${(item.raw / 100000).toFixed(2)}L`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: tickColor,
          font: { size: 11, weight: "500" },
          maxRotation: 0,
        },
        border: { display: false },
      },
      y: {
        grid: { color: gridColor },
        ticks: {
          color: tickColor,
          font: { size: 11, weight: "500" },
          callback: (v) => "₹" + (v / 100000).toFixed(1) + "L",
          maxTicksLimit: 5,
        },
        border: { display: false },
      },
    },
  },
});

updateLegend();

function activateBtn(selector, btn, className) {
  document.querySelectorAll(selector).forEach((b) => (b.className = "f-btn"));
  btn.classList.add(className);
}

function setTime(key, btn) {
  curTime = key;
  activateBtn('[id^="t-"]', btn, "active-time");
  refreshChart();
}

function setView(key, btn) {
  curView = key;
  const classMap = {
    all: "active-all",
    income: "active-income",
    expense: "active-expense",
    margin: "active-margin",
  };
  activateBtn('[id^="v-"]', btn, classMap[key]);
  refreshChart();
}

function refreshChart() {
  finChart.data.labels = CHART_DATA[curTime].labels;
  finChart.data.datasets = buildDatasets();
  finChart.update();
  updateLegend();
  updateChartTheme();
}

const TASK_DATA = {
  counts: [3, 7, 0],
  labels: ["Overdue", "Pending", "Done"],

  hoverColors: { Overdue: "#b91c1c", Pending: "#92400e", Done: "#15803d" },
};

const donutNum = document.getElementById("donut-num");
const donutLbl = document.getElementById("donut-lbl");

function getDonutSize() {
  if (window.innerWidth >= 1024) return 124;
  if (window.innerWidth >= 640) return 115;
  return 105;
}

const donutSize = getDonutSize();
const donutCanvas = document.getElementById("donutChart");
donutCanvas.width = donutSize;
donutCanvas.height = donutSize;
donutCanvas.style.width = donutSize + "px";
donutCanvas.style.height = donutSize + "px";

new Chart(donutCanvas, {
  type: "doughnut",
  data: {
    labels: TASK_DATA.labels,
    datasets: [
      {
        data: [3, 7, 0.3],
        backgroundColor: ["#dc2626", "#f59e0b", "#22c55e"],
        borderWidth: 3,
        borderColor: "#ffffff",
        hoverOffset: 6,
      },
    ],
  },
  options: {
    responsive: false,
    cutout: "65%",
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${TASK_DATA.counts[ctx.dataIndex]}`,
        },
      },
    },
    onHover(e, elements) {
      if (elements.length > 0) {
        const i = elements[0].index;
        const label = TASK_DATA.labels[i];
        donutNum.textContent = TASK_DATA.counts[i];
        donutNum.style.color = TASK_DATA.hoverColors[label];
        donutLbl.textContent = label;
      } else {
        donutNum.textContent = "10";
        donutNum.style.color = "#1e293b";
        donutLbl.textContent = "tasks";
      }
    },
  },
});
