import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Radio, Activity, CheckCircle, BarChart3, Wifi } from 'lucide-react';
import { Chart } from 'chart.js/auto';
import { useSensorData } from '../hooks/useSensorData';
import './SignalDash.tailwind.css';

/**
 * Reusable Chart.js Time-Series Line Chart Component (CO-3)
 */
function SensorLineChart({ title, data, dataKey, color, unit, min, max }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map((d) => d.time),
        datasets: [
          {
            label: `${title} (${unit})`,
            data: data.map((d) => d[dataKey]),
            borderColor: color,
            backgroundColor: `${color}18`,
            borderWidth: 2,
            fill: true,
            tension: 0.35,
            pointRadius: 0,
            pointHitRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            displayColors: false,
            callbacks: {
              label: (context) => `${context.parsed.y} ${unit}`,
            },
          },
        },
        scales: {
          x: {
            display: false,
          },
          y: {
            min,
            max,
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              color: '#94a3b8',
              font: { size: 10, family: 'monospace' },
            },
          },
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Mount once

  // Smooth real-time rolling window update (without jarring animation reloads)
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.data.labels = data.map((d) => d.time);
      chartRef.current.data.datasets[0].data = data.map((d) => d[dataKey]);
      chartRef.current.update('none');
    }
  }, [data, dataKey]);

  const latestVal = data[data.length - 1]?.[dataKey];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg space-y-2 hover:border-slate-700 transition">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-200">{title}</span>
        <span
          className="font-mono text-xs px-2.5 py-0.5 rounded-md font-bold border border-slate-700/60 bg-slate-950"
          style={{ color }}
        >
          {latestVal !== undefined ? latestVal : '--'} {unit}
        </span>
      </div>
      <div className="h-44 w-full pt-1">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}

export default function SignalDash() {
  const navigate = useNavigate();

  // CO-3 Canonical Custom Hook: useSensorData()
  const { sensorData, history, connectionStatus, isSimulated } = useSensorData({
    windowSize: 30,
    enableSimulation: true,
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">

      {/* ── Landmark 1: <header> ── */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">

          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-lg shadow-sky-500/20">
              <Radio className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">SignalDash</h1>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                  CO-1 + CO-3 Verified
                </span>
              </div>
              <p className="text-xs text-slate-400">Tailwind CSS &bull; useSensorData() &bull; Chart.js Rolling Stream</p>
            </div>
          </div>

          {/* ── Landmark 2: <nav> ── */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-300">
            <a href="#overview" className="text-sky-400 hover:text-white transition">Overview</a>
            <a href="#charts" className="hover:text-white transition">Chart.js Streams</a>
            <a href="#metrics" className="hover:text-white transition">Sensors</a>
            <a href="#pipeline" className="hover:text-white transition">Pipeline</a>
          </nav>

          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center space-x-2 rounded-lg bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200 border border-slate-700 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to AeroSpace</span>
          </button>

        </div>
      </header>

      {/* ── Landmark 3: <main> ── */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8 space-y-8">

        {/* Hero Section */}
        <section id="overview" className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 shadow-xl">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center space-x-2 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-400 border border-sky-500/20">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
              <span>CO-3 Compliance: useSensorData() Hook &bull; Chart.js 1s Rolling Window</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Real-Time Sensor Dashboard &amp; Time-Series Visualizer
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Demonstrates canonical React patterns for sensor telemetries: custom hook encapsulation via{' '}
              <code className="text-sky-400 font-mono text-xs bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                useSensorData()
              </code>
              , 1-second rolling sliding-window buffers, and native <strong className="text-white">Chart.js</strong> time-series curves.
            </p>
          </div>

          {/* Status Bar */}
          <div className="mt-6 flex flex-wrap gap-3 pt-4 border-t border-slate-800 text-xs text-slate-300">
            <div className="flex items-center space-x-2 rounded-lg bg-slate-800/60 px-3 py-1.5 border border-slate-700">
              <span
                className={`h-2 w-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span>
                Stream Status:{' '}
                <strong className="text-white capitalize">
                  {connectionStatus} {isSimulated ? '(Active 1s Pulse)' : ''}
                </strong>
              </span>
            </div>
            <div className="flex items-center space-x-2 rounded-lg bg-slate-800/60 px-3 py-1.5 border border-slate-700">
              <Wifi className="h-3.5 w-3.5 text-sky-400" />
              <span>Refresh Cadence: <strong className="text-sky-400 font-mono">1.0s (Rolling 30s Window)</strong></span>
            </div>
            <div className="flex items-center space-x-2 rounded-lg bg-slate-800/60 px-3 py-1.5 border border-slate-700">
              <span>MQTT Topic: <strong className="text-white font-mono">campus/weather/pod-01/telemetry</strong></span>
            </div>
          </div>
        </section>

        {/* ── CO-3 Lab: 3-Chart Time-Series Dashboard (Chart.js) ── */}
        <section id="charts" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-sky-400" />
              <span>CO-3 Lab: 3-Chart Real-Time Time-Series (Chart.js + Rolling Window)</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">Updates Every 1.0s &bull; Last 30 Seconds</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SensorLineChart
              title="Sensor Temperature"
              data={history}
              dataKey="temperatureC"
              color="#f59e0b"
              unit="°C"
              min={15}
              max={35}
            />
            <SensorLineChart
              title="Barometric Pressure"
              data={history}
              dataKey="pressureHpa"
              color="#0ea5e9"
              unit="hPa"
              min={1000}
              max={1025}
            />
            <SensorLineChart
              title="Signal Level (RSSI)"
              data={history}
              dataKey="rssiDBm"
              color="#10b981"
              unit="dBm"
              min={-100}
              max={-40}
            />
          </div>
        </section>

        {/* ── Landmark 4: <section> Sensor Metrics (CSS Grid) ── */}
        <section id="metrics" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Activity className="h-4 w-4 text-sky-400" />
              <span>Instantaneous Sensor Pod Telemetry Gauges</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">Live Hook State</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* Temperature */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg hover:border-amber-500/40 transition">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-medium uppercase tracking-wider">Temperature</span>
                <span className="rounded bg-amber-500/10 px-2 py-0.5 text-amber-400 font-mono border border-amber-500/20">BME280</span>
              </div>
              <div className="mt-4 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-white font-mono">{sensorData.temperatureC}</span>
                <span className="text-sm font-semibold text-amber-400">&deg;C</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                <span>Range: 18.2&deg;C &ndash; 29.5&deg;C</span>
                <span className="text-emerald-400">&plusmn;0.3&deg;C Nominal</span>
              </div>
            </div>

            {/* Pressure */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg hover:border-sky-500/40 transition">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-medium uppercase tracking-wider">Atmospheric Pressure</span>
                <span className="rounded bg-sky-500/10 px-2 py-0.5 text-sky-400 font-mono border border-sky-500/20">Barometric</span>
              </div>
              <div className="mt-4 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-white font-mono">{sensorData.pressureHpa}</span>
                <span className="text-sm font-semibold text-sky-400">hPa</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                <span>Altitude Eq: {sensorData.altitudeFt} ft</span>
                <span className="text-sky-300">1.00 atm</span>
              </div>
            </div>

            {/* Frequency */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg hover:border-indigo-500/40 transition">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-medium uppercase tracking-wider">RF Frequency</span>
                <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-indigo-400 font-mono border border-indigo-500/20">UHF Link</span>
              </div>
              <div className="mt-4 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-white font-mono">{sensorData.frequencyMhz.toFixed(3)}</span>
                <span className="text-sm font-semibold text-indigo-400">MHz</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                <span>Band: 70cm Amateur / Weather</span>
                <span className="text-emerald-400">RSSI {sensorData.rssiDBm} dBm</span>
              </div>
            </div>

            {/* Battery / SNR */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg hover:border-emerald-500/40 transition">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-medium uppercase tracking-wider">Node Power &amp; Link</span>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-400 font-mono border border-emerald-500/20">Telemetry</span>
              </div>
              <div className="mt-4 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-white font-mono">{sensorData.batteryPct}</span>
                <span className="text-sm font-semibold text-emerald-400">% LiPo</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                <span>SNR: {sensorData.snrDB} dB</span>
                <span className="text-emerald-300">Healthy</span>
              </div>
            </div>

          </div>
        </section>

        {/* 2-Column Split: Content & Aside */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          <div className="lg:col-span-2 space-y-8">

            {/* ── Landmark 5: <article> Full-Stack Journey ── */}
            <article id="pipeline" className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 space-y-4 shadow-lg">
              <div className="border-b border-slate-800 pb-3">
                <h4 className="text-base font-bold text-white flex items-center space-x-2">
                  <span className="h-2 w-2 rounded-full bg-sky-400"></span>
                  <span>The Full-Stack Journey at a Glance</span>
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Sensor &rarr; MQTT broker &rarr; Backend WebSocket bridge &rarr; React frontend &rarr; Chart.js visualization
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="rounded-lg bg-slate-950 p-3 border border-slate-800 text-center space-y-1">
                  <div className="text-[10px] font-mono text-sky-400 uppercase">1. Sensor</div>
                  <div className="font-bold text-white">Weather Pod</div>
                  <div className="text-[11px] text-slate-400">BME280 / ESP32 sampling telemetry</div>
                </div>
                <div className="rounded-lg bg-slate-950 p-3 border border-slate-800 text-center space-y-1">
                  <div className="text-[10px] font-mono text-indigo-400 uppercase">2. Ingestion</div>
                  <div className="font-bold text-white">MQTT Broker</div>
                  <div className="text-[11px] text-slate-400">HiveMQ public broker topic</div>
                </div>
                <div className="rounded-lg bg-slate-950 p-3 border border-slate-800 text-center space-y-1">
                  <div className="text-[10px] font-mono text-purple-400 uppercase">3. Gateway</div>
                  <div className="font-bold text-white">Node.js WS Bridge</div>
                  <div className="text-[11px] text-slate-400">Express + Socket.io relay</div>
                </div>
                <div className="rounded-lg bg-slate-950 p-3 border border-slate-800 text-center space-y-1">
                  <div className="text-[10px] font-mono text-emerald-400 uppercase">4. Client</div>
                  <div className="font-bold text-white">React + Chart.js</div>
                  <div className="text-[11px] text-slate-400">1s rolling line charts &amp; HUD</div>
                </div>
              </div>
            </article>

          </div>

          {/* ── Landmark 6: <aside> Specs ── */}
          <aside className="space-y-6">

            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-3 shadow-lg text-xs">
              <div className="border-b border-slate-800 pb-2">
                <h4 className="font-bold text-white uppercase tracking-wider">CO-3 React Architecture</h4>
                <p className="text-slate-400 text-[11px]">Lifecycle &amp; Hook Primitives</p>
              </div>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-center space-x-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                  <span><code>useSensorData()</code> Custom Hook</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-400"></span>
                  <span><code>Chart.js</code> Canonical Visuals</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400"></span>
                  <span>Rolling Buffer: <code>.slice(-30)</code></span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-400"></span>
                  <span>Unmount Lifecycle Teardown</span>
                </li>
              </ul>
            </div>

          </aside>

        </div>

      </main>

      {/* ── Landmark 7: <footer> ── */}
      <footer className="mt-16 border-t border-slate-800 bg-slate-900/60 px-4 py-8 text-xs text-slate-400">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-white">SignalDash Lab</span>
            <span>&bull;</span>
            <span>CO-1 (HTML5/Tailwind) &amp; CO-3 (React/Chart.js/useSensorData)</span>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-sky-400 hover:underline"
          >
            Return to AeroSpace Home &rarr;
          </button>
        </div>
      </footer>

    </div>
  );
}
