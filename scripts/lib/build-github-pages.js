import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

import { aggregateRun } from './benchmark.js';

const outputDir = process.env.PUBLISH_PAGES_OUTPUT_DIR || process.env.GITHUB_PAGES_OUTPUT_DIR;
const MODEL_COLOR_PALETTE = ['#73f0c5', '#86a8ff', '#f59e0b', '#f472b6', '#22c55e', '#38bdf8', '#c084fc', '#fb7185'];
const CONTROL_SMOKE_TASK_PATTERNS = ['16-event-status-shell', '17-log-level-rollup', '05*'];
const CONTROL_SMOKE_TASK_IDS = ['16-event-status-shell', '17-log-level-rollup', '05-log-audit-script'];
const LEGACY_CONTROL_SMOKE_TASK_PATTERNS = ['05*'];
const CHART_THEME = {
  paper: '#08101f',
  plot: '#0d1830',
  text: '#edf2ff',
  muted: '#99a4c8',
  grid: 'rgba(153, 164, 200, 0.16)',
  border: 'rgba(153, 164, 200, 0.22)',
  hover: '#0a1324',
};

if (!outputDir) {
  throw new Error('missing PUBLISH_PAGES_OUTPUT_DIR or GITHUB_PAGES_OUTPUT_DIR');
}

const latestRawRun = readJson(path.join(process.cwd(), 'results/latest.json'));
const repoUrl = normalizeRepositoryUrl(process.env.PUBLISH_GITHUB_REPOSITORY || detectRepositoryUrl());
const pagesUrl = derivePagesUrl(repoUrl);
const historyDir = path.join(process.cwd(), 'results/history');
const historyEntries = loadHistoryEntries(historyDir);
const allRunEntries = dedupeRunEntries([...historyEntries, { fileName: null, report: latestRawRun }]);
const publicationContext = buildPublicationContext(allRunEntries, latestRawRun);
const chartDefinitions = [
  {
    slug: 'completion-score',
    eyebrow: 'Completion',
    title: 'Completion score',
    description: 'Raw task completion across the full benchmark set, before value weighting.',
    build: buildCompletionScoreChart,
  },
  {
    slug: 'value-score',
    eyebrow: 'Value',
    title: 'Value score',
    description: 'Efficiency after a task is solved, blending ORPT, total cost, and wall time.',
    build: buildValueScoreChart,
  },
  {
    slug: 'composite-score',
    eyebrow: 'Leaderboard',
    title: 'Composite score',
    description: 'Correctness-first overall ranking across the full benchmark set.',
    build: buildCompositeScoreChart,
  },
  {
    slug: 'success-rate',
    eyebrow: 'Reliability',
    title: 'Success rate',
    description: 'How often each model actually closes tasks, independent of efficiency.',
    featured: true,
    build: buildSuccessRateChart,
  },
  {
    slug: 'orpt',
    eyebrow: 'Request efficiency',
    title: 'ORPT',
    description: 'Lower is better: fewer requests per successful task.',
    featured: true,
    build: buildOrptChart,
  },
  {
    slug: 'total-cost',
    eyebrow: 'Benchmark economics',
    title: 'Total benchmark cost',
    description: 'Total spend per model across the published full run.',
    build: buildTotalCostChart,
  },
  {
    slug: 'composite-vs-cost',
    eyebrow: 'Tradeoff frontier',
    title: 'Completion vs benchmark cost',
    description: 'Who clears the suite most completely for the least total benchmark spend.',
    featured: true,
    build: buildCompositeVsCostChart,
  },
  {
    slug: 'composite-vs-catalog-price',
    eyebrow: 'Catalog priors',
    title: 'Composite vs catalog price',
    description: 'Observed ORPT-Bench quality against catalog blended price per 1M tokens.',
    featured: true,
    build: buildCompositeVsCatalogPriceChart,
  },
  {
    slug: 'total-wall-time',
    eyebrow: 'Benchmark speed',
    title: 'Total wall time',
    description: 'Lower is better: total elapsed model runtime across benchmark tasks.',
    build: buildTotalWallTimeChart,
  },
  {
    slug: 'total-requests',
    eyebrow: 'Traffic profile',
    title: 'Total requests',
    description: 'Total request units consumed across the published run.',
    build: buildTotalRequestsChart,
  },
  {
    slug: 'cost-by-outcome',
    eyebrow: 'Failure burn',
    title: 'Spend split by outcome',
    description: 'How much benchmark spend went to solved tasks versus failed attempts.',
    build: buildCostByOutcomeChart,
  },
  {
    slug: 'token-breakdown',
    eyebrow: 'Execution profile',
    title: 'Token breakdown',
    description: 'Input, output, reasoning, and cache token mix by model across the suite.',
    build: buildTokenBreakdownChart,
  },
  {
    slug: 'category-composite-heatmap',
    eyebrow: 'Benchmark composition',
    title: 'Category composite heatmap',
    description: 'Average composite score by benchmark category and model.',
    wide: true,
    build: buildCategoryCompositeHeatmap,
  },
  {
    slug: 'difficulty-success-heatmap',
    eyebrow: 'Benchmark composition',
    title: 'Difficulty success heatmap',
    description: 'Average success rate by task difficulty and model.',
    wide: true,
    build: buildDifficultySuccessHeatmap,
  },
  {
    slug: 'task-composite-heatmap',
    eyebrow: 'Task breakdown',
    title: 'Task composite heatmap',
    description: 'Per-task comparative quality. Higher is better.',
    wide: true,
    build: buildTaskCompositeHeatmap,
  },
  {
    slug: 'task-cost-heatmap',
    eyebrow: 'Task economics',
    title: 'Task cost heatmap',
    description: 'Per-task average cost by model. Lower is better.',
    wide: true,
    build: buildTaskCostHeatmap,
  },
  {
    slug: 'task-duration-heatmap',
    eyebrow: 'Task speed',
    title: 'Task duration heatmap',
    description: 'Per-task average duration by model. Lower is better.',
    wide: true,
    build: buildTaskDurationHeatmap,
  },
];
const publishedCharts = buildPublishedCharts(chartDefinitions, publicationContext.publishedRun);

const siteData = {
  generatedAt: new Date().toISOString(),
  repository: {
    url: repoUrl,
    pagesUrl,
    ...deriveRepositoryParts(repoUrl),
  },
  docs: {
    latestResultPath: 'results/published.json',
    latestRawResultPath: 'results/latest.json',
    leaderboardPath: 'leaderboard.md',
    modelCatalogPath: 'models/index.md',
    resultSchemaPath: 'docs/result-schema.json',
    designDocPath: 'docs/design.md',
    historyIndexPath: 'results/history/index.json',
    sourceUrl: repoUrl,
  },
  latestRun: summarizeRun(publicationContext.publishedRun),
  latestRawRun: summarizeRun(latestRawRun),
  scoring: publicationContext.publishedRun.scoring ?? null,
  taskCatalog: publicationContext.publishedRun.taskCatalog ?? [],
  modelSummary: sortByComposite(publicationContext.publishedRun.modelSummary ?? publicationContext.publishedRun.leaderboard ?? []),
  taskSummary: buildPublishedTaskSummary(publicationContext.publishedRun),
  benchmarkedModels: buildBenchmarkedModels(publicationContext.publishedRun),
  benchmarkComposition: buildBenchmarkComposition(publicationContext.publishedRun),
  leaderboardHighlights: buildLeaderboardHighlights(publicationContext.publishedRun),
  pairwiseSummary: buildPairwiseSummary(publicationContext.publishedRun),
  categorySummary: buildCategorySummary(publicationContext.publishedRun),
  difficultySummary: buildDifficultySummary(publicationContext.publishedRun),
  tokenSummary: buildTokenSummary(publicationContext.publishedRun),
  smokeRuns: buildSmokeRuns(allRunEntries),
  charts: publishedCharts.map(({ data, layout, ...chart }) => chart),
  history: publicationContext.history.map(({ fileName, report }) => summarizeHistoricalRun(fileName, report, publicationContext.latestIncludedRunId)),
};

writeJson(path.join(outputDir, 'results/published.json'), publicationContext.publishedRun);
writeJson(path.join(outputDir, 'site-data.json'), siteData);
writeJson(path.join(outputDir, 'results/history/index.json'), siteData.history);
fs.writeFileSync(path.join(outputDir, 'index.html'), renderHtml(siteData), 'utf8');

function loadHistoryEntries(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs.readdirSync(directory)
    .filter((entry) => entry.endsWith('.json'))
    .sort()
    .map((fileName) => ({
      fileName,
      report: readJson(path.join(directory, fileName)),
    }));
}

function dedupeRunEntries(entries) {
  const deduped = new Map();
  for (const entry of entries) {
    const runId = entry.report?.run?.id || entry.fileName || JSON.stringify(entry.report?.run || {});
    const existing = deduped.get(runId);
    if (!existing) {
      deduped.set(runId, entry);
      continue;
    }

    if (existing.fileName && !entry.fileName) {
      continue;
    }

    if (!existing.fileName && entry.fileName) {
      deduped.set(runId, entry);
      continue;
    }

    deduped.set(runId, entry);
  }

  return [...deduped.values()].sort((left, right) => runCompletedAt(right.report) - runCompletedAt(left.report));
}

function buildPublicationContext(allEntries, latestReport) {
  const fullTaskCount = Math.max(...allEntries.map(({ report }) => inferTaskCount(report)), inferTaskCount(latestReport), 0);
  const publishableEntries = allEntries.filter(({ report }) => isPublishableRun(report, fullTaskCount));
  const selectedEntriesByModel = new Map();

  for (const entry of publishableEntries) {
    for (const modelName of modelNamesForRun(entry.report)) {
      if (!selectedEntriesByModel.has(modelName)) {
        selectedEntriesByModel.set(modelName, entry);
      }
    }
  }

  const selectedEntries = [...new Set(selectedEntriesByModel.values())].sort((left, right) => runCompletedAt(right.report) - runCompletedAt(left.report));
  const publishedRun = buildPublishedRun(selectedEntries, latestReport, fullTaskCount);
  const latestIncludedRunId = selectedEntries[0]?.report?.run?.id || latestReport?.run?.id || null;

  return {
    publishedRun,
    history: publishableEntries,
    latestIncludedRunId,
  };
}

function buildSmokeRuns(allEntries) {
  return allEntries
    .filter(({ report }) => isSmokeBenchmarkRun(report))
    .map(({ fileName, report }) => summarizeSmokeRun(fileName, report))
    .sort((left, right) => Date.parse(right.completedAt || right.startedAt || 0) - Date.parse(left.completedAt || left.startedAt || 0));
}

function sameStringArray(left, right) {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

function matchesControlSmokeTaskPatterns(taskPatterns) {
  return sameStringArray(taskPatterns, CONTROL_SMOKE_TASK_PATTERNS)
    || sameStringArray(taskPatterns, LEGACY_CONTROL_SMOKE_TASK_PATTERNS);
}

function matchesControlSmokeTaskIds(taskIds) {
  return sameStringArray(taskIds, CONTROL_SMOKE_TASK_IDS)
    || (taskIds.length === 1 && taskIds[0] === '05-log-audit-script');
}

function inferTaskCount(report) {
  return report?.run?.taskCount || report?.taskCatalog?.length || new Set((report?.results || []).map((entry) => entry.taskId)).size || 0;
}

function runCompletedAt(report) {
  const value = Date.parse(report?.run?.completedAt || report?.run?.startedAt || 0);
  return Number.isFinite(value) ? value : 0;
}

function isPublishableRun(report, fullTaskCount) {
  if (!report?.run || !Array.isArray(report.results) || report.results.length === 0) {
    return false;
  }

  if (report.run.benchmarkCycle === 'candidate_smoke') {
    return false;
  }

  const taskCount = inferTaskCount(report);
  if (fullTaskCount > 0 && taskCount < fullTaskCount) {
    return false;
  }

  const taskPatterns = report.run.taskPatterns || [];
  if (taskPatterns.length > 0 && !(taskPatterns.length === 1 && taskPatterns[0] === '*')) {
    return false;
  }

  if (runContainsSyntheticTimeoutRows(report)) {
    return false;
  }

  return true;
}

function isSmokeBenchmarkRun(report) {
  const benchmarkCycle = report?.run?.benchmarkCycle || null;
  if (benchmarkCycle === 'candidate_smoke') return true;

  const taskPatterns = Array.isArray(report?.run?.taskPatterns) ? report.run.taskPatterns.filter(Boolean) : [];
  if (matchesControlSmokeTaskPatterns(taskPatterns)) return true;

  const taskIds = Array.isArray(report?.taskCatalog) ? report.taskCatalog.map((task) => task.id).filter(Boolean) : [];
  return matchesControlSmokeTaskIds(taskIds);
}

function summarizeSmokeRun(fileName, report) {
  const resultRows = Array.isArray(report?.results) ? report.results : [];
  const expectedTaskCount = report?.run?.taskCount || report?.taskCatalog?.length || 0;
  return {
    fileName,
    id: report?.run?.id || fileName || null,
    startedAt: report?.run?.startedAt || null,
    completedAt: report?.run?.completedAt || null,
    benchmarkCycle: report?.run?.benchmarkCycle || null,
    taskCount: report?.run?.taskCount || report?.taskCatalog?.length || 0,
    taskIds: (report?.taskCatalog || []).map((task) => task.id),
    models: (report?.run?.models || []).map((model) => {
      const rows = resultRows.filter((entry) => entry.model === model);
      const successes = rows.filter((entry) => entry.success).length;
      const dnfs = rows.filter((entry) => entry.dnf).length;
      const representativeFailure = selectRepresentativeFailure(rows);
      return {
        model,
        successes,
        dnfs,
        runs: rows.length,
        successRate: rows.length ? successes / rows.length : 0,
        totalCostUsd: summarizeSmokeCostUsd(rows),
        totalWallTimeMs: sum(rows.map((entry) => entry.durationMs || 0)),
        totalRequestUnits: sum(rows.map((entry) => entry.requestUnits || 0)),
        totalRequestCount: sum(rows.map((entry) => entry.requestCount || 0)),
        totalSteps: sum(rows.map((entry) => entry.steps || 0)),
        passed: rows.length > 0 && expectedTaskCount > 0 && successes >= expectedTaskCount,
        failed: rows.length > 0 && (expectedTaskCount === 0 ? successes === 0 : successes < expectedTaskCount),
        providerLimited: rows.some((entry) => isProviderLimitedEntry(entry)),
        lastError: rows.find((entry) => entry.error?.message)?.error?.message || rows.find((entry) => entry.verifier?.stderr)?.verifier?.stderr || null,
        failureSummary: summarizeFailureEvidence(representativeFailure),
      };
    }),
  };
}

function selectRepresentativeFailure(rows) {
  const failures = rows.filter((entry) => !entry.success);
  if (!failures.length) {
    return null;
  }
  return failures.find((entry) => isProviderLimitedEntry(entry))
    || failures.find((entry) => entry.dnf)
    || failures.find((entry) => entry.verifier?.code && entry.verifier.code !== 0)
    || failures[0];
}

function summarizeFailureText(entry) {
  const parts = [
    entry?.error?.message || null,
    entry?.error?.stack || null,
    entry?.verifier?.stderr || null,
    ...((entry?.logExcerpt || []).filter(Boolean)),
  ].filter(Boolean);
  return parts.join('\n');
}

function isProviderLimitedEntry(entry) {
  const proxyStatus = firstFinite((entry?.proxyRecords || []).map((record) => record?.status));
  const combinedMessage = summarizeFailureText(entry);
  return entry?.providerLimited === true
    || proxyStatus === 429
    || /failed with 429|too_many_requests/i.test(combinedMessage);
}

function summarizeFailureEvidence(entry) {
  if (!entry) {
    return null;
  }

  const combinedMessage = summarizeFailureText(entry);
  const proxyStatus = firstFinite((entry.proxyRecords || []).map((record) => record?.status));
  const retryAfter = firstPresent((entry.proxyRecords || []).map((record) => record?.responseHeaders?.['retry-after'] || record?.responseHeaders?.['Retry-After']));
  const suggestedModel = combinedMessage.match(/"suggestions":\["([^"]+)"\]/)?.[1] || null;
  const errorSignature = combinedMessage.match(/ProviderModelNotFoundError|AI_APICallError(?::[^\n]*)?/i)?.[0] || null;

  return {
    outcomeLabel: classifySmokeOutcome(entry),
    providerLimited: isProviderLimitedEntry(entry),
    dnf: entry.dnf === true,
    dnfReason: entry.dnfReason || null,
    verifierCode: Number.isFinite(entry.verifier?.code) ? entry.verifier.code : null,
    verifierStderr: entry.verifier?.stderr || null,
    errorMessage: entry.error?.message || null,
    proxyStatus,
    retryAfter,
    requestUnits: Number.isFinite(entry.requestUnits) ? entry.requestUnits : null,
    requestCount: Number.isFinite(entry.requestCount) ? entry.requestCount : null,
    steps: Number.isFinite(entry.steps) ? entry.steps : null,
    errorSignature,
    suggestedModel,
  };
}

function classifySmokeOutcome(entry) {
  if (!entry) {
    return 'unknown';
  }
  if (entry.success) {
    return 'passed';
  }

  const combinedMessage = summarizeFailureText(entry);
  const proxyStatus = firstFinite((entry?.proxyRecords || []).map((record) => record?.status));
  if (isProviderLimitedEntry(entry)) {
    return 'provider-limited';
  }
  if (/ProviderModelNotFoundError/i.test(combinedMessage)) {
    return 'provider-model-not-found';
  }
  if (Number.isFinite(proxyStatus) && proxyStatus >= 400) {
    return 'provider-http-error';
  }
  if (entry.dnf && entry.dnfReason === 'task-timeout') {
    return 'timed out';
  }
  return 'failed';
}

function firstFinite(values) {
  return values.find((value) => Number.isFinite(value)) ?? null;
}

function firstPresent(values) {
  return values.find((value) => value != null && value !== '') ?? null;
}

function summarizeSmokeCostUsd(rows) {
  const finiteCosts = rows.map((entry) => entry?.costUsd).filter((value) => Number.isFinite(value));
  if (!finiteCosts.length) {
    return null;
  }

  const total = sum(finiteCosts);
  const anySuccessful = rows.some((entry) => entry?.success);
  const anyPositiveCost = finiteCosts.some((value) => value > 0);
  const anyProviderLimited = rows.some((entry) => isProviderLimitedEntry(entry));
  if (total === 0 && !anySuccessful && !anyPositiveCost && anyProviderLimited) {
    return null;
  }
  return total;
}

function runContainsSyntheticTimeoutRows(report) {
  return (report.results || []).some((entry) => {
    const source = entry?.requestAccountingSource || null;
    const message = entry?.error?.message || entry?.verifier?.stderr || '';
    return source === 'synthetic-timeout' || /process timeout budget was exhausted|Model run timed out/i.test(message);
  });
}

function modelNamesForRun(report) {
  if (Array.isArray(report?.modelSummary) && report.modelSummary.length) {
    return report.modelSummary.map((entry) => entry.model).filter(Boolean);
  }
  if (Array.isArray(report?.run?.models) && report.run.models.length) {
    return report.run.models.filter(Boolean);
  }
  return [...new Set((report?.results || []).map((entry) => entry.model).filter(Boolean))];
}

function buildPublishedRun(entries, latestReport, fullTaskCount) {
  if (!entries.length) {
    return latestReport;
  }

  const latestIncludedReport = entries[0].report;
  const selectedModels = new Set();
  const mergedResults = [];

  for (const entry of entries) {
    const modelsForEntry = modelNamesForRun(entry.report);
    for (const modelName of modelsForEntry) {
      if (selectedModels.has(modelName)) {
        continue;
      }
      selectedModels.add(modelName);
      mergedResults.push(...(entry.report.results || []).filter((result) => result.model === modelName));
    }
  }

  const sourceRunIds = entries.map(({ report }) => report.run?.id).filter(Boolean);
  const publishedRun = {
    ...latestIncludedReport,
    run: {
      ...latestIncludedReport.run,
      id: latestIncludedReport.run?.id || latestReport?.run?.id || null,
      models: [...selectedModels].sort(),
      taskCount: fullTaskCount || inferTaskCount(latestIncludedReport),
      taskPatterns: ['*'],
      publishedView: true,
      sourceRunIds,
    },
    results: mergedResults,
    modelCatalog: latestReport.modelCatalog || latestIncludedReport.modelCatalog || { models: [] },
    taskCatalog: latestReport.taskCatalog || latestIncludedReport.taskCatalog || [],
    scoring: latestReport.scoring || latestIncludedReport.scoring || null,
  };

  aggregateRun(publishedRun, latestReport.requestExtractors || latestIncludedReport.requestExtractors || null);
  return publishedRun;
}

for (const { fileName, report } of publicationContext.history) {
  if (!fileName) {
    continue;
  }
  writeJson(path.join(outputDir, 'results/history', fileName), report);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function buildPublishedCharts(definitions, report) {
  return definitions.flatMap((definition) => {
    const built = definition.build(report);
    if (!built?.data?.length) {
      return [];
    }

    const jsonPath = `results/charts/${definition.slug}.json`;
    const htmlPath = `results/charts/${definition.slug}.html`;
    writeJson(path.join(outputDir, jsonPath), {
      title: definition.title,
      description: definition.description,
      data: built.data,
      layout: built.layout,
    });
    fs.writeFileSync(path.join(outputDir, htmlPath), renderStandaloneChartHtml({
      title: definition.title,
      data: built.data,
      layout: built.layout,
    }), 'utf8');

    return [{ ...definition, jsonPath, htmlPath, data: built.data, layout: built.layout }];
  });
}

function buildCompositeScoreChart(report) {
  const rows = sortByComposite(report.modelSummary ?? report.leaderboard ?? []);
  return buildModelBarChart({
    rows,
    metricKey: 'compositeScore',
    title: 'Composite score',
    axisTitle: 'Composite score',
    valueFormatter: (value) => Number((value ?? 0).toFixed(3)),
    customText: (row) => `${formatPercentMarkup(row.successRate)} success | ${formatDecimalMarkup(row.orpt, 2)} ORPT`,
  });
}

function buildCompletionScoreChart(report) {
  const rows = sortByComposite(report.modelSummary ?? report.leaderboard ?? [])
    .filter((entry) => Number.isFinite(entry.score));
  return buildModelBarChart({
    rows,
    metricKey: 'score',
    title: 'Completion score',
    axisTitle: 'Completion score',
    valueFormatter: (value) => Number((value ?? 0).toFixed(3)),
    customText: (row) => `${formatPercentMarkup(row.successRate)} success | ${formatScoreMarkup(row.valueScore)} value`,
  });
}

function buildValueScoreChart(report) {
  const rows = sortByComposite(report.modelSummary ?? report.leaderboard ?? [])
    .filter((entry) => Number.isFinite(entry.valueScore));
  return buildModelBarChart({
    rows,
    metricKey: 'valueScore',
    title: 'Value score',
    axisTitle: 'Value score',
    valueFormatter: (value) => Number((value ?? 0).toFixed(3)),
    customText: (row) => `${formatScoreMarkup(row.score)} completion | ${formatCurrencyMarkup(row.totalCostUsd)} total cost`,
  });
}

function buildSuccessRateChart(report) {
  const rows = sortByComposite(report.modelSummary ?? report.leaderboard ?? []);
  return buildModelBarChart({
    rows,
    metricKey: 'successRate',
    title: 'Success rate',
    axisTitle: 'Success rate (%)',
    valueFormatter: (value) => Number((((value ?? 0) * 100)).toFixed(2)),
    customText: (row) => `${formatScoreMarkup(row.compositeScore)} composite | ${formatIntegerMarkup(row.successfulTasks)} solved`,
  });
}

function buildOrptChart(report) {
  const rows = sortByComposite(report.modelSummary ?? report.leaderboard ?? [])
    .filter((entry) => entry.comparable && entry.eligible && Number.isFinite(entry.orpt))
    .sort((left, right) => left.orpt - right.orpt);
  return buildModelBarChart({
    rows,
    metricKey: 'orpt',
    title: 'ORPT',
    axisTitle: 'Requests per solved task',
    valueFormatter: (value) => Number((value ?? 0).toFixed(2)),
    customText: (row) => `${formatPercentMarkup(row.successRate)} success | ${formatCurrencyMarkup(row.totalCostUsd)} total cost`,
  });
}

function buildTotalCostChart(report) {
  const rows = sortByComposite(report.modelSummary ?? report.leaderboard ?? [])
    .filter((entry) => Number.isFinite(entry.totalCostUsd))
    .sort((left, right) => left.totalCostUsd - right.totalCostUsd);
  return buildModelBarChart({
    rows,
    metricKey: 'totalCostUsd',
    title: 'Total benchmark cost',
    axisTitle: 'USD',
    valueFormatter: (value) => Number((value ?? 0).toFixed(4)),
    customText: (row) => `${formatScoreMarkup(row.compositeScore)} composite | ${formatIntegerMarkup(row.totalRequestUnits)} requests`,
  });
}

function buildCompositeVsCostChart(report) {
  const rows = sortByComposite(report.modelSummary ?? report.leaderboard ?? [])
    .filter((entry) => Number.isFinite(entry.score) && Number.isFinite(entry.totalCostUsd));
  if (!rows.length) {
    return null;
  }

  return {
    data: [
      {
        type: 'scatter',
        mode: 'markers+text',
        x: rows.map((entry) => Number(entry.totalCostUsd.toFixed(4))),
        y: rows.map((entry) => Number(entry.score.toFixed(3))),
        text: rows.map((entry) => entry.model),
        textposition: 'top center',
        textfont: { color: CHART_THEME.text, size: 12 },
        marker: {
          size: rows.map((entry) => 16 + Math.round((entry.compositeScore ?? 0) * 18)),
          color: rows.map((entry) => colorForModel(entry.model)),
          line: { color: 'rgba(255,255,255,0.22)', width: 1.5 },
        },
        customdata: rows.map((entry) => [
          formatScoreMarkup(entry.compositeScore),
          formatDecimalMarkup(entry.orpt, 2),
          formatIntegerMarkup(entry.totalRequestUnits),
          formatDurationMarkup(entry.totalWallTimeMs),
        ]),
        hovertemplate: '%{text}<br>Total cost: $%{x:.4f}<br>Completion: %{y:.3f}<br>Composite: %{customdata[0]}<br>ORPT: %{customdata[1]}<br>Requests: %{customdata[2]}<br>Wall time: %{customdata[3]}<extra></extra>',
      },
    ],
    layout: buildChartLayout({
      title: 'Completion vs benchmark cost',
      xaxis: { title: 'Total benchmark cost (USD)' },
      yaxis: { title: 'Completion score', range: [0, 1.05] },
      height: 520,
    }),
  };
}

function buildCompositeVsCatalogPriceChart(report) {
  const rows = buildBenchmarkedModels(report)
    .filter((entry) => Number.isFinite(entry.compositeScore) && Number.isFinite(entry.blendedPricePer1mTokensUsd));
  if (!rows.length) {
    return null;
  }

  return {
    data: [
      {
        type: 'scatter',
        mode: 'markers+text',
        x: rows.map((entry) => Number(entry.blendedPricePer1mTokensUsd.toFixed(4))),
        y: rows.map((entry) => Number(entry.compositeScore.toFixed(3))),
        text: rows.map((entry) => entry.model),
        textposition: 'top center',
        textfont: { color: CHART_THEME.text, size: 12 },
        marker: {
          size: rows.map((entry) => 16 + Math.round((entry.successRate ?? 0) * 18)),
          color: rows.map((entry) => colorForModel(entry.model)),
          line: { color: 'rgba(255,255,255,0.22)', width: 1.5 },
        },
        customdata: rows.map((entry) => [
          formatPercentMarkup(entry.successRate),
          formatCurrencyMarkup(entry.totalCostUsd),
          formatIntegerMarkup(entry.totalRequestUnits),
          entry.intelligenceScore != null ? String(entry.intelligenceScore) : 'n/a',
        ]),
        hovertemplate: '%{text}<br>Catalog price: $%{x:.4f} / 1M tok<br>Composite: %{y:.3f}<br>Success: %{customdata[0]}<br>Observed benchmark cost: %{customdata[1]}<br>Requests: %{customdata[2]}<br>Catalog intelligence: %{customdata[3]}<extra></extra>',
      },
    ],
    layout: buildChartLayout({
      title: 'Composite vs catalog price',
      xaxis: { title: 'Catalog blended price (USD / 1M tok)' },
      yaxis: { title: 'Composite score', range: [0, 1.05] },
      height: 520,
    }),
  };
}

function buildTotalWallTimeChart(report) {
  const rows = sortByComposite(report.modelSummary ?? report.leaderboard ?? [])
    .filter((entry) => Number.isFinite(entry.totalWallTimeMs))
    .sort((left, right) => left.totalWallTimeMs - right.totalWallTimeMs);
  return buildModelBarChart({
    rows,
    metricKey: 'totalWallTimeMs',
    title: 'Total wall time',
    axisTitle: 'Minutes',
    valueFormatter: (value) => Number((((value ?? 0) / 60000)).toFixed(2)),
    customText: (row) => `${formatPercentMarkup(row.successRate)} success | ${formatCurrencyMarkup(row.totalCostUsd)} total cost`,
  });
}

function buildTotalRequestsChart(report) {
  const rows = sortByComposite(report.modelSummary ?? report.leaderboard ?? [])
    .filter((entry) => Number.isFinite(entry.totalRequestUnits))
    .sort((left, right) => left.totalRequestUnits - right.totalRequestUnits);
  return buildModelBarChart({
    rows,
    metricKey: 'totalRequestUnits',
    title: 'Total requests',
    axisTitle: 'Request units',
    valueFormatter: (value) => Number((value ?? 0).toFixed(0)),
    customText: (row) => `${formatPercentMarkup(row.successRate)} success | ${formatDurationMarkup(row.totalWallTimeMs)} wall time`,
  });
}

function buildCostByOutcomeChart(report) {
  const models = sortByComposite(report.modelSummary ?? report.leaderboard ?? []);
  const results = Array.isArray(report.results) ? report.results : [];
  if (!models.length || !results.length) {
    return null;
  }

  const costByModel = new Map(models.map((entry) => [entry.model, { success: 0, failure: 0 }]));
  for (const result of results) {
    const bucket = costByModel.get(result.model);
    if (!bucket) {
      continue;
    }
    if (result.success) {
      bucket.success += result.costUsd || 0;
    } else {
      bucket.failure += result.costUsd || 0;
    }
  }

  return {
    data: [
      {
        type: 'bar',
        name: 'Solved tasks cost',
        x: models.map((entry) => entry.model),
        y: models.map((entry) => Number(costByModel.get(entry.model).success.toFixed(4))),
        marker: { color: models.map((entry) => colorForModel(entry.model)), opacity: 0.95 },
      },
      {
        type: 'bar',
        name: 'Failed tasks cost',
        x: models.map((entry) => entry.model),
        y: models.map((entry) => Number(costByModel.get(entry.model).failure.toFixed(4))),
        marker: { color: models.map((entry) => fadeColor(colorForModel(entry.model), 0.42)), opacity: 0.95 },
      },
    ],
    layout: buildChartLayout({
      title: 'Spend split by outcome',
      barmode: 'stack',
      yaxis: { title: 'USD' },
      height: 460,
    }),
  };
}

function buildTokenBreakdownChart(report) {
  const summary = buildTokenSummary(report);
  if (!summary.length) {
    return null;
  }

  const models = summary.map((entry) => entry.model);
  return {
    data: [
      { type: 'bar', name: 'Input', x: models, y: summary.map((entry) => entry.inputTokens), marker: { color: '#2dd4bf' } },
      { type: 'bar', name: 'Output', x: models, y: summary.map((entry) => entry.outputTokens), marker: { color: '#60a5fa' } },
      { type: 'bar', name: 'Reasoning', x: models, y: summary.map((entry) => entry.reasoningTokens), marker: { color: '#c084fc' } },
      { type: 'bar', name: 'Cache read', x: models, y: summary.map((entry) => entry.cacheReadTokens), marker: { color: '#fbbf24' } },
      { type: 'bar', name: 'Cache write', x: models, y: summary.map((entry) => entry.cacheWriteTokens), marker: { color: '#fb7185' } },
    ],
    layout: buildChartLayout({
      title: 'Token breakdown',
      barmode: 'stack',
      yaxis: { title: 'Tokens' },
      height: 460,
    }),
  };
}

function buildCategoryCompositeHeatmap(report) {
  return buildGroupedMetricHeatmap({
    report,
    title: 'Category composite heatmap',
    groupKey: 'category',
    metricKey: 'compositeScore',
    groups: buildCategorySummary(report),
    labelFormatter: (entry) => `${entry.category} (${entry.taskCount} tasks)`,
    textFormatter: (entry) => formatScoreMarkup(entry.averageCompositeScore),
    valueFormatter: (entry) => entry.averageCompositeScore,
    colorscale: [
      [0, '#26122b'],
      [0.25, '#6d1f62'],
      [0.5, '#8b5cf6'],
      [0.75, '#3b82f6'],
      [1, '#73f0c5'],
    ],
    zmin: 0,
    zmax: 1,
    hoverFormatter: (entry) => [
      `Avg composite: ${formatScoreMarkup(entry.averageCompositeScore)}`,
      `Avg success: ${formatPercentMarkup(entry.averageSuccessRate)}`,
      `Avg requests: ${formatDecimalMarkup(entry.averageRequestUnits, 2)}`,
      `Avg cost: ${formatCurrencyMarkup(entry.averageCostUsd)}`,
      `Tasks in category: ${formatIntegerMarkup(entry.taskCount)}`,
    ],
  });
}

function buildDifficultySuccessHeatmap(report) {
  return buildGroupedMetricHeatmap({
    report,
    title: 'Difficulty success heatmap',
    groupKey: 'difficulty',
    metricKey: 'averageSuccessRate',
    groups: buildDifficultySummary(report),
    labelFormatter: (entry) => `${entry.difficulty} (${entry.taskCount} tasks)`,
    textFormatter: (entry) => formatPercentMarkup(entry.averageSuccessRate),
    valueFormatter: (entry) => entry.averageSuccessRate,
    colorscale: [
      [0, '#ef4444'],
      [0.5, '#f59e0b'],
      [1, '#22c55e'],
    ],
    zmin: 0,
    zmax: 1,
    hoverFormatter: (entry) => [
      `Avg success: ${formatPercentMarkup(entry.averageSuccessRate)}`,
      `Avg composite: ${formatScoreMarkup(entry.averageCompositeScore)}`,
      `Avg requests: ${formatDecimalMarkup(entry.averageRequestUnits, 2)}`,
      `Avg cost: ${formatCurrencyMarkup(entry.averageCostUsd)}`,
      `Tasks in band: ${formatIntegerMarkup(entry.taskCount)}`,
    ],
  });
}

function buildTaskCompositeHeatmap(report) {
  return buildTaskHeatmap({
    report,
    metricKey: 'compositeScore',
    title: 'Task composite heatmap',
    colorscale: [
      [0, '#26122b'],
      [0.25, '#6d1f62'],
      [0.5, '#8b5cf6'],
      [0.75, '#3b82f6'],
      [1, '#73f0c5'],
    ],
    zmin: 0,
    zmax: 1,
    textFormatter: (row) => formatScoreMarkup(row.compositeScore),
    hoverFormatter: (row) => [
      `Composite: ${formatScoreMarkup(row.compositeScore)}`,
      `Success: ${formatPercentMarkup(row.successRate)}`,
      `Avg requests: ${formatDecimalMarkup(row.averageRequestUnits, 2)}`,
      `Avg cost: ${formatCurrencyMarkup(row.averageCostUsd)}`,
      `Avg wall time: ${formatDurationMarkup(row.averageWallTimeMs)}`,
    ],
  });
}

function buildTaskCostHeatmap(report) {
  return buildTaskHeatmap({
    report,
    metricKey: 'averageCostUsd',
    title: 'Task cost heatmap',
    colorscale: [
      [0, '#73f0c5'],
      [0.3, '#22c55e'],
      [0.6, '#f59e0b'],
      [1, '#ef4444'],
    ],
    reverseScale: false,
    textFormatter: (row) => formatCurrencyMarkup(row.averageCostUsd),
    hoverFormatter: (row) => [
      `Avg cost: ${formatCurrencyMarkup(row.averageCostUsd)}`,
      `Composite: ${formatScoreMarkup(row.compositeScore)}`,
      `Avg requests: ${formatDecimalMarkup(row.averageRequestUnits, 2)}`,
      `Avg wall time: ${formatDurationMarkup(row.averageWallTimeMs)}`,
    ],
  });
}

function buildTaskDurationHeatmap(report) {
  return buildTaskHeatmap({
    report,
    metricKey: 'averageWallTimeMs',
    title: 'Task duration heatmap',
    colorscale: [
      [0, '#73f0c5'],
      [0.3, '#06b6d4'],
      [0.6, '#f59e0b'],
      [1, '#ef4444'],
    ],
    textFormatter: (row) => formatDurationMarkup(row.averageWallTimeMs),
    valueTransformer: (value) => Number((((value ?? 0) / 1000)).toFixed(1)),
    hoverFormatter: (row) => [
      `Avg wall time: ${formatDurationMarkup(row.averageWallTimeMs)}`,
      `Composite: ${formatScoreMarkup(row.compositeScore)}`,
      `Avg requests: ${formatDecimalMarkup(row.averageRequestUnits, 2)}`,
      `Avg cost: ${formatCurrencyMarkup(row.averageCostUsd)}`,
    ],
  });
}

function buildModelBarChart({ rows, metricKey, title, axisTitle, valueFormatter, customText }) {
  if (!rows.length) {
    return null;
  }

  return {
    data: [
      {
        type: 'bar',
        x: rows.map((entry) => entry.model),
        y: rows.map((entry) => valueFormatter(entry[metricKey])),
        marker: {
          color: rows.map((entry) => colorForModel(entry.model)),
          line: { color: 'rgba(255,255,255,0.22)', width: 1.5 },
        },
        text: rows.map((entry) => valueFormatter(entry[metricKey])),
        textposition: 'auto',
        textfont: { color: CHART_THEME.text, size: 12 },
        hovertemplate: rows.map((entry) => `${entry.model}<br>${axisTitle}: ${escapeHtmlMarkup(String(valueFormatter(entry[metricKey])))}<br>${escapeHtmlMarkup(customText(entry))}<extra></extra>`),
      },
    ],
    layout: buildChartLayout({
      title,
      yaxis: { title: axisTitle },
      height: 420,
    }),
  };
}

function buildTaskHeatmap({ report, metricKey, title, colorscale, zmin = null, zmax = null, textFormatter, hoverFormatter, valueTransformer = (value) => value }) {
  const { models, tasks, matrix } = buildTaskMatrix(report);
  if (!models.length || !tasks.length) {
    return null;
  }

  const z = tasks.map((task) => models.map((model) => {
    const row = matrix.get(task.id)?.get(model.model) || null;
    return row && Number.isFinite(row[metricKey]) ? valueTransformer(row[metricKey]) : null;
  }));
  const text = tasks.map((task) => models.map((model) => {
    const row = matrix.get(task.id)?.get(model.model) || null;
    return row ? textFormatter(row) : 'n/a';
  }));
  const customdata = tasks.map((task) => models.map((model) => {
    const row = matrix.get(task.id)?.get(model.model) || null;
    return row ? hoverFormatter(row).join('<br>') : 'No run published';
  }));

  return {
    data: [
      {
        type: 'heatmap',
        x: models.map((entry) => entry.model),
        y: tasks.map((entry) => `${entry.name} [${entry.difficulty || 'n/a'}]`),
        z,
        text,
        customdata,
        texttemplate: '%{text}',
        textfont: { size: 11, color: '#edf2ff' },
        colorscale,
        zmin,
        zmax,
        xgap: 2,
        ygap: 2,
        hovertemplate: '%{x}<br>%{y}<br>%{customdata}<extra></extra>',
        colorbar: { tickfont: { color: '#99a4c8' } },
      },
    ],
    layout: buildChartLayout({
      title,
      height: Math.max(420, 110 + (tasks.length * 34)),
      margin: { l: 240, r: 24, t: 54, b: 90 },
      xaxis: { tickangle: -24 },
      yaxis: { automargin: true, autorange: 'reversed' },
    }),
  };
}

function buildGroupedMetricHeatmap({ report, title, groupKey, groups, labelFormatter, textFormatter, valueFormatter, colorscale, zmin = null, zmax = null, hoverFormatter }) {
  const models = sortByComposite(report.modelSummary ?? report.leaderboard ?? []);
  if (!models.length || !groups.length) {
    return null;
  }

  const groupedRows = new Map();
  for (const group of groups) {
    groupedRows.set(group[groupKey], new Map(group.models.map((entry) => [entry.model, entry])));
  }

  const z = groups.map((group) => models.map((model) => {
    const row = groupedRows.get(group[groupKey])?.get(model.model) || null;
    return row ? valueFormatter(row) : null;
  }));
  const text = groups.map((group) => models.map((model) => {
    const row = groupedRows.get(group[groupKey])?.get(model.model) || null;
    return row ? textFormatter(row) : 'n/a';
  }));
  const customdata = groups.map((group) => models.map((model) => {
    const row = groupedRows.get(group[groupKey])?.get(model.model) || null;
    return row ? hoverFormatter(row).join('<br>') : 'No published rows';
  }));

  return {
    data: [
      {
        type: 'heatmap',
        x: models.map((entry) => entry.model),
        y: groups.map((entry) => labelFormatter(entry)),
        z,
        text,
        customdata,
        texttemplate: '%{text}',
        textfont: { size: 11, color: '#edf2ff' },
        colorscale,
        zmin,
        zmax,
        xgap: 2,
        ygap: 2,
        hovertemplate: '%{x}<br>%{y}<br>%{customdata}<extra></extra>',
        colorbar: { tickfont: { color: '#99a4c8' } },
      },
    ],
    layout: buildChartLayout({
      title,
      height: Math.max(320, 140 + (groups.length * 72)),
      margin: { l: 180, r: 24, t: 54, b: 90 },
      xaxis: { tickangle: -24 },
      yaxis: { automargin: true, autorange: 'reversed' },
    }),
  };
}

function buildChartLayout(overrides = {}) {
  return {
    paper_bgcolor: CHART_THEME.paper,
    plot_bgcolor: CHART_THEME.plot,
    font: { family: 'Inter, ui-sans-serif, system-ui, sans-serif', color: CHART_THEME.text, size: 13 },
    title: { font: { color: CHART_THEME.text, size: 20 } },
    hoverlabel: { bgcolor: CHART_THEME.hover, bordercolor: CHART_THEME.border, font: { color: CHART_THEME.text } },
    legend: { font: { color: CHART_THEME.muted }, orientation: 'h', x: 0, y: 1.12 },
    margin: { l: 72, r: 24, t: 72, b: 82 },
    height: 440,
    xaxis: {
      automargin: true,
      tickfont: { size: 12, color: CHART_THEME.muted },
      titlefont: { color: CHART_THEME.text, size: 13 },
      gridcolor: CHART_THEME.grid,
      linecolor: CHART_THEME.border,
      zerolinecolor: CHART_THEME.grid,
      tickangle: -18,
    },
    yaxis: {
      automargin: true,
      zeroline: false,
      tickfont: { size: 12, color: CHART_THEME.muted },
      titlefont: { color: CHART_THEME.text, size: 13 },
      gridcolor: CHART_THEME.grid,
      linecolor: CHART_THEME.border,
    },
    ...overrides,
    margin: { l: 72, r: 24, t: 72, b: 82, ...(overrides.margin || {}) },
    xaxis: {
      automargin: true,
      tickfont: { size: 12, color: CHART_THEME.muted },
      titlefont: { color: CHART_THEME.text, size: 13 },
      gridcolor: CHART_THEME.grid,
      linecolor: CHART_THEME.border,
      zerolinecolor: CHART_THEME.grid,
      tickangle: -18,
      ...(overrides.xaxis || {}),
    },
    yaxis: {
      automargin: true,
      zeroline: false,
      tickfont: { size: 12, color: CHART_THEME.muted },
      titlefont: { color: CHART_THEME.text, size: 13 },
      gridcolor: CHART_THEME.grid,
      linecolor: CHART_THEME.border,
      ...(overrides.yaxis || {}),
    },
  };
}

function colorForModel(model) {
  let hash = 0;
  for (let index = 0; index < model.length; index += 1) {
    hash = ((hash * 31) + model.charCodeAt(index)) >>> 0;
  }
  return MODEL_COLOR_PALETTE[hash % MODEL_COLOR_PALETTE.length];
}

function fadeColor(hexColor, opacity) {
  const match = /^#([0-9a-f]{6})$/i.exec(hexColor);
  if (!match) {
    return hexColor;
  }
  const value = match[1];
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

function buildTaskMatrix(report) {
  const models = sortByComposite(report.modelSummary ?? report.leaderboard ?? []);
  const taskCatalog = Array.isArray(report.taskCatalog) ? report.taskCatalog : [];
  const taskSummary = Array.isArray(report.taskSummary) ? report.taskSummary : [];
  const taskMap = new Map(taskCatalog.map((task) => [task.id, task]));
  const matrix = new Map();

  for (const row of taskSummary) {
    if (!matrix.has(row.taskId)) {
      matrix.set(row.taskId, new Map());
    }
    matrix.get(row.taskId).set(row.model, row);
    if (!taskMap.has(row.taskId)) {
      taskMap.set(row.taskId, {
        id: row.taskId,
        name: row.taskName,
        difficulty: null,
        requiredCapabilities: row.requiredCapabilities || [],
      });
    }
  }

  const tasks = [...taskMap.values()].sort((left, right) => {
    const leftIndex = taskCatalog.findIndex((entry) => entry.id === left.id);
    const rightIndex = taskCatalog.findIndex((entry) => entry.id === right.id);
    if (leftIndex !== -1 && rightIndex !== -1) {
      return leftIndex - rightIndex;
    }
    if (leftIndex !== -1) {
      return -1;
    }
    if (rightIndex !== -1) {
      return 1;
    }
    return String(left.name || left.id).localeCompare(String(right.name || right.id));
  });

  return { models, tasks, matrix };
}

function buildPublishedTaskSummary(report) {
  return sortByComposite(report.taskSummary ?? []).map((row) => {
    const failureSummary = summarizeTaskFailureEvidence(report, row);
    return {
      ...row,
      outcome: summarizeTaskOutcome(row, failureSummary),
      outcomeTone: taskOutcomeTone(row, failureSummary),
      failureSummary,
      failureDetail: buildFailureDetailLine(failureSummary),
    };
  });
}

function summarizeTaskOutcome(row, failureSummary = row?.failureSummary || null) {
  const failureOutcome = failureSummary?.outcomeLabel || null;
  if (failureOutcome && failureOutcome.startsWith('provider-')) {
    return failureOutcome;
  }
  if (Number.isFinite(row?.dnfs) && row.dnfs > 0) {
    return 'dnf';
  }
  if (row?.successRate === 1) {
    return 'passed';
  }
  if (row?.successRate === 0) {
    return 'failed';
  }
  return 'mixed';
}

function taskOutcomeTone(row, failureSummary = row?.failureSummary || null) {
  if ((failureSummary?.outcomeLabel || '').startsWith('provider-') || row?.providerLimited) return 'warn';
  if (Number.isFinite(row?.dnfs) && row.dnfs > 0) return 'warn';
  if (row?.successRate === 1) return 'good';
  return 'bad';
}

function summarizeTaskFailureEvidence(report, row) {
  const entries = (report?.results || []).filter((entry) => entry.taskId === row?.taskId && entry.model === row?.model);
  const failure = selectRepresentativeFailure(entries);
  if (!failure) {
    return null;
  }

  const summary = summarizeFailureEvidence(failure);
  return summary;
}

function buildBenchmarkedModels(report) {
  const catalogModels = report.modelCatalog?.models || [];
  const catalogByModel = new Map(catalogModels.map((entry) => [entry.model, entry]));
  return sortByComposite(report.modelSummary ?? report.leaderboard ?? []).map((summary) => {
    const catalogEntry = catalogByModel.get(summary.model) || null;
    return {
      model: summary.model,
      compositeScore: summary.compositeScore ?? null,
      successRate: summary.successRate ?? null,
      totalCostUsd: summary.totalCostUsd ?? null,
      totalWallTimeMs: summary.totalWallTimeMs ?? null,
      totalRequestUnits: summary.totalRequestUnits ?? null,
      priceTier: catalogEntry?.priceTier ?? null,
      devTier: catalogEntry?.devTier ?? null,
      recommendedUse: catalogEntry?.recommendedUse ?? null,
      family: catalogEntry?.family ?? null,
      intelligenceScore: catalogEntry?.benchmark?.intelligenceScore ?? null,
      agenticScore: catalogEntry?.benchmark?.agenticScore ?? null,
      speedTokensPerSecond: catalogEntry?.benchmark?.speedTokensPerSecond ?? null,
      blendedPricePer1mTokensUsd: catalogEntry?.benchmark?.blendedPricePer1mTokensUsd ?? null,
      sourceUrl: catalogEntry?.benchmark?.sourceUrl ?? null,
      pricingNotes: catalogEntry?.benchmark?.pricingNotes ?? null,
      headlessFriendly: catalogEntry?.stability?.headlessFriendly ?? null,
      stabilityNotes: catalogEntry?.stability?.notes ?? null,
      unattendedBenchmarkRuns: catalogEntry?.featureSupport?.unattendedBenchmarkRuns ?? null,
      knownLimitations: catalogEntry?.featureSupport?.knownLimitations ?? [],
    };
  });
}

function buildBenchmarkComposition(report) {
  const tasks = Array.isArray(report.taskCatalog) ? report.taskCatalog : [];
  const results = Array.isArray(report.results) ? report.results : [];
  const categoryCounts = new Map();
  const difficultyCounts = new Map();
  const requiredCapabilities = new Set();

  for (const task of tasks) {
    const category = taskCategoryForTask(report, task.id) || 'uncategorized';
    categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    const difficulty = task.difficulty || 'unspecified';
    difficultyCounts.set(difficulty, (difficultyCounts.get(difficulty) || 0) + 1);
    for (const capability of task.requiredCapabilities || []) {
      requiredCapabilities.add(capability);
    }
  }

  const totalRequestUnits = sum(results.map((entry) => entry.requestUnits || 0));
  const totalCostUsd = sum(results.map((entry) => entry.costUsd || 0));
  const totalDurationMs = sum(results.map((entry) => entry.durationMs || 0));

  return {
    taskCount: tasks.length,
    categoryCount: categoryCounts.size,
    difficultyCount: difficultyCounts.size,
    requiredCapabilities: [...requiredCapabilities].sort(),
    categories: [...categoryCounts.entries()].map(([label, count]) => ({ label, count })).sort((left, right) => right.count - left.count || left.label.localeCompare(right.label)),
    difficulties: [...difficultyCounts.entries()].map(([label, count]) => ({ label, count })).sort((left, right) => right.count - left.count || left.label.localeCompare(right.label)),
    totalRequestUnits,
    totalCostUsd,
    totalDurationMs,
  };
}

function buildLeaderboardHighlights(report) {
  const models = sortByComposite(report.modelSummary ?? report.leaderboard ?? []);
  if (!models.length) {
    return [];
  }

  const cheapest = [...models].filter((entry) => Number.isFinite(entry.totalCostUsd)).sort((a, b) => a.totalCostUsd - b.totalCostUsd)[0] || null;
  const fastest = [...models].filter((entry) => Number.isFinite(entry.totalWallTimeMs)).sort((a, b) => a.totalWallTimeMs - b.totalWallTimeMs)[0] || null;
  const leanest = [...models].filter((entry) => Number.isFinite(entry.orpt)).sort((a, b) => a.orpt - b.orpt)[0] || null;
  const reliable = [...models].filter((entry) => Number.isFinite(entry.successRate)).sort((a, b) => b.successRate - a.successRate)[0] || null;
  return [
    cheapest ? { label: 'Cheapest full run', model: cheapest.model, value: formatCurrencyMarkup(cheapest.totalCostUsd), detail: `${formatScoreMarkup(cheapest.compositeScore)} composite` } : null,
    fastest ? { label: 'Fastest full run', model: fastest.model, value: formatDurationMarkup(fastest.totalWallTimeMs), detail: `${formatPercentMarkup(fastest.successRate)} success` } : null,
    leanest ? { label: 'Best ORPT', model: leanest.model, value: formatDecimalMarkup(leanest.orpt, 2), detail: 'requests per solved task' } : null,
    reliable ? { label: 'Most reliable', model: reliable.model, value: formatPercentMarkup(reliable.successRate), detail: `${formatIntegerMarkup(reliable.successfulTasks)} solved tasks` } : null,
  ].filter(Boolean);
}

function buildPairwiseSummary(report) {
  const models = sortByComposite(report.modelSummary ?? report.leaderboard ?? []);
  const { tasks, matrix } = buildTaskMatrix(report);
  if (models.length < 2 || !tasks.length) {
    return [];
  }

  const pairs = [];
  for (let leftIndex = 0; leftIndex < models.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < models.length; rightIndex += 1) {
      const left = models[leftIndex];
      const right = models[rightIndex];
      let leftWins = 0;
      let rightWins = 0;
      let ties = 0;
      for (const task of tasks) {
        const leftRow = matrix.get(task.id)?.get(left.model) || null;
        const rightRow = matrix.get(task.id)?.get(right.model) || null;
        if (!leftRow || !rightRow) {
          continue;
        }
        const delta = toComparableNumber(leftRow.compositeScore) - toComparableNumber(rightRow.compositeScore);
        if (delta > 0.000001) {
          leftWins += 1;
        } else if (delta < -0.000001) {
          rightWins += 1;
        } else {
          ties += 1;
        }
      }
      pairs.push({
        leftModel: left.model,
        rightModel: right.model,
        leftWins,
        rightWins,
        ties,
        comparedTasks: leftWins + rightWins + ties,
        margin: leftWins - rightWins,
      });
    }
  }

  return pairs.sort((a, b) => Math.abs(b.margin) - Math.abs(a.margin) || b.comparedTasks - a.comparedTasks);
}

function buildCategorySummary(report) {
  const taskSummary = Array.isArray(report.taskSummary) ? report.taskSummary : [];
  const grouped = new Map();
  for (const row of taskSummary) {
    const category = row.category || taskCategoryForTask(report, row.taskId) || 'uncategorized';
    if (!grouped.has(category)) {
      grouped.set(category, new Map());
    }
    const modelGroup = grouped.get(category);
    if (!modelGroup.has(row.model)) {
      modelGroup.set(row.model, []);
    }
    modelGroup.get(row.model).push(row);
  }

  return [...grouped.entries()].map(([category, byModel]) => ({
    category,
    taskCount: new Set(taskSummary.filter((row) => (row.category || taskCategoryForTask(report, row.taskId) || 'uncategorized') === category).map((row) => row.taskId)).size,
    models: [...byModel.entries()].map(([model, rows]) => summarizeTaskRows(model, rows)),
  })).sort((left, right) => right.taskCount - left.taskCount || left.category.localeCompare(right.category));
}

function buildDifficultySummary(report) {
  const taskSummary = Array.isArray(report.taskSummary) ? report.taskSummary : [];
  const difficultyByTask = new Map((report.taskCatalog || []).map((task) => [task.id, task.difficulty || 'unspecified']));
  const grouped = new Map();
  for (const row of taskSummary) {
    const difficulty = difficultyByTask.get(row.taskId) || 'unspecified';
    if (!grouped.has(difficulty)) {
      grouped.set(difficulty, new Map());
    }
    const modelGroup = grouped.get(difficulty);
    if (!modelGroup.has(row.model)) {
      modelGroup.set(row.model, []);
    }
    modelGroup.get(row.model).push(row);
  }

  return [...grouped.entries()].map(([difficulty, byModel]) => ({
    difficulty,
    taskCount: new Set(taskSummary.filter((row) => (difficultyByTask.get(row.taskId) || 'unspecified') === difficulty).map((row) => row.taskId)).size,
    models: [...byModel.entries()].map(([model, rows]) => summarizeTaskRows(model, rows)),
  })).sort((left, right) => left.difficulty.localeCompare(right.difficulty));
}

function buildTokenSummary(report) {
  const byModel = new Map();
  for (const result of report.results || []) {
    if (!byModel.has(result.model)) {
      byModel.set(result.model, {
        model: result.model,
        inputTokens: 0,
        outputTokens: 0,
        reasoningTokens: 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
      });
    }
    const bucket = byModel.get(result.model);
    const tokens = result.tokens || {};
    bucket.inputTokens += tokens.input || 0;
    bucket.outputTokens += tokens.output || 0;
    bucket.reasoningTokens += tokens.reasoning || 0;
    bucket.cacheReadTokens += tokens.cache?.read || 0;
    bucket.cacheWriteTokens += tokens.cache?.write || 0;
  }

  return sortByComposite(report.modelSummary ?? report.leaderboard ?? []).map((entry) => byModel.get(entry.model)).filter(Boolean);
}

function summarizeTaskRows(model, rows) {
  return {
    model,
    taskCount: rows.length,
    averageCompositeScore: average(rows.map((entry) => entry.compositeScore ?? 0)) || 0,
    averageSuccessRate: average(rows.map((entry) => entry.successRate ?? 0)) || 0,
    averageRequestUnits: average(rows.map((entry) => entry.averageRequestUnits ?? 0)) || 0,
    averageCostUsd: average(rows.map((entry) => entry.averageCostUsd ?? 0)) || 0,
    averageWallTimeMs: average(rows.map((entry) => entry.averageWallTimeMs ?? 0)) || 0,
  };
}

function taskCategoryForTask(report, taskId) {
  const taskSummaryRow = (report.taskSummary || []).find((entry) => entry.taskId === taskId && entry.category);
  return taskSummaryRow?.category || null;
}

function average(values) {
  const filtered = values.filter((value) => Number.isFinite(value));
  if (!filtered.length) {
    return null;
  }
  return sum(filtered) / filtered.length;
}

function sum(values) {
  return values.reduce((total, value) => total + (Number.isFinite(value) ? value : 0), 0);
}

function sumDefined(values) {
  const filtered = values.filter((value) => Number.isFinite(value));
  if (!filtered.length) {
    return null;
  }
  return sum(filtered);
}

function renderStandaloneChartHtml({ title, data, layout }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtmlMarkup(title)}</title>
  <script src="https://cdn.plot.ly/plotly-2.35.2.min.js"></script>
</head>
<body>
  <div id="chart" style="width:100%;height:90vh"></div>
  <script>
    const data = ${JSON.stringify(data)};
    const layout = ${JSON.stringify(layout)};
    Plotly.newPlot('chart', data, layout, {responsive: true});
  </script>
</body>
</html>
`;
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

function summarizeHistoricalRun(fileName, report, latestRunId) {
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
    href: fileName ? `results/history/${fileName}` : null,
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

function formatScoreMarkup(value) {
  if (!Number.isFinite(value)) {
    return 'n/a';
  }
  return Number(value).toFixed(3).replace(/0+$/, '').replace(/\.$/, '.0');
}

function formatPercentMarkup(value) {
  if (!Number.isFinite(value)) {
    return 'n/a';
  }
  return `${Math.round(value * 100)}%`;
}

function formatDecimalMarkup(value, decimals) {
  if (!Number.isFinite(value)) {
    return 'n/a';
  }
  return Number(value).toFixed(decimals);
}

function formatCurrencyMarkup(value) {
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

function formatIntegerMarkup(value) {
  if (!Number.isFinite(value)) {
    return 'n/a';
  }
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
}

function formatDurationMarkup(value) {
  if (!Number.isFinite(value)) {
    return 'n/a';
  }
  const seconds = Math.round(value / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (minutes === 0) {
    return `${remainder}s`;
  }
  return `${minutes}m ${String(remainder).padStart(2, '0')}s`;
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
    .hero { padding: 24px 26px; margin-bottom: 18px; }
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
    .hero-grid, .stats-grid, .chart-grid, .docs-grid, .insight-grid, .summary-grid, .executive-grid { display: grid; gap: 16px; }
    .hero-grid { grid-template-columns: minmax(0, 1.6fr) minmax(320px, 0.8fr); align-items: start; gap: 20px; }
    .eyebrow, .hint, .micro { font-family: var(--mono); letter-spacing: 0.04em; text-transform: uppercase; }
    .eyebrow { color: var(--accent); font-size: 0.78rem; margin-bottom: 10px; }
    h1, h2, h3, p { margin: 0; }
    h1 { font-size: clamp(1.8rem, 4vw, 3.1rem); line-height: 0.96; letter-spacing: -0.04em; max-width: 18ch; margin-bottom: 12px; }
    .hero p, .panel-copy, .muted { color: var(--muted); line-height: 1.6; }
    .hero-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 16px; }
    .summary-list { display: grid; gap: 10px; }
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
    .executive-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .chart-grid, .docs-grid, .model-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .insight-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .chart-card, .doc-card, .table-panel { padding: 20px; }
    .chart-card.featured { grid-column: 1 / -1; }
    .chart-card.wide { grid-column: 1 / -1; }
    .chart-card iframe {
      width: 100%;
      height: 460px;
      border: 0;
      border-radius: 12px;
      background: linear-gradient(180deg, rgba(8, 16, 31, 0.98), rgba(13, 24, 48, 0.98));
      margin: 14px 0 12px;
      box-shadow: inset 0 0 0 1px rgba(153, 164, 200, 0.12);
    }
    .chart-card.featured iframe { height: 620px; }
    .chart-card.wide iframe { height: 720px; }
    .chart-card.compact iframe { height: 340px; }
    .chart-card.compact .chart-note { margin-top: 6px; }
    .chart-card.executive h3 { font-size: 1.05rem; }
    .chart-card.executive .panel-copy { line-height: 1.5; }
    .chart-card.executive .card-actions { margin-top: 10px; }
    .card-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
    .card-link {
      padding: 9px 12px;
      border-radius: 999px;
      border: 1px solid var(--border);
      color: var(--text);
      font-size: 0.9rem;
    }
    .table-panel { padding-bottom: 8px; }
    .chart-note { color: var(--muted); font-size: 0.88rem; line-height: 1.55; margin-top: 8px; }
    .chart-note:empty { display: none; }
    details.disclosure {
      border: 1px solid rgba(122, 162, 255, 0.12);
      border-radius: var(--radius-sm);
      background: rgba(9, 14, 28, 0.78);
      padding: 18px 20px;
    }
    details.disclosure summary {
      cursor: pointer;
      list-style: none;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      font-weight: 600;
    }
    details.disclosure summary::-webkit-details-marker { display: none; }
    details.disclosure summary::after {
      content: '+';
      color: var(--accent);
      font-family: var(--mono);
      font-size: 1rem;
    }
    details.disclosure[open] summary::after { content: '-'; }
    .disclosure-copy { color: var(--muted); font-size: 0.92rem; margin-top: 6px; }
    .disclosure-body { margin-top: 16px; }
    .insight-card {
      border: 1px solid rgba(122, 162, 255, 0.12);
      border-radius: var(--radius-sm);
      background: rgba(9, 14, 28, 0.78);
      padding: 18px;
    }
    .insight-value { font-size: 1.2rem; font-weight: 700; margin: 6px 0; }
    .insight-detail { color: var(--muted); font-size: 0.88rem; }
    .list-panel { padding: 18px; }
    .key-list { display: grid; gap: 10px; margin-top: 14px; }
    .key-row {
      display: flex;
      align-items: start;
      justify-content: space-between;
      gap: 14px;
      padding: 12px 14px;
      border: 1px solid rgba(122, 162, 255, 0.08);
      border-radius: 12px;
      background: rgba(7, 10, 20, 0.72);
    }
    .key-row strong { display: block; margin-bottom: 4px; }
    .key-row-value { text-align: right; font-weight: 700; }
    .matrix-wrap { overflow: auto; margin-top: 14px; }
    .task-matrix {
      min-width: 960px;
      display: grid;
      gap: 2px;
      background: rgba(122, 162, 255, 0.08);
      border: 1px solid rgba(122, 162, 255, 0.08);
      border-radius: 14px;
      padding: 2px;
    }
    .matrix-cell {
      background: rgba(7, 10, 20, 0.92);
      padding: 12px;
      min-height: 86px;
    }
    .matrix-head {
      position: sticky;
      top: 0;
      z-index: 1;
      background: rgba(12, 18, 35, 0.98);
      color: var(--text);
      font-weight: 600;
    }
    .matrix-task {
      position: sticky;
      left: 0;
      z-index: 1;
      background: rgba(12, 18, 35, 0.98);
    }
    .matrix-metric { font-size: 0.8rem; color: var(--muted); margin-top: 6px; line-height: 1.45; }
    .matrix-score { font-size: 1rem; font-weight: 700; }
    .model-cards { display: grid; gap: 16px; }
    .model-card {
      border: 1px solid rgba(122, 162, 255, 0.12);
      border-radius: var(--radius-sm);
      background: rgba(9, 14, 28, 0.78);
      padding: 18px;
    }
    .model-meta { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0 14px; }
    .stat-list { display: grid; gap: 8px; }
    .stat-row { display: flex; justify-content: space-between; gap: 12px; color: var(--muted); font-size: 0.9rem; }
    .stat-row strong { color: var(--text); font-weight: 600; }
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
    .pill.bad { color: var(--danger); border-color: rgba(255, 122, 154, 0.24); background: rgba(255, 122, 154, 0.08); }
    .empty { padding: 22px; border-radius: 14px; border: 1px dashed rgba(122, 162, 255, 0.16); color: var(--muted); }
    footer { margin-top: 22px; padding: 18px 2px 0; color: var(--muted); font-size: 0.92rem; }
    @media (max-width: 1180px) {
      .hero-grid, .stats-grid, .chart-grid, .docs-grid, .model-cards, .insight-grid, .summary-grid { grid-template-columns: 1fr 1fr; }
      .executive-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 840px) {
      .shell { width: min(100vw - 20px, 1380px); padding-top: 14px; }
      .topbar { position: static; border-radius: 22px; }
      .hero, .panel, .chart-card, .doc-card, .table-panel, .metric { padding: 16px; }
      .hero-grid, .stats-grid, .chart-grid, .docs-grid, .model-cards, .insight-grid, .summary-grid, .executive-grid, .section-header {
        grid-template-columns: 1fr;
        flex-direction: column;
        align-items: stretch;
      }
      .chart-grid, .docs-grid, .model-cards, .insight-grid, .summary-grid, .executive-grid { grid-template-columns: 1fr; }
      .chart-card iframe { height: 340px; }
      .chart-card.featured iframe { height: 420px; }
      .chart-card.wide iframe { height: 520px; }
      .chart-card.compact iframe { height: 320px; }
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
        <a href="#charts">Summary</a>
        <a href="#comparison">Comparison</a>
        <a href="#matrix">Matrix</a>
        <a href="#insights">Insights</a>
        <a href="#catalog">Catalog</a>
        <a href="#reference">Reference</a>
      </div>
    </div>
      <section class="hero">
        <div class="hero-grid">
          <div>
            <div class="eyebrow">OpenCode benchmark publication</div>
            <h1>Results first. Context when you need it.</h1>
            <p>ORPT-Bench measures task completion, efficiency, time, and cost across a fixed repair-oriented suite. This view now leads with the benchmark answers: who finishes the work, who delivers value, and what you pay for it.</p>
            <div class="hero-actions" id="hero-actions"></div>
            <div class="hint">Hint: every comparison table is sortable and starts in composite-score order.</div>
          </div>
          <div class="summary-list">
            <div class="summary-item">
              <strong>What changed</strong>
              <div class="muted">Top-line model results and the cost frontier appear immediately. Reference material stays available below in expandable sections.</div>
            </div>
            <div class="summary-item">
              <strong>How to read the scores</strong>
              <div class="muted">Completion score is raw task completion. Value score captures efficiency after solving. Composite score blends both with the published weighting.</div>
            </div>
          </div>
        </div>
      </section>
      <section class="section" id="charts">
        <div class="section-header">
          <div>
            <div class="section-title">Executive Summary</div>
            <p class="panel-copy">The first row answers the three questions that matter most: can the model finish the work, does it do so efficiently, and how does the blended ranking shake out?</p>
          </div>
        </div>
        ${renderChartCards(selectCharts(data.charts, ['completion-score', 'value-score', 'composite-score']), 'executive')}
        <div class="section-header section">
          <div>
            <div class="section-title">Cost Frontier</div>
            <p class="panel-copy">Completion versus total benchmark cost shows who actually clears the suite and what it costs to get there.</p>
          </div>
        </div>
        ${renderChartCards(selectCharts(data.charts, ['composite-vs-cost']), 'frontier')}
        <div class="panel table-panel section">
          <div class="micro muted">Fast read leaderboard</div>
          <h3>Top 10 models</h3>
          <p class="panel-copy">The top-ranked cohort with the columns you actually need for a quick decision.</p>
          <div id="top-model-table">${renderTopModelsTable(data.modelSummary || [], 10)}</div>
        </div>
      </section>
      <section class="stats-grid" id="stats"></section>
      <section class="section" id="comparison">
        <div class="section-header">
          <div>
            <div class="section-title">Comparison Tables</div>
            <p class="panel-copy">Sortable tables keep the current benchmark state inspectable without forcing users through raw markdown or buried artifacts.</p>
            <div class="hint">Hint: click any column header to re-sort. Composite score is the default.</div>
          </div>
        </div>
        <div class="panel table-panel">
          <div class="micro muted">Comparable cohort overview</div>
          <h3>Model summary</h3>
          <p class="panel-copy">Use this table for the main leaderboard view across models in the latest run.</p>
          <div id="model-summary-table">${renderModelSummaryTable(data.modelSummary || [])}</div>
        </div>
        <div class="panel table-panel section">
          <div class="micro muted">Comparative task readout</div>
          <h3>Task insights</h3>
          <p class="panel-copy">One row per task. See who won, how wide the gap was, whether the field agreed, and what the fastest successful path actually cost.</p>
          <div id="task-summary-table">${renderTaskInsightsTable(data.taskSummary || [], data.taskCatalog || [])}</div>
        </div>
      </section>
      <section class="section" id="matrix">
        <div class="section-header">
          <div>
            <div class="section-title">Task Comparison Matrix</div>
            <p class="panel-copy">Each task row shows exactly how the published models compare on composite score, success, requests, cost, and time for that benchmark target.</p>
          </div>
        </div>
        <div class="panel table-panel">
          <div class="micro muted">Per-task model deltas</div>
          <h3>Task-by-task model matrix</h3>
          <p class="panel-copy">Use this when you need to know not just who won overall, but where they paid for it and where they failed.</p>
          ${renderTaskMatrix(data)}
        </div>
      </section>
      <section class="section" id="insights">
      <div class="section-header">
        <div>
          <div class="section-title">Highlights</div>
            <p class="panel-copy">After the top-line results, these sections answer the next useful questions: who leads each tradeoff, where models separate, and what the benchmark composition looks like.</p>
        </div>
      </div>
      <div class="insight-grid">
        ${renderLeaderboardHighlights(data.leaderboardHighlights || [])}
      </div>
      <div class="summary-grid section">
        <div class="panel list-panel">
          <div class="micro muted">Head-to-head</div>
          <h3>Pairwise outcomes</h3>
          <p class="panel-copy">Task-level pairwise wins show whether the leaderboard leader actually dominates the suite or just edges ahead on aggregate.</p>
          ${renderPairwiseSummary(data.pairwiseSummary || [])}
        </div>
        <div class="panel list-panel">
          <div class="micro muted">Benchmark composition</div>
          <h3>Suite composition</h3>
          <p class="panel-copy">A benchmark is only meaningful if you can see what kinds of tasks dominate the signal.</p>
          ${renderBenchmarkComposition(data.benchmarkComposition)}
        </div>
      </div>
      <div class="panel list-panel section">
        <div class="micro muted">Execution profile</div>
        <h3>Token and execution profile</h3>
        <p class="panel-copy">Observed token mix across the suite helps explain whether a model is spending heavily on reasoning, cached context, or generation.</p>
        ${renderTokenSummary(data.tokenSummary || [])}
      </div>
      <div class="section section-header">
        <div>
          <div class="section-title">Deep Dive Charts</div>
          <p class="panel-copy">The rest of the visual analysis is still here, just moved below the primary answers.</p>
        </div>
      </div>
      ${renderChartCards(selectCharts(data.charts, [], ['completion-score', 'value-score', 'composite-score', 'composite-vs-cost']), 'secondary')}
    </section>
    <section class="section" id="catalog">
      <div class="section-header">
        <div>
          <div class="section-title">Benchmarked Model Cards</div>
          <p class="panel-copy">Published benchmark results paired with catalog metadata make it easier to understand whether a model is cheap, fast, stable, or just happened to land higher this run.</p>
        </div>
      </div>
      ${renderBenchmarkedModels(data.benchmarkedModels || [])}
    </section>
    <section class="section" id="reference">
      <div class="section-header">
        <div>
          <div class="section-title">Reference</div>
          <p class="panel-copy">Less frequently used detail stays available, but out of the critical path.</p>
        </div>
      </div>
      <details class="disclosure section" id="benchmark-context">
        <summary>Benchmark context and splits</summary>
        <div class="disclosure-copy">Category and difficulty summaries, plus benchmark framing for deeper reading.</div>
        <div class="disclosure-body summary-grid">
          <div class="panel list-panel">
            <div class="micro muted">Category splits</div>
            <h3>Category summary</h3>
            <p class="panel-copy">Average quality, speed, and cost by benchmark category.</p>
            ${renderGroupedSummary(data.categorySummary || [], 'category')}
          </div>
          <div class="panel list-panel">
            <div class="micro muted">Difficulty splits</div>
            <h3>Difficulty summary</h3>
            <p class="panel-copy">How performance changes as the suite moves from control to expert tasks.</p>
            ${renderGroupedSummary(data.difficultySummary || [], 'difficulty')}
          </div>
        </div>
      </details>
      <details class="disclosure section" id="smoke">
        <summary>Smoke failures and non-mainline evidence</summary>
        <div class="disclosure-copy">Failed smoke runs are still published for transparency, without occupying prime dashboard space.</div>
        <div class="disclosure-body panel list-panel">
          <div class="micro muted">Published control-task evidence</div>
          <h3>Candidate smoke outcomes</h3>
          <p class="panel-copy">These runs are not mixed into the main full-run leaderboard, but they are intentionally published for transparency, including provider-side failures, timeout behavior, and raw verifier evidence.</p>
          ${renderSmokeRuns(data.smokeRuns || [])}
        </div>
      </details>
      <details class="disclosure section" id="docs">
        <summary>Docs and raw artifacts</summary>
        <div class="disclosure-copy">Raw JSON, schemas, benchmark design, model catalog, and repository links.</div>
        <div class="disclosure-body docs-grid" id="docs-grid"></div>
      </details>
      <details class="disclosure section" id="history">
        <summary>Historical snapshots</summary>
        <div class="disclosure-copy">Archived benchmark snapshots remain available for longitudinal comparisons.</div>
        <div class="disclosure-body panel table-panel">
          <div class="micro muted">If available, older benchmark publications appear here</div>
          <h3>Run history</h3>
          <p class="panel-copy">Snapshots are sorted by their top composite score by default. Use the raw JSON links for detailed offline analysis.</p>
          <div id="history-table"></div>
        </div>
      </details>
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
    heroActions.appendChild(linkButton('#comparison', 'Leaderboard', true));
    heroActions.appendChild(linkButton('#matrix', 'Task matrix'));
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
         note: topModel ? formatPercent(topModel.successRate) + ' success, ' + formatDecimal(topModel.orpt, 2) + ' ORPT, ' + formatCurrency(topModel.totalCostUsd) + ' total cost' : 'No leaderboard data yet',
       },
     ];
    const statsRoot = document.getElementById('stats');
    for (const stat of stats) {
      const node = document.createElement('article');
      node.className = 'metric';
      node.innerHTML = '\\n        <div class="metric-label micro">' + escapeHtml(stat.label) + '</div>\\n        <div class="metric-value">' + escapeHtml(stat.value) + '</div>\\n        <div class="metric-note">' + escapeHtml(stat.note) + '</div>\\n      ';
      statsRoot.appendChild(node);
    }
    const docsGrid = document.getElementById('docs-grid');
    const docCards = [
      { title: 'Benchmark design', summary: 'Benchmark architecture, telemetry rules, and CI publication behavior.', href: docs.designDocPath, label: 'Open design doc' },
      { title: 'Result schema', summary: 'Machine-readable contract for the benchmark JSON artifacts.', href: docs.resultSchemaPath, label: 'Open schema' },
      { title: 'Model catalog', summary: 'Pricing provenance, capability notes, and model inventory details.', href: docs.modelCatalogPath, label: 'Open catalog' },
       { title: 'Published benchmark snapshot', summary: 'Merged full-run publication JSON backing this site, including model and task summaries.', href: docs.latestResultPath, label: 'Open published JSON' },
       { title: 'Latest raw run', summary: 'The most recently written raw benchmark run artifact before publication merging.', href: docs.latestRawResultPath, label: 'Open latest raw run' },
       { title: 'History index', summary: 'Compact index of archived benchmark snapshots published with the site.', href: docs.historyIndexPath, label: 'Open history index' },
       { title: 'Source repository', summary: 'Benchmark harness, task fixtures, and publication pipeline source.', href: docs.sourceUrl, label: 'Open repository' },
     ].filter((card) => card.href);
    for (const card of docCards) {
      const node = document.createElement('article');
      node.className = 'doc-card';
      node.innerHTML = '\\n        <div class="micro muted">Detailed reference</div>\\n        <h3>' + escapeHtml(card.title) + '</h3>\\n        <p class="panel-copy">' + escapeHtml(card.summary) + '</p>\\n      ';
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
        { key: 'dnfTasks', label: 'DNF', type: 'number', render: (row) => formatInteger(row.dnfTasks) },
        { key: 'orpt', label: 'ORPT', type: 'number', render: (row) => formatDecimal(row.orpt, 2) },
        { key: 'totalRequestUnits', label: 'Requests', type: 'number', render: (row) => formatInteger(row.totalRequestUnits) },
         { key: 'totalWallTimeMs', label: 'Wall time', type: 'number', render: (row) => formatDuration(row.totalWallTimeMs) },
         { key: 'totalCostUsd', label: 'Cost', type: 'number', render: (row) => formatCurrency(row.totalCostUsd) },
         { key: 'averageCostUsd', label: 'Avg task cost', type: 'number', render: (row) => formatCurrency(row.averageCostUsd) },
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
         { key: 'outcome', label: 'Outcome', type: 'text', sortValue: (row) => row.outcome || 'unknown', render: (row) => badge(row.outcome || 'unknown', row.outcomeTone || 'warn') + (row.failureDetail ? '<div class="muted">' + escapeHtml(row.failureDetail) + '</div>' : '') },
         { key: 'score', label: 'Score', type: 'number', render: (row) => formatScore(row.score) },
        { key: 'valueScore', label: 'Value', type: 'number', render: (row) => formatScore(row.valueScore) },
        { key: 'compositeScore', label: 'Composite', type: 'number', render: (row) => formatScore(row.compositeScore) },
        { key: 'successRate', label: 'Success', type: 'number', render: (row) => formatPercent(row.successRate) },
         { key: 'dnfs', label: 'DNF', type: 'number', render: (row) => formatInteger(row.dnfs) },
         { key: 'runs', label: 'Runs', type: 'number', render: (row) => formatInteger(row.runs) },
         { key: 'averageRequestUnits', label: 'Avg requests', type: 'number', render: (row) => formatDecimal(row.averageRequestUnits, 2) },
         { key: 'averageWallTimeMs', label: 'Avg wall time', type: 'number', render: (row) => formatDuration(row.averageWallTimeMs) },
         { key: 'averageCostUsd', label: 'Avg cost', type: 'number', render: (row) => formatCurrency(row.averageCostUsd) },
         { key: 'eligible', label: 'Eligible', type: 'text', render: (row) => badge(row.eligible ? 'Scored' : 'Unscored', row.eligible ? 'good' : 'warn') },
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
      return Number(value).toFixed(3).replace(/0+$/, '').replace(/\\.$/, '.0');
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

function renderChartCards(charts, variant = 'default') {
  if (!Array.isArray(charts) || charts.length === 0) {
    return '<div class="empty">No published charts are available for this benchmark run.</div>';
  }

  const gridClass = variant === 'executive' ? 'executive-grid' : 'chart-grid';
  const cardVariantClass = variant === 'executive' ? ' compact executive' : '';

  return `<div class="${gridClass}">
${charts.map((chart) => `        <article class="chart-card${cardVariantClass}${variant !== 'executive' && chart.featured ? ' featured' : ''}${variant !== 'executive' && chart.wide ? ' wide' : ''}">
          <div class="micro muted">${escapeHtmlMarkup(chart.eyebrow)}</div>
          <h3>${escapeHtmlMarkup(chart.title)}</h3>
          <p class="panel-copy">${escapeHtmlMarkup(chart.description)}</p>
          <p class="chart-note">${escapeHtmlMarkup(chartReadingHint(chart))}</p>
          <iframe loading="lazy" src="${escapeAttributeMarkup(chart.htmlPath)}" title="${escapeAttributeMarkup(chart.title)} chart"></iframe>
          <div class="card-actions">
            <a class="card-link" href="${escapeAttributeMarkup(chart.htmlPath)}">Open chart</a>
            <a class="card-link" href="${escapeAttributeMarkup(chart.jsonPath)}">View chart data</a>
          </div>
        </article>`).join('\n')}
       </div>`;
}

function renderTopModelsTable(rows, limit = 10) {
  const topRows = sortByComposite(Array.isArray(rows) ? rows : []).slice(0, limit);
  if (!topRows.length) {
    return '<div class="empty">No model summary is available for the current run.</div>';
  }

  return renderStaticTable({
    rows: topRows,
    columns: [
      { key: 'rank', label: '#', render: (_row, index) => escapeHtmlMarkup(String(index + 1)) },
      { key: 'model', label: 'Model', render: (row) => escapeHtmlMarkup(row.model) },
      { key: 'compositeScore', label: 'Composite', render: (row) => escapeHtmlMarkup(formatScoreMarkup(row.compositeScore)) },
      { key: 'successRate', label: 'Success', render: (row) => escapeHtmlMarkup(formatPercentMarkup(row.successRate)) },
      { key: 'orpt', label: 'ORPT', render: (row) => escapeHtmlMarkup(formatDecimalMarkup(row.orpt, 2)) },
      { key: 'totalCostUsd', label: 'Cost', render: (row) => escapeHtmlMarkup(formatCurrencyMarkup(row.totalCostUsd)) },
      { key: 'totalWallTimeMs', label: 'Wall time', render: (row) => escapeHtmlMarkup(formatDurationMarkup(row.totalWallTimeMs)) },
      { key: 'status', label: 'Status', render: (row) => badgeMarkup(row.comparable ? 'Comparable' : 'Limited', row.comparable ? 'good' : 'warn') },
    ],
  });
}

function renderModelSummaryTable(rows) {
  const normalizedRows = Array.isArray(rows) ? rows : [];
  if (!normalizedRows.length) {
    return '<div class="empty">No model summary is available for the current run.</div>';
  }

  return renderStaticTable({
    rows: normalizedRows,
    columns: [
      { key: 'model', label: 'Model', render: (row) => escapeHtmlMarkup(row.model) },
      { key: 'compositeScore', label: 'Composite', render: (row) => escapeHtmlMarkup(formatScoreMarkup(row.compositeScore)) },
      { key: 'successRate', label: 'Success', render: (row) => escapeHtmlMarkup(formatPercentMarkup(row.successRate)) },
      { key: 'dnfTasks', label: 'DNF', render: (row) => escapeHtmlMarkup(formatIntegerMarkup(row.dnfTasks)) },
      { key: 'orpt', label: 'ORPT', render: (row) => escapeHtmlMarkup(formatDecimalMarkup(row.orpt, 2)) },
      { key: 'totalRequestUnits', label: 'Requests', render: (row) => escapeHtmlMarkup(formatIntegerMarkup(row.totalRequestUnits)) },
      { key: 'totalWallTimeMs', label: 'Wall time', render: (row) => escapeHtmlMarkup(formatDurationMarkup(row.totalWallTimeMs)) },
      { key: 'totalCostUsd', label: 'Cost', render: (row) => escapeHtmlMarkup(formatCurrencyMarkup(row.totalCostUsd)) },
      { key: 'averageCostUsd', label: 'Avg task cost', render: (row) => escapeHtmlMarkup(formatCurrencyMarkup(row.averageCostUsd)) },
      { key: 'comparable', label: 'Status', render: (row) => badgeMarkup(row.comparable ? 'Comparable' : 'Limited', row.comparable ? 'good' : 'warn') },
    ],
  });
}

function renderTaskInsightsTable(rows, taskCatalog) {
  const insightRows = buildTaskInsightRows(rows, taskCatalog);
  if (!insightRows.length) {
    return '<div class="empty">No task summary is available for the current run.</div>';
  }

  return renderStaticTable({
    rows: insightRows,
    columns: [
      { key: 'taskName', label: 'Task', render: (row) => escapeHtmlMarkup(row.taskName) },
      { key: 'category', label: 'Category', render: (row) => escapeHtmlMarkup(row.category) },
      { key: 'winner', label: 'Winner', render: (row) => row.winnerModel ? `${escapeHtmlMarkup(row.winnerModel)}<div class="muted">${escapeHtmlMarkup(formatScoreMarkup(row.winnerCompositeScore))} composite</div>` : badgeMarkup('No scored winner', 'warn') },
      { key: 'runnerUp', label: 'Runner-up', render: (row) => row.runnerUpModel ? `${escapeHtmlMarkup(row.runnerUpModel)}<div class="muted">${escapeHtmlMarkup(formatScoreMarkup(row.runnerUpCompositeScore))} composite</div>` : '<span class="muted">n/a</span>' },
      { key: 'margin', label: 'Gap', render: (row) => escapeHtmlMarkup(formatScoreMarkup(row.margin)) },
      { key: 'completion', label: 'Completion', render: (row) => `${escapeHtmlMarkup(formatIntegerMarkup(row.successfulModels))}/${escapeHtmlMarkup(formatIntegerMarkup(row.modelCount))}<div class="muted">${escapeHtmlMarkup(formatPercentMarkup(row.successCoverage))} models passed</div>` },
      { key: 'cheapestWinnerCost', label: 'Cheapest win', render: (row) => escapeHtmlMarkup(formatCurrencyMarkup(row.cheapestWinnerCostUsd)) },
      { key: 'fastestWinnerTime', label: 'Fastest win', render: (row) => escapeHtmlMarkup(formatDurationMarkup(row.fastestWinnerWallTimeMs)) },
      { key: 'bestOrpt', label: 'Best ORPT', render: (row) => escapeHtmlMarkup(formatDecimalMarkup(row.bestWinnerOrpt, 2)) },
      { key: 'fieldRead', label: 'Field read', render: (row) => badgeMarkup(row.fieldReadLabel, row.fieldReadTone) },
    ],
  });
}

function buildTaskInsightRows(rows, taskCatalog) {
  const normalizedRows = Array.isArray(rows) ? rows : [];
  if (!normalizedRows.length) {
    return [];
  }

  const taskMetaById = new Map((Array.isArray(taskCatalog) ? taskCatalog : []).map((task) => [task.id, task]));
  const grouped = new Map();
  for (const row of normalizedRows) {
    if (!grouped.has(row.taskId)) {
      grouped.set(row.taskId, []);
    }
    grouped.get(row.taskId).push(row);
  }

  const insights = [...grouped.entries()].map(([taskId, taskRows]) => {
    const sorted = [...taskRows].sort((left, right) => toComparableNumber(right.compositeScore) - toComparableNumber(left.compositeScore));
    const winners = sorted.filter((row) => row.eligible && row.successRate > 0);
    const winner = winners[0] || null;
    const runnerUp = winners[1] || null;
    const successfulRows = taskRows.filter((row) => row.successRate > 0);
    const cheapestWinner = successfulRows.filter((row) => Number.isFinite(row.averageCostUsd)).sort((left, right) => left.averageCostUsd - right.averageCostUsd)[0] || null;
    const fastestWinner = successfulRows.filter((row) => Number.isFinite(row.averageWallTimeMs)).sort((left, right) => left.averageWallTimeMs - right.averageWallTimeMs)[0] || null;
    const leanestWinner = successfulRows.filter((row) => Number.isFinite(row.averageRequestUnits)).sort((left, right) => left.averageRequestUnits - right.averageRequestUnits)[0] || null;
    const successfulModels = successfulRows.length;
    const modelCount = taskRows.length;
    const successCoverage = modelCount ? successfulModels / modelCount : 0;
    const margin = winner && runnerUp ? Math.max(0, toComparableNumber(winner.compositeScore) - toComparableNumber(runnerUp.compositeScore)) : winner ? toComparableNumber(winner.compositeScore) : 0;
    const fieldRead = classifyTaskField(successCoverage, margin, successfulModels);

    return {
      taskId,
      taskName: winner?.taskName || sorted[0]?.taskName || taskMetaById.get(taskId)?.name || taskId,
      category: winner?.category || sorted[0]?.category || taskCategoryForTask({ taskSummary: normalizedRows }, taskId) || 'uncategorized',
      winnerModel: winner?.model || null,
      winnerCompositeScore: winner?.compositeScore ?? null,
      runnerUpModel: runnerUp?.model || null,
      runnerUpCompositeScore: runnerUp?.compositeScore ?? null,
      margin,
      successfulModels,
      modelCount,
      successCoverage,
      cheapestWinnerCostUsd: cheapestWinner?.averageCostUsd ?? null,
      fastestWinnerWallTimeMs: fastestWinner?.averageWallTimeMs ?? null,
      bestWinnerOrpt: leanestWinner?.averageRequestUnits ?? null,
      fieldReadLabel: fieldRead.label,
      fieldReadTone: fieldRead.tone,
    };
  });

  return insights.sort((left, right) => {
    const competitivenessDelta = fieldReadRank(right.fieldReadTone) - fieldReadRank(left.fieldReadTone);
    if (competitivenessDelta !== 0) {
      return competitivenessDelta;
    }
    const marginDelta = toComparableNumber(right.margin) - toComparableNumber(left.margin);
    if (marginDelta !== 0) {
      return marginDelta;
    }
    return String(left.taskName).localeCompare(String(right.taskName));
  });
}

function classifyTaskField(successCoverage, margin, successfulModels) {
  if (successfulModels === 0) {
    return { label: 'Nobody solved it', tone: 'bad' };
  }
  if (successfulModels === 1) {
    return { label: 'Single solver', tone: 'warn' };
  }
  if (successCoverage === 1 && margin < 0.05) {
    return { label: 'Crowded field', tone: 'good' };
  }
  if (margin >= 0.15) {
    return { label: 'Clear separation', tone: 'warn' };
  }
  return { label: 'Competitive split', tone: 'good' };
}

function fieldReadRank(tone) {
  switch (tone) {
    case 'bad':
      return 3;
    case 'warn':
      return 2;
    default:
      return 1;
  }
}

function renderStaticTable({ rows, columns }) {
  return `<div class="table-wrap"><table>
    <thead>
      <tr>
${columns.map((column) => `        <th>${escapeHtmlMarkup(column.label)}</th>`).join('\n')}
      </tr>
    </thead>
    <tbody>
${rows.map((row, index) => `      <tr>
${columns.map((column) => `        <td>${column.render(row, index)}</td>`).join('\n')}
      </tr>`).join('\n')}
    </tbody>
  </table></div>`;
}

function badgeMarkup(label, tone) {
  return `<span class="pill ${escapeAttributeMarkup(tone)}">${escapeHtmlMarkup(label)}</span>`;
}

function selectCharts(charts, includeSlugs = [], excludeSlugs = []) {
  if (!Array.isArray(charts) || charts.length === 0) {
    return [];
  }

  const chartMap = new Map(charts.map((chart) => [chart.slug, chart]));
  const excluded = new Set(excludeSlugs);
  if (includeSlugs.length > 0) {
    return includeSlugs
      .map((slug) => chartMap.get(slug))
      .filter((chart) => chart && !excluded.has(chart.slug));
  }

  return charts.filter((chart) => !excluded.has(chart.slug));
}

function chartReadingHint(chart) {
  switch (chart.slug) {
    case 'composite-vs-cost':
      return 'Upper-left is the best observed frontier: higher quality for less total benchmark spend.';
    case 'composite-vs-catalog-price':
      return 'This compares observed benchmark quality with catalog pricing priors rather than run spend alone.';
    case 'cost-by-outcome':
      return 'The faded segment is spend burned on failed tasks; the solid segment is spend attached to solved tasks.';
    case 'token-breakdown':
      return 'Use this to see whether a model spends proportionally on reasoning, generation, or cached context.';
    case 'category-composite-heatmap':
      return 'Rows expose category strengths and blind spots that disappear in a single top-line score.';
    case 'difficulty-success-heatmap':
      return 'This isolates whether a model falls apart as task difficulty rises.';
    case 'task-composite-heatmap':
      return 'This is the most detailed quality comparison on the page: every task, every model, one glance.';
    case 'task-cost-heatmap':
      return 'Use this to find where a model is overpaying for equivalent or worse outcomes.';
    case 'task-duration-heatmap':
      return 'Use this to spot slow tasks and whether the delay tracks with better outcomes or wasted effort.';
    default:
      return '';
  }
}

function renderLeaderboardHighlights(highlights) {
  if (!Array.isArray(highlights) || highlights.length === 0) {
    return '<div class="empty">No leaderboard highlights are available for this publication.</div>';
  }

  return highlights.map((entry) => `<article class="insight-card">
    <div class="micro muted">${escapeHtmlMarkup(entry.label)}</div>
    <h3>${escapeHtmlMarkup(entry.model)}</h3>
    <div class="insight-value">${escapeHtmlMarkup(entry.value)}</div>
    <div class="insight-detail">${escapeHtmlMarkup(entry.detail)}</div>
  </article>`).join('\n');
}

function renderBenchmarkComposition(composition) {
  if (!composition) {
    return '<div class="empty">No benchmark composition summary is available.</div>';
  }

  return `<div class="key-list">
    <div class="key-row"><div><strong>Task inventory</strong><div class="muted">${escapeHtmlMarkup(String(composition.categoryCount))} categories, ${escapeHtmlMarkup(String(composition.difficultyCount))} difficulty bands</div></div><div class="key-row-value">${escapeHtmlMarkup(formatIntegerMarkup(composition.taskCount))} tasks</div></div>
    <div class="key-row"><div><strong>Observed suite cost</strong><div class="muted">Combined spend across all model-task runs in the publication</div></div><div class="key-row-value">${escapeHtmlMarkup(formatCurrencyMarkup(composition.totalCostUsd))}</div></div>
    <div class="key-row"><div><strong>Observed request volume</strong><div class="muted">Request units recorded by the benchmark proxy</div></div><div class="key-row-value">${escapeHtmlMarkup(formatIntegerMarkup(composition.totalRequestUnits))}</div></div>
    <div class="key-row"><div><strong>Observed wall time</strong><div class="muted">Aggregate elapsed model runtime across all runs</div></div><div class="key-row-value">${escapeHtmlMarkup(formatDurationMarkup(composition.totalDurationMs))}</div></div>
    <div class="key-row"><div><strong>Required capabilities</strong><div class="muted">${escapeHtmlMarkup((composition.requiredCapabilities || []).join(', ') || 'none declared')}</div></div><div class="key-row-value">${escapeHtmlMarkup(formatIntegerMarkup((composition.requiredCapabilities || []).length))}</div></div>
  </div>`;
}

function renderPairwiseSummary(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return '<div class="empty">No pairwise comparison summary is available.</div>';
  }

  return `<div class="key-list">
${rows.map((entry) => `<div class="key-row"><div><strong>${escapeHtmlMarkup(entry.leftModel)} vs ${escapeHtmlMarkup(entry.rightModel)}</strong><div class="muted">${escapeHtmlMarkup(String(entry.comparedTasks))} tasks compared, ${escapeHtmlMarkup(String(entry.ties))} ties</div></div><div class="key-row-value">${escapeHtmlMarkup(String(entry.leftWins))}-${escapeHtmlMarkup(String(entry.rightWins))}</div></div>`).join('\n')}
  </div>`;
}

function renderGroupedSummary(groups, key) {
  if (!Array.isArray(groups) || groups.length === 0) {
    return '<div class="empty">No grouped summary is available.</div>';
  }

  return `<div class="key-list">
${groups.map((group) => `<div class="key-row"><div><strong>${escapeHtmlMarkup(group[key])}</strong><div class="muted">${escapeHtmlMarkup(formatIntegerMarkup(group.taskCount))} tasks</div></div><div>${group.models.map((entry) => `<div class="key-row-value">${escapeHtmlMarkup(entry.model)}: ${escapeHtmlMarkup(formatScoreMarkup(entry.averageCompositeScore))} comp | ${escapeHtmlMarkup(formatPercentMarkup(entry.averageSuccessRate))} success</div>`).join('')}</div></div>`).join('\n')}
  </div>`;
}

function renderTokenSummary(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return '<div class="empty">No token summary is available.</div>';
  }

  return `<div class="table-wrap"><table>
    <thead>
      <tr>
        <th>Model</th>
        <th>Input</th>
        <th>Output</th>
        <th>Reasoning</th>
        <th>Cache Read</th>
        <th>Cache Write</th>
      </tr>
    </thead>
    <tbody>
${rows.map((entry) => `      <tr>
        <td>${escapeHtmlMarkup(entry.model)}</td>
        <td>${escapeHtmlMarkup(formatIntegerMarkup(entry.inputTokens))}</td>
        <td>${escapeHtmlMarkup(formatIntegerMarkup(entry.outputTokens))}</td>
        <td>${escapeHtmlMarkup(formatIntegerMarkup(entry.reasoningTokens))}</td>
        <td>${escapeHtmlMarkup(formatIntegerMarkup(entry.cacheReadTokens))}</td>
        <td>${escapeHtmlMarkup(formatIntegerMarkup(entry.cacheWriteTokens))}</td>
      </tr>`).join('\n')}
    </tbody>
  </table></div>`;
}

function renderSmokeRuns(runs) {
  if (!Array.isArray(runs) || runs.length === 0) {
    return '<div class="empty">No smoke benchmark runs have been published yet.</div>';
  }

  return `<div class="key-list">
${runs.map((run) => run.models.map((model) => `<div class="key-row"><div><strong>${escapeHtmlMarkup(model.model)}</strong><div class="muted">${escapeHtmlMarkup((run.taskIds || []).join(', ') || 'no task ids')} | ${escapeHtmlMarkup(run.id || 'unknown run')}</div></div><div><div class="key-row-value">${escapeHtmlMarkup(renderSmokeOutcomeLabel(model))}</div><div class="muted">success=${escapeHtmlMarkup(formatPercentMarkup(model.successRate))} | dnf=${escapeHtmlMarkup(formatIntegerMarkup(model.dnfs))} | requests=${escapeHtmlMarkup(formatIntegerMarkup(model.totalRequestUnits))} | calls=${escapeHtmlMarkup(formatIntegerMarkup(model.totalRequestCount))} | steps=${escapeHtmlMarkup(formatIntegerMarkup(model.totalSteps))} | cost=${escapeHtmlMarkup(formatSmokeCostMarkup(model))} | wall=${escapeHtmlMarkup(formatDurationMarkup(model.totalWallTimeMs))}</div>${renderSmokeFailureDetails(model)}</div></div>`).join('\n')).join('\n')}
  </div>`;
}

function renderSmokeOutcomeLabel(model) {
  const outcome = model.failureSummary?.outcomeLabel || null;
  if (outcome === 'provider-limited' || model.providerLimited) return 'provider-limited smoke';
  if (outcome === 'provider-model-not-found') return 'provider-model-not-found smoke';
  if (outcome === 'provider-http-error') return 'provider-http-error smoke';
  if (model.failed) return 'failed smoke';
  return 'passed smoke';
}

function renderSmokeFailureDetails(model) {
  const details = [];
  const failure = model.failureSummary || null;
  if (failure?.proxyStatus != null) {
    details.push(`provider_http=${failure.proxyStatus}`);
  }
  if (failure?.retryAfter) {
    details.push(`retry_after=${failure.retryAfter}`);
  }
  if (failure?.dnfReason) {
    details.push(`dnf_reason=${failure.dnfReason}`);
  }
  if (failure?.verifierCode != null) {
    details.push(`verifier_exit=${failure.verifierCode}`);
  }
  if (failure?.requestUnits != null) {
    details.push(`request_units=${failure.requestUnits}`);
  }
  if (failure?.requestCount != null) {
    details.push(`request_count=${failure.requestCount}`);
  }
  if (failure?.steps != null) {
    details.push(`steps=${failure.steps}`);
  }

  const lines = [];
  if (details.length) {
    lines.push(`<div class="muted">${escapeHtmlMarkup(details.join(' | '))}</div>`);
  }
  const failureDetailLine = buildFailureDetailLine(failure);
  if (failureDetailLine) {
    lines.push(`<div class="muted">${escapeHtmlMarkup(failureDetailLine)}</div>`);
  } else if (model.lastError) {
    lines.push(`<div class="muted">${escapeHtmlMarkup(model.lastError)}</div>`);
  }
  return lines.join('');
}

function buildFailureDetailLine(failure) {
  if (!failure) {
    return null;
  }
  const parts = [];
  if (failure.errorSignature) {
    parts.push(failure.errorSignature);
  }
  if (failure.errorMessage) {
    parts.push(failure.errorMessage);
  }
  if (failure.verifierStderr && failure.verifierStderr !== failure.errorMessage) {
    parts.push(failure.verifierStderr);
  }
  if (failure.suggestedModel) {
    parts.push(`suggested_model=${failure.suggestedModel}`);
  }
  return parts.join(' | ') || null;
}

function formatSmokeCostMarkup(model) {
  if (!Number.isFinite(model.totalCostUsd)) {
    return 'unknown';
  }
  if (model.totalCostUsd === 0 && model.failed) {
    return 'unknown';
  }
  return formatCurrencyMarkup(model.totalCostUsd);
}

function renderTaskMatrix(data) {
  const { models, tasks, matrix } = buildTaskMatrix({
    modelSummary: data.modelSummary,
    taskSummary: data.taskSummary,
    taskCatalog: data.taskCatalog,
  });
  if (!models.length || !tasks.length) {
    return '<div class="empty">No task comparison matrix is available for this publication.</div>';
  }

  const columns = models.length + 1;
  const cells = [];
  cells.push(`<div class="matrix-cell matrix-head mono">Task</div>`);
  for (const model of models) {
    cells.push(`<div class="matrix-cell matrix-head"><div>${escapeHtmlMarkup(model.model)}</div><div class="matrix-metric">${escapeHtmlMarkup(formatScoreMarkup(model.compositeScore))} composite | ${escapeHtmlMarkup(formatPercentMarkup(model.successRate))} success</div></div>`);
  }

  for (const task of tasks) {
    cells.push(`<div class="matrix-cell matrix-task"><div><strong>${escapeHtmlMarkup(task.name || task.id)}</strong></div><div class="matrix-metric">${escapeHtmlMarkup(task.id)}${task.difficulty ? ` | ${escapeHtmlMarkup(task.difficulty)}` : ''}</div></div>`);
    for (const model of models) {
      const row = matrix.get(task.id)?.get(model.model) || null;
      if (!row) {
        cells.push('<div class="matrix-cell"><div class="matrix-score">n/a</div><div class="matrix-metric">No published run</div></div>');
        continue;
      }
      cells.push(`<div class="matrix-cell">
        <div class="matrix-score">${escapeHtmlMarkup(formatScoreMarkup(row.compositeScore))}</div>
        <div class="matrix-metric">${escapeHtmlMarkup(formatPercentMarkup(row.successRate))} success</div>
        <div class="matrix-metric">${escapeHtmlMarkup(formatDecimalMarkup(row.averageRequestUnits, 2))} req | ${escapeHtmlMarkup(formatCurrencyMarkup(row.averageCostUsd))}</div>
        <div class="matrix-metric">${escapeHtmlMarkup(formatDurationMarkup(row.averageWallTimeMs))} | ${row.eligible ? 'scored' : 'unscored'}</div>
      </div>`);
    }
  }

  return `<div class="matrix-wrap"><div class="task-matrix" style="grid-template-columns: minmax(240px, 1.2fr) repeat(${columns - 1}, minmax(220px, 1fr));">${cells.join('')}</div></div>`;
}

function renderBenchmarkedModels(models) {
  if (!Array.isArray(models) || models.length === 0) {
    return '<div class="empty">No benchmarked model metadata is available for this publication.</div>';
  }

  return `<div class="model-cards">
${models.map((model) => `      <article class="model-card">
        <div class="micro muted">Benchmarked model</div>
        <h3>${escapeHtmlMarkup(model.model)}</h3>
        <div class="model-meta">
          ${renderModelMetaPill(model.family || 'unknown family')}
          ${model.priceTier ? renderModelMetaPill(`${model.priceTier} price tier`) : ''}
          ${model.devTier ? renderModelMetaPill(model.devTier) : ''}
          ${model.recommendedUse ? renderModelMetaPill(model.recommendedUse) : ''}
          ${model.headlessFriendly === true ? renderModelMetaPill('headless friendly') : ''}
          ${model.headlessFriendly === false ? renderModelMetaPill('headless caution') : ''}
        </div>
        <div class="stat-list">
          ${renderStatRow('Composite', formatScoreMarkup(model.compositeScore))}
          ${renderStatRow('Success', formatPercentMarkup(model.successRate))}
          ${renderStatRow('Requests', formatIntegerMarkup(model.totalRequestUnits))}
          ${renderStatRow('Wall time', formatDurationMarkup(model.totalWallTimeMs))}
          ${renderStatRow('Total cost', formatCurrencyMarkup(model.totalCostUsd))}
          ${renderStatRow('Catalog speed', model.speedTokensPerSecond != null ? `${escapeHtmlMarkup(formatIntegerMarkup(model.speedTokensPerSecond))} tok/s` : 'n/a')}
          ${renderStatRow('Catalog blended price', formatCurrencyMarkupPerMillion(model.blendedPricePer1mTokensUsd))}
          ${renderStatRow('Intelligence', model.intelligenceScore != null ? escapeHtmlMarkup(String(model.intelligenceScore)) : 'n/a')}
          ${renderStatRow('Agentic', model.agenticScore != null ? escapeHtmlMarkup(String(model.agenticScore)) : 'n/a')}
          ${renderStatRow('Benchmark support', escapeHtmlMarkup(model.unattendedBenchmarkRuns || 'unknown'))}
        </div>
        ${model.pricingNotes ? `<p class="panel-copy" style="margin-top:14px;">${escapeHtmlMarkup(model.pricingNotes)}</p>` : ''}
        ${model.stabilityNotes ? `<p class="panel-copy" style="margin-top:10px;">${escapeHtmlMarkup(model.stabilityNotes)}</p>` : ''}
        <div class="card-actions">
          ${model.sourceUrl ? `<a class="card-link" href="${escapeAttributeMarkup(model.sourceUrl)}">Catalog source</a>` : ''}
        </div>
      </article>`).join('\n')}
    </div>`;
}

function renderModelMetaPill(label) {
  return `<span class="pill">${escapeHtmlMarkup(label)}</span>`;
}

function renderStatRow(label, value) {
  return `<div class="stat-row"><span>${escapeHtmlMarkup(label)}</span><strong>${value}</strong></div>`;
}

function formatCurrencyMarkupPerMillion(value) {
  if (!Number.isFinite(value)) {
    return 'n/a';
  }
  return `${escapeHtmlMarkup(formatCurrencyMarkup(value))} / 1M tok`;
}

function escapeHtmlMarkup(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttributeMarkup(value) {
  return escapeHtmlMarkup(value);
}
