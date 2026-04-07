import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const outputDir = process.env.PUBLISH_PAGES_OUTPUT_DIR || process.env.GITHUB_PAGES_OUTPUT_DIR;

if (!outputDir) {
  throw new Error('missing PUBLISH_PAGES_OUTPUT_DIR or GITHUB_PAGES_OUTPUT_DIR');
}

const latest = readJson(path.join(process.cwd(), 'results/latest.json'));
const repoUrl = normalizeRepositoryUrl(process.env.PUBLISH_GITHUB_REPOSITORY || detectRepositoryUrl());
const pagesUrl = derivePagesUrl(repoUrl);
const historyDir = path.join(process.cwd(), 'results/history');
const historyFiles = fs.existsSync(historyDir)
  ? fs.readdirSync(historyDir).filter((entry) => entry.endsWith('.json')).sort().reverse()
  : [];

const siteData = {
  generatedAt: new Date().toISOString(),
  repository: {
    url: repoUrl,
    pagesUrl,
    ...deriveRepositoryParts(repoUrl),
  },
  docs: {
    latestResultPath: 'results/latest.json',
    leaderboardPath: 'leaderboard.md',
    modelCatalogPath: 'models/index.md',
    resultSchemaPath: 'docs/result-schema.json',
    designDocPath: 'docs/design.md',
    historyIndexPath: 'results/history/index.json',
    sourceUrl: repoUrl,
  },
  latestRun: summarizeRun(latest),
  scoring: latest.scoring ?? null,
  taskCatalog: latest.taskCatalog ?? [],
  modelSummary: sortByComposite(latest.modelSummary ?? latest.leaderboard ?? []),
  taskSummary: sortByComposite(latest.taskSummary ?? []),
  history: historyFiles.map((fileName) => summarizeHistoricalRun(fileName, latest.run?.id ?? null)),
};

writeJson(path.join(outputDir, 'site-data.json'), siteData);
writeJson(path.join(outputDir, 'results/history/index.json'), siteData.history);
fs.writeFileSync(path.join(outputDir, 'index.html'), renderHtml(siteData), 'utf8');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function detectRepositoryUrl() {
  for (const remote of ['github', 'origin']) {
    try {
      const value = execSync(`git remote get-url ${remote}`, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
      if (value) {
        return value;
      }
    } catch {
      // Try the next remote.
    }
  }
  return null;
}

function normalizeRepositoryUrl(rawUrl) {
  if (!rawUrl) {
    return null;
  }

  const trimmed = rawUrl.trim();
  let match = trimmed.match(/^git@github\.com:(.+?)\/?(?:\.git)?$/i);
  if (match) {
    return `https://github.com/${stripGitSuffix(match[1])}`;
  }

  match = trimmed.match(/^ssh:\/\/git@github\.com\/(.+?)\/?(?:\.git)?$/i);
  if (match) {
    return `https://github.com/${stripGitSuffix(match[1])}`;
  }

  match = trimmed.match(/^https:\/\/github\.com\/(.+?)\/?(?:\.git)?$/i);
  if (match) {
    return `https://github.com/${stripGitSuffix(match[1])}`;
  }

  return trimmed.replace(/\.git$/i, '');
}

function stripGitSuffix(value) {
  return value.replace(/\.git$/i, '').replace(/\/$/, '');
}

function deriveRepositoryParts(repositoryUrl) {
  if (!repositoryUrl) {
    return { owner: null, name: null };
  }

  const match = repositoryUrl.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)$/i);
  if (!match) {
    return { owner: null, name: null };
  }

  return {
    owner: match[1],
    name: match[2],
  };
}

function derivePagesUrl(repositoryUrl) {
  const { owner, name } = deriveRepositoryParts(repositoryUrl);
  if (!owner || !name) {
    return null;
  }
  if (name === `${owner}.github.io`) {
    return `https://${owner}.github.io/`;
  }
  return `https://${owner}.github.io/${name}/`;
}

function summarizeRun(report) {
  const modelSummary = sortByComposite(report.modelSummary ?? report.leaderboard ?? []);
  const topModel = modelSummary[0] ?? null;
  const comparableModels = modelSummary.filter((entry) => entry.comparable).length;

  return {
    id: report.run?.id ?? null,
    startedAt: report.run?.startedAt ?? null,
    completedAt: report.run?.completedAt ?? null,
    benchmarkCycle: report.run?.benchmarkCycle ?? null,
    taskCount: report.run?.taskCount ?? report.taskCatalog?.length ?? 0,
    taskPatterns: report.run?.taskPatterns ?? [],
    repeats: report.run?.repeats ?? null,
    modelCount: Array.isArray(report.run?.models) ? report.run.models.length : modelSummary.length,
    totalRuns: Array.isArray(report.results) ? report.results.length : 0,
    successfulRuns: Array.isArray(report.results) ? report.results.filter((entry) => entry.success).length : 0,
    comparableModels,
    topModel,
  };
}

function summarizeHistoricalRun(fileName, latestRunId) {
  const report = readJson(path.join(historyDir, fileName));
  const runSummary = summarizeRun(report);
  const topModel = runSummary.topModel;

  return {
    id: report.run?.id ?? fileName.replace(/\.json$/, ''),
    startedAt: report.run?.startedAt ?? null,
    completedAt: report.run?.completedAt ?? null,
    benchmarkCycle: report.run?.benchmarkCycle ?? null,
    taskCount: runSummary.taskCount,
    modelCount: runSummary.modelCount,
    repeats: runSummary.repeats,
    totalRuns: runSummary.totalRuns,
    successfulRuns: runSummary.successfulRuns,
    topModel: topModel?.model ?? null,
    topCompositeScore: topModel?.compositeScore ?? null,
    topSuccessRate: topModel?.successRate ?? null,
    href: `results/history/${fileName}`,
    isLatest: report.run?.id === latestRunId,
  };
}

function sortByComposite(rows) {
  return [...rows].sort((left, right) => {
    const compositeDelta = toComparableNumber(right.compositeScore) - toComparableNumber(left.compositeScore);
    if (compositeDelta !== 0) {
      return compositeDelta;
    }
    return toComparableNumber(left.orpt) - toComparableNumber(right.orpt);
  });
}

function toComparableNumber(value) {
  return Number.isFinite(value) ? value : Number.NEGATIVE_INFINITY;
}

function renderHtml(data) {
  const safeData = JSON.stringify(data).replace(/</g, '\\u003c');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ORPT-Bench</title>
  <meta name="color-scheme" content="dark light">
  <style>
    :root {
      --bg: #060816;
      --panel: rgba(15, 20, 38, 0.88);
      --panel-strong: #0f1830;
      --border: rgba(122, 162, 255, 0.18);
      --text: #edf2ff;
      --muted: #99a4c8;
      --accent: #73f0c5;
      --accent-2: #86a8ff;
      --danger: #ff7a9a;
      --warning: #ffd36e;
      --shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
      --radius: 22px;
      --radius-sm: 14px;
      --mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      --sans: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      font-family: var(--sans);
      color: var(--text);
      background:
        radial-gradient(circle at top, rgba(134, 168, 255, 0.18), transparent 35%),
        radial-gradient(circle at 85% 15%, rgba(115, 240, 197, 0.12), transparent 28%),
        linear-gradient(180deg, #080b18 0%, #05070f 100%);
      min-height: 100vh;
    }
    a { color: inherit; text-decoration: none; }
    a:hover { color: var(--accent); }
    .shell { width: min(1380px, calc(100vw - 32px)); margin: 0 auto; padding: 28px 0 72px; }
    .topbar {
      position: sticky;
      top: 12px;
      z-index: 20;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 18px;
      margin-bottom: 22px;
      border: 1px solid var(--border);
      border-radius: 999px;
      background: rgba(7, 10, 21, 0.74);
      backdrop-filter: blur(18px);
      box-shadow: var(--shadow);
    }
    .brand { display: flex; align-items: center; gap: 12px; font-weight: 700; letter-spacing: 0.01em; }
    .brand-mark {
      width: 34px;
      height: 34px;
      display: grid;
      place-items: center;
      border-radius: 12px;
      border: 1px solid rgba(115, 240, 197, 0.28);
      background: linear-gradient(135deg, rgba(115, 240, 197, 0.18), rgba(134, 168, 255, 0.16));
      color: var(--accent);
      font-family: var(--mono);
      font-size: 0.82rem;
    }
    .nav { display: flex; flex-wrap: wrap; gap: 8px; }
    .nav a, .button {
      padding: 10px 14px;
      border-radius: 999px;
      border: 1px solid transparent;
      color: var(--muted);
      transition: 160ms ease;
    }
    .nav a:hover, .button:hover {
      color: var(--text);
      border-color: var(--border);
      background: rgba(255, 255, 255, 0.04);
    }
    .button.primary {
      color: #06111f;
      background: linear-gradient(135deg, var(--accent), #9dc0ff);
      box-shadow: 0 14px 30px rgba(115, 240, 197, 0.22);
    }
    .hero, .panel {
      position: relative;
      overflow: hidden;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: linear-gradient(180deg, rgba(16, 21, 41, 0.96), rgba(9, 12, 24, 0.96));
      box-shadow: var(--shadow);
    }
    .hero { padding: 34px; margin-bottom: 22px; }
    .hero::before, .panel::before {
      content: "";
      position: absolute;
      inset: -1px;
      border-radius: inherit;
      padding: 1px;
      background: linear-gradient(135deg, rgba(115, 240, 197, 0.18), rgba(134, 168, 255, 0.24), transparent 60%);
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
    }
    .hero-grid, .stats-grid, .chart-grid, .docs-grid { display: grid; gap: 16px; }
    .hero-grid { grid-template-columns: minmax(0, 1.4fr) minmax(320px, 0.9fr); align-items: start; gap: 24px; }
    .eyebrow, .hint, .micro { font-family: var(--mono); letter-spacing: 0.04em; text-transform: uppercase; }
    .eyebrow { color: var(--accent); font-size: 0.78rem; margin-bottom: 10px; }
    h1, h2, h3, p { margin: 0; }
    h1 { font-size: clamp(2.2rem, 5vw, 4.2rem); line-height: 0.95; letter-spacing: -0.04em; max-width: 14ch; margin-bottom: 16px; }
    .hero p, .panel-copy, .muted { color: var(--muted); line-height: 1.6; }
    .hero-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 20px; }
    .summary-list { display: grid; gap: 10px; margin-top: 18px; }
    .summary-item, .metric, .doc-card, .chart-card, .table-panel {
      border: 1px solid rgba(122, 162, 255, 0.12);
      border-radius: var(--radius-sm);
      background: rgba(9, 14, 28, 0.78);
    }
    .summary-item { padding: 14px 16px; }
    .summary-item strong { display: block; margin-bottom: 6px; font-size: 0.95rem; }
    .stats-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); margin-bottom: 22px; }
    .metric { padding: 18px; }
    .metric-label { font-size: 0.76rem; color: var(--muted); margin-bottom: 10px; }
    .metric-value { font-size: clamp(1.35rem, 2.2vw, 2rem); font-weight: 700; letter-spacing: -0.03em; margin-bottom: 4px; }
    .metric-note { color: var(--muted); font-size: 0.88rem; }
    .section { margin-top: 22px; }
    .section-header { display: flex; justify-content: space-between; align-items: end; gap: 16px; margin-bottom: 14px; }
    .section-title { font-size: clamp(1.3rem, 2vw, 1.7rem); letter-spacing: -0.03em; margin-bottom: 4px; }
    .hint { display: inline-flex; align-items: center; gap: 8px; margin-top: 8px; color: var(--warning); font-size: 0.72rem; }
    .chart-grid, .docs-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .chart-card, .doc-card, .table-panel { padding: 18px; }
    .chart-card iframe {
      width: 100%;
      height: 320px;
      border: 0;
      border-radius: 12px;
      background: #ffffff;
      margin: 14px 0 12px;
    }
    .card-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
    .card-link {
      padding: 9px 12px;
      border-radius: 999px;
      border: 1px solid var(--border);
      color: var(--text);
      font-size: 0.9rem;
    }
    .table-panel { padding-bottom: 8px; }
    .table-wrap {
      overflow: auto;
      margin-top: 14px;
      border-radius: 12px;
      border: 1px solid rgba(122, 162, 255, 0.08);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 920px;
      background: rgba(7, 10, 20, 0.82);
    }
    th, td {
      padding: 12px 14px;
      border-bottom: 1px solid rgba(122, 162, 255, 0.08);
      text-align: left;
      vertical-align: top;
      font-size: 0.93rem;
    }
    th {
      position: sticky;
      top: 0;
      background: rgba(12, 18, 35, 0.96);
      z-index: 1;
      color: var(--muted);
      font-weight: 600;
    }
    th button { all: unset; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; color: inherit; }
    th button:hover { color: var(--text); }
    tbody tr:hover { background: rgba(115, 240, 197, 0.04); }
    .mono { font-family: var(--mono); }
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      border-radius: 999px;
      border: 1px solid rgba(122, 162, 255, 0.14);
      font-size: 0.8rem;
      white-space: nowrap;
    }
    .pill.good { color: var(--accent); border-color: rgba(115, 240, 197, 0.24); background: rgba(115, 240, 197, 0.08); }
    .pill.warn { color: var(--warning); border-color: rgba(255, 211, 110, 0.24); background: rgba(255, 211, 110, 0.08); }
    .empty { padding: 22px; border-radius: 14px; border: 1px dashed rgba(122, 162, 255, 0.16); color: var(--muted); }
    footer { margin-top: 22px; padding: 18px 2px 0; color: var(--muted); font-size: 0.92rem; }
    @media (max-width: 1180px) {
      .hero-grid, .stats-grid, .chart-grid, .docs-grid { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 840px) {
      .shell { width: min(100vw - 20px, 1380px); padding-top: 14px; }
      .topbar { position: static; border-radius: 22px; }
      .hero, .panel, .chart-card, .doc-card, .table-panel, .metric { padding: 16px; }
      .hero-grid, .stats-grid, .chart-grid, .docs-grid, .section-header {
        grid-template-columns: 1fr;
        flex-direction: column;
        align-items: stretch;
      }
      .chart-card iframe { height: 260px; }
    }
  </style>
</head>
<body>
  <div class="shell">
    <div class="topbar">
      <div class="brand">
        <div class="brand-mark">oc</div>
        <div>ORPT-Bench</div>
      </div>
      <div class="nav">
        <a href="#charts">Charts</a>
        <a href="#comparison">Comparison</a>
        <a href="#docs">Docs</a>
        <a href="#history">History</a>
      </div>
    </div>
    <section class="hero">
      <div class="hero-grid">
        <div>
          <div class="eyebrow">OpenCode benchmark publication</div>
          <h1>Requests per solved task, published for fast comparison.</h1>
          <p>
            ORPT-Bench measures how many OpenCode requests a model spends per successful benchmark task.
            This page keeps the live benchmark output focused on the parts you actually compare: charts,
            sortable tables, scoring context, and historical snapshots.
          </p>
          <div class="hero-actions" id="hero-actions"></div>
          <div class="hint">Hint: every comparison table is sortable and starts in composite-score order.</div>
        </div>
        <div class="summary-list">
          <div class="summary-item">
            <strong>How to read the ranking</strong>
            <div class="muted">Composite score keeps correctness dominant, then rewards efficient successful runs with ORPT, cost, and wall time.</div>
          </div>
          <div class="summary-item">
            <strong>What lives here</strong>
            <div class="muted">Live charts, model and task comparisons, raw result links, model catalog access, and historical run snapshots.</div>
          </div>
          <div class="summary-item">
            <strong>Where deeper detail lives</strong>
            <div class="muted">Use the docs section for the benchmark design, result schema, raw JSON artifacts, and the source repository.</div>
          </div>
        </div>
      </div>
    </section>
    <section class="stats-grid" id="stats"></section>
    <section class="section" id="charts">
      <div class="section-header">
        <div>
          <div class="section-title">Charts First</div>
          <p class="panel-copy">Charts are the fastest way to scan leaderboard shape before drilling into row-level comparisons.</p>
        </div>
      </div>
      <div class="chart-grid">
        <article class="chart-card">
          <div class="micro muted">Primary ranking</div>
          <h3>Composite score</h3>
          <p class="panel-copy">Default benchmark ordering: correctness first, efficiency second.</p>
          <iframe loading="lazy" src="results/charts/composite-score.html" title="Composite score chart"></iframe>
          <div class="card-actions">
            <a class="card-link" href="results/charts/composite-score.html">Open chart</a>
            <a class="card-link" href="results/charts/composite-score.json">View chart data</a>
          </div>
        </article>
        <article class="chart-card">
          <div class="micro muted">Correctness view</div>
          <h3>Success rate</h3>
          <p class="panel-copy">Shows how often a model actually closes benchmark tasks, independent of efficiency.</p>
          <iframe loading="lazy" src="results/charts/success-rate.html" title="Success rate chart"></iframe>
          <div class="card-actions">
            <a class="card-link" href="results/charts/success-rate.html">Open chart</a>
            <a class="card-link" href="results/charts/success-rate.json">View chart data</a>
          </div>
        </article>
        <article class="chart-card">
          <div class="micro muted">Efficiency view</div>
          <h3>ORPT</h3>
          <p class="panel-copy">Lower is better: fewer OpenCode requests required per successful task.</p>
          <iframe loading="lazy" src="results/charts/orpt.html" title="ORPT chart"></iframe>
          <div class="card-actions">
            <a class="card-link" href="results/charts/orpt.html">Open chart</a>
            <a class="card-link" href="results/charts/orpt.json">View chart data</a>
          </div>
        </article>
      </div>
    </section>
    <section class="section" id="comparison">
      <div class="section-header">
        <div>
          <div class="section-title">Comparison Tables</div>
          <p class="panel-copy">Sortable tables keep the current benchmark state inspectable without dumping raw markdown into the repository README.</p>
          <div class="hint">Hint: click any column header to re-sort. Composite score is the default.</div>
        </div>
      </div>
      <div class="panel table-panel">
        <div class="micro muted">Comparable cohort overview</div>
        <h3>Model summary</h3>
        <p class="panel-copy">Use this table for the main leaderboard view across models in the latest run.</p>
        <div id="model-summary-table"></div>
      </div>
      <div class="panel table-panel section">
        <div class="micro muted">Task-by-task breakdown</div>
        <h3>Task summary</h3>
        <p class="panel-copy">This is the fastest way to see where a model succeeded, where it missed, and what each task cost in requests, time, and dollars.</p>
        <div id="task-summary-table"></div>
      </div>
    </section>
    <section class="section" id="docs">
      <div class="section-header">
        <div>
          <div class="section-title">Docs And Artifacts</div>
          <p class="panel-copy">Short summaries here link out to the detailed docs and raw benchmark artifacts behind the dashboard.</p>
        </div>
      </div>
      <div class="docs-grid" id="docs-grid"></div>
    </section>
    <section class="section" id="history">
      <div class="section-header">
        <div>
          <div class="section-title">Historical Snapshots</div>
          <p class="panel-copy">Each historical entry links to the raw archived JSON snapshot so longitudinal comparisons remain possible without bloating the root README.</p>
        </div>
      </div>
      <div class="panel table-panel">
        <div class="micro muted">If available, older benchmark publications appear here</div>
        <h3>Run history</h3>
        <p class="panel-copy">Snapshots are sorted by their top composite score by default. Use the raw JSON links for detailed offline analysis.</p>
        <div id="history-table"></div>
      </div>
    </section>
    <footer id="footer"></footer>
  </div>
  <script>
    window.__SITE_DATA__ = ${safeData};
    const siteData = window.__SITE_DATA__;
    const docs = siteData.docs || {};
    const latestRun = siteData.latestRun || {};
    const topModel = latestRun.topModel || null;
    const heroActions = document.getElementById('hero-actions');
    heroActions.appendChild(linkButton(siteData.repository?.pagesUrl || '#comparison', 'Live site', true));
    heroActions.appendChild(linkButton(docs.latestResultPath, 'Latest raw JSON'));
    if (docs.sourceUrl) {
      heroActions.appendChild(linkButton(docs.sourceUrl, 'Source repo'));
    }
    const stats = [
      {
        label: 'Latest run',
        value: formatDateTime(latestRun.completedAt) || 'Unknown',
        note: latestRun.id ? latestRun.id : 'No run id available',
      },
      {
        label: 'Tasks benchmarked',
        value: formatInteger(latestRun.taskCount),
        note: latestRun.repeats ? String(latestRun.repeats) + ' repeat(s) per task' : 'Repeat count unavailable',
      },
      {
        label: 'Comparable models',
        value: formatInteger(latestRun.comparableModels),
        note: topModel ? 'Top model: ' + topModel.model : 'No comparable models yet',
      },
      {
        label: 'Best composite score',
        value: topModel ? formatScore(topModel.compositeScore) : 'n/a',
        note: topModel ? formatPercent(topModel.successRate) + ' success, ' + formatDecimal(topModel.orpt, 2) + ' ORPT' : 'No leaderboard data yet',
      },
    ];
    const statsRoot = document.getElementById('stats');
    for (const stat of stats) {
      const node = document.createElement('article');
      node.className = 'metric';
      node.innerHTML = '\n        <div class="metric-label micro">' + escapeHtml(stat.label) + '</div>\n        <div class="metric-value">' + escapeHtml(stat.value) + '</div>\n        <div class="metric-note">' + escapeHtml(stat.note) + '</div>\n      ';
      statsRoot.appendChild(node);
    }
    const docsGrid = document.getElementById('docs-grid');
    const docCards = [
      { title: 'Benchmark design', summary: 'Benchmark architecture, telemetry rules, and CI publication behavior.', href: docs.designDocPath, label: 'Open design doc' },
      { title: 'Result schema', summary: 'Machine-readable contract for the benchmark JSON artifacts.', href: docs.resultSchemaPath, label: 'Open schema' },
      { title: 'Model catalog', summary: 'Pricing provenance, capability notes, and model inventory details.', href: docs.modelCatalogPath, label: 'Open catalog' },
      { title: 'Latest raw results', summary: 'Full benchmark output for the current publication, including all run-level detail.', href: docs.latestResultPath, label: 'Open latest JSON' },
      { title: 'History index', summary: 'Compact index of archived benchmark snapshots published with the site.', href: docs.historyIndexPath, label: 'Open history index' },
      { title: 'Source repository', summary: 'Benchmark harness, task fixtures, and publication pipeline source.', href: docs.sourceUrl, label: 'Open repository' },
    ].filter((card) => card.href);
    for (const card of docCards) {
      const node = document.createElement('article');
      node.className = 'doc-card';
      node.innerHTML = '\n        <div class="micro muted">Detailed reference</div>\n        <h3>' + escapeHtml(card.title) + '</h3>\n        <p class="panel-copy">' + escapeHtml(card.summary) + '</p>\n      ';
      const actions = document.createElement('div');
      actions.className = 'card-actions';
      actions.appendChild(linkPill(card.href, card.label));
      node.appendChild(actions);
      docsGrid.appendChild(node);
    }
    renderSortableTable(document.getElementById('model-summary-table'), {
      rows: siteData.modelSummary || [],
      defaultSortKey: 'compositeScore',
      defaultDirection: 'desc',
      emptyMessage: 'No model summary is available for the current run.',
      columns: [
        { key: 'model', label: 'Model', type: 'text', render: (row) => row.model },
        { key: 'score', label: 'Score', type: 'number', render: (row) => formatScore(row.score) },
        { key: 'valueScore', label: 'Value', type: 'number', render: (row) => formatScore(row.valueScore) },
        { key: 'compositeScore', label: 'Composite', type: 'number', render: (row) => formatScore(row.compositeScore) },
        { key: 'successRate', label: 'Success', type: 'number', render: (row) => formatPercent(row.successRate) },
        { key: 'orpt', label: 'ORPT', type: 'number', render: (row) => formatDecimal(row.orpt, 2) },
        { key: 'totalRequestUnits', label: 'Requests', type: 'number', render: (row) => formatInteger(row.totalRequestUnits) },
        { key: 'totalWallTimeMs', label: 'Wall time', type: 'number', render: (row) => formatDuration(row.totalWallTimeMs) },
        { key: 'totalCostUsd', label: 'Cost', type: 'number', render: (row) => formatCurrency(row.totalCostUsd) },
        { key: 'comparable', label: 'Status', type: 'text', render: (row) => badge(row.comparable ? 'Comparable' : 'Limited', row.comparable ? 'good' : 'warn') },
      ],
    });
    renderSortableTable(document.getElementById('task-summary-table'), {
      rows: siteData.taskSummary || [],
      defaultSortKey: 'compositeScore',
      defaultDirection: 'desc',
      emptyMessage: 'No task summary is available for the current run.',
      columns: [
        { key: 'taskName', label: 'Task', type: 'text', render: (row) => row.taskName },
        { key: 'model', label: 'Model', type: 'text', render: (row) => row.model },
        { key: 'category', label: 'Category', type: 'text', render: (row) => row.category },
        { key: 'score', label: 'Score', type: 'number', render: (row) => formatScore(row.score) },
        { key: 'valueScore', label: 'Value', type: 'number', render: (row) => formatScore(row.valueScore) },
        { key: 'compositeScore', label: 'Composite', type: 'number', render: (row) => formatScore(row.compositeScore) },
        { key: 'successRate', label: 'Success', type: 'number', render: (row) => formatPercent(row.successRate) },
        { key: 'averageRequestUnits', label: 'Avg requests', type: 'number', render: (row) => formatDecimal(row.averageRequestUnits, 2) },
        { key: 'averageWallTimeMs', label: 'Avg wall time', type: 'number', render: (row) => formatDuration(row.averageWallTimeMs) },
        { key: 'averageCostUsd', label: 'Avg cost', type: 'number', render: (row) => formatCurrency(row.averageCostUsd) },
      ],
    });
    renderSortableTable(document.getElementById('history-table'), {
      rows: siteData.history || [],
      defaultSortKey: 'topCompositeScore',
      defaultDirection: 'desc',
      emptyMessage: 'No historical snapshots were published with this site build.',
      columns: [
        { key: 'completedAt', label: 'Completed', type: 'number', sortValue: (row) => row.completedAt ? Date.parse(row.completedAt) : Number.NEGATIVE_INFINITY, render: (row) => String(formatDateTime(row.completedAt) || 'n/a') + (row.isLatest ? ' (latest)' : '') },
        { key: 'id', label: 'Run id', type: 'text', render: (row) => row.id },
        { key: 'taskCount', label: 'Tasks', type: 'number', render: (row) => formatInteger(row.taskCount) },
        { key: 'modelCount', label: 'Models', type: 'number', render: (row) => formatInteger(row.modelCount) },
        { key: 'topModel', label: 'Top model', type: 'text', render: (row) => row.topModel || 'n/a' },
        { key: 'topCompositeScore', label: 'Top composite', type: 'number', render: (row) => formatScore(row.topCompositeScore) },
        { key: 'topSuccessRate', label: 'Top success', type: 'number', render: (row) => formatPercent(row.topSuccessRate) },
        { key: 'href', label: 'Artifact', type: 'text', render: (row) => linkHtml(row.href, 'Raw JSON') },
      ],
    });
    const footer = document.getElementById('footer');
    footer.textContent = [
      latestRun.completedAt ? 'Latest publication completed ' + formatDateTime(latestRun.completedAt) + '.' : null,
      latestRun.id ? 'Run id ' + latestRun.id + '.' : null,
      siteData.repository?.pagesUrl ? 'Live URL ' + siteData.repository.pagesUrl : null,
    ].filter(Boolean).join(' ');
    function renderSortableTable(root, config) {
      if (!root) {
        return;
      }
      if (!Array.isArray(config.rows) || config.rows.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty';
        empty.textContent = config.emptyMessage;
        root.replaceChildren(empty);
        return;
      }
      const state = { sortKey: config.defaultSortKey, direction: config.defaultDirection };
      const panel = document.createElement('div');
      const wrap = document.createElement('div');
      wrap.className = 'table-wrap';
      const table = document.createElement('table');
      const thead = document.createElement('thead');
      const tbody = document.createElement('tbody');
      table.append(thead, tbody);
      wrap.appendChild(table);
      panel.appendChild(wrap);
      root.replaceChildren(panel);
      const render = () => {
        thead.replaceChildren();
        tbody.replaceChildren();
        const headRow = document.createElement('tr');
        for (const column of config.columns) {
          const th = document.createElement('th');
          const button = document.createElement('button');
          const active = state.sortKey === column.key;
          button.innerHTML = escapeHtml(column.label) + (active ? ' <span class="mono">' + (state.direction === 'desc' ? 'v' : '^') + '</span>' : '');
          button.addEventListener('click', () => {
            if (state.sortKey === column.key) {
              state.direction = state.direction === 'desc' ? 'asc' : 'desc';
            } else {
              state.sortKey = column.key;
              state.direction = config.defaultSortKey === column.key ? config.defaultDirection : 'desc';
            }
            render();
          });
          th.appendChild(button);
          headRow.appendChild(th);
        }
        thead.appendChild(headRow);
        const sortedRows = [...config.rows].sort((left, right) => compareRows(left, right, config.columns, state));
        for (const row of sortedRows) {
          const tr = document.createElement('tr');
          for (const column of config.columns) {
            const td = document.createElement('td');
            const html = column.render(row);
            if (typeof html === 'string') {
              td.innerHTML = html;
            } else {
              td.appendChild(html);
            }
            tr.appendChild(td);
          }
          tbody.appendChild(tr);
        }
      };
      render();
    }
    function compareRows(left, right, columns, state) {
      const column = columns.find((entry) => entry.key === state.sortKey) || columns[0];
      const leftValue = column.sortValue ? column.sortValue(left) : left[column.key];
      const rightValue = column.sortValue ? column.sortValue(right) : right[column.key];
      let result = 0;
      if (column.type === 'number') {
        result = toNumericSortValue(leftValue) - toNumericSortValue(rightValue);
      } else {
        result = String(leftValue ?? '').localeCompare(String(rightValue ?? ''));
      }
      if (result === 0 && column.key !== 'compositeScore' && 'compositeScore' in left && 'compositeScore' in right) {
        result = toNumericSortValue(left.compositeScore) - toNumericSortValue(right.compositeScore);
      }
      if (result === 0 && 'orpt' in left && 'orpt' in right) {
        result = toNumericSortValue(right.orpt) - toNumericSortValue(left.orpt);
      }
      return state.direction === 'desc' ? -result : result;
    }
    function toNumericSortValue(value) { return Number.isFinite(value) ? value : Number.NEGATIVE_INFINITY; }
    function badge(label, tone) { return '<span class="pill ' + tone + '">' + escapeHtml(label) + '</span>'; }
    function linkHtml(href, label) { return '<a class="card-link" href="' + escapeAttribute(href) + '">' + escapeHtml(label) + '</a>'; }
    function linkButton(href, label, primary = false) {
      const node = document.createElement('a');
      node.className = 'button' + (primary ? ' primary' : '');
      node.href = href;
      node.textContent = label;
      return node;
    }
    function linkPill(href, label) {
      const node = document.createElement('a');
      node.className = 'card-link';
      node.href = href;
      node.textContent = label;
      return node;
    }
    function formatScore(value) {
      if (!Number.isFinite(value)) {
        return 'n/a';
      }
      return Number(value).toFixed(3).replace(/0+$/, '').replace(/\.$/, '.0');
    }
    function formatPercent(value) {
      if (!Number.isFinite(value)) {
        return 'n/a';
      }
      return String(Math.round(value * 100)) + '%';
    }
    function formatDecimal(value, decimals) {
      if (!Number.isFinite(value)) {
        return 'n/a';
      }
      return Number(value).toFixed(decimals);
    }
    function formatCurrency(value) {
      if (!Number.isFinite(value)) {
        return 'n/a';
      }
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      }).format(value);
    }
    function formatInteger(value) {
      if (!Number.isFinite(value)) {
        return 'n/a';
      }
      return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
    }
    function formatDuration(value) {
      if (!Number.isFinite(value)) {
        return 'n/a';
      }
      const seconds = Math.round(value / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainder = seconds % 60;
      if (minutes === 0) {
        return String(remainder) + 's';
      }
      return String(minutes) + 'm ' + String(remainder).padStart(2, '0') + 's';
    }
    function formatDateTime(value) {
      if (!value) {
        return null;
      }
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return value;
      }
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      }).format(date);
    }
    function escapeHtml(value) {
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
    function escapeAttribute(value) {
      return escapeHtml(value);
    }
  </script>
</body>
</html>
`;
}
