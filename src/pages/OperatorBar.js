import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Plotly from 'plotly.js-dist';
import {
  GRAPH_AXIS_LINE_COLOR,
  GRAPH_TEXT_COLOR,
  SCATTER_COLORWAY,
  TIMELINE_COLORWAY,
} from '../constants/colorPalettes';

const labelCollator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

const sanitizeLabel = (value, fallback) => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return fallback;
};

const sanitizeDateToken = (value) => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  if (value instanceof Date) {
    const timestamp = value.getTime();
    if (!Number.isNaN(timestamp)) {
      return value.toISOString();
    }
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }
  return null;
};

const normalizeDateString = (value) => {
  const token = sanitizeDateToken(value);
  if (!token) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(token)) {
    return token.slice(0, 10);
  }

  const normalized = token.replace(/[/.]/g, '-');
  const parts = normalized.split('-').filter(Boolean);

  if (parts.length !== 3) {
    return null;
  }

  const [first, second, third] = parts.map((part) => part.padStart(2, '0'));

  if (first.length === 4) {
    return `${first}-${second}-${third}`.slice(0, 10);
  }

  if (third.length === 4) {
    return `${third}-${first}-${second}`.slice(0, 10);
  }

  return null;
};

const buildSingleCategoryTimeline = (records, options) => {
  const {
    resolveCategory,
    fallbackCategory,
    xAxisTitle,
    yAxisTitle,
    hoverLabel = 'operators',
    colorway = SCATTER_COLORWAY,
  } = options ?? {};

  if (!Array.isArray(records) || records.length === 0) {
    return null;
  }

  const dateBuckets = new Map();
  const categorySet = new Set();

  records.forEach((record) => {
    const normalizedDate = normalizeDateString(record?.date_joined);
    if (!normalizedDate) {
      return;
    }
    const category = sanitizeLabel(
      typeof resolveCategory === 'function' ? resolveCategory(record) : null,
      fallbackCategory,
    );
    if (!category) {
      return;
    }
    categorySet.add(category);

    const bucket = dateBuckets.get(normalizedDate) ?? new Map();
    bucket.set(category, (bucket.get(category) ?? 0) + 1);
    dateBuckets.set(normalizedDate, bucket);
  });

  if (!dateBuckets.size || !categorySet.size) {
    return null;
  }

  const categories = Array.from(categorySet).sort(labelCollator.compare);
  const colors = categories.map(
    (_, index) => colorway[index % colorway.length],
  );
  const sortedDates = Array.from(dateBuckets.keys()).sort(labelCollator.compare);
  const runningTotals = new Map(categories.map((category) => [category, 0]));

  const frames = [];
  let globalMax = 0;

  sortedDates.forEach((dateKey) => {
    const bucket = dateBuckets.get(dateKey) ?? new Map();
    categories.forEach((category) => {
      const increment = bucket.get(category) ?? 0;
      runningTotals.set(
        category,
        (runningTotals.get(category) ?? 0) + increment,
      );
    });

    const counts = categories.map((category) => runningTotals.get(category) ?? 0);
    counts.forEach((value) => {
      if (value > globalMax) {
        globalMax = value;
      }
    });

    frames.push({
      name: dateKey,
      label: dateKey,
      data: [{ y: counts }],
    });
  });

  const initialCounts = frames.length > 0
    ? (frames[0].data?.[0]?.y ?? categories.map(() => 0))
    : categories.map(() => 0);

  return {
    traces: [
      {
        type: 'bar',
        x: categories,
        y: initialCounts,
        marker: {
          color: colors,
          line: {
            width: 1.2,
            color: 'rgba(6, 18, 16, 0.82)',
          },
        },
        hovertemplate: `<b>%{x}</b><br>${hoverLabel} :: %{y}<extra></extra>`,
      },
    ],
    frames,
    firstDate: sortedDates[0],
    lastDate: sortedDates[sortedDates.length - 1],
    maxCount: globalMax,
    xAxisTitle,
    yAxisTitle,
    layout: {},
  };
};

const buildStackedCategoryTimeline = (records, options) => {
  const {
    resolveEntries,
    categoryFallback,
    stackFallback,
    xAxisTitle,
    yAxisTitle,
    colorway = TIMELINE_COLORWAY,
    stackOrder,
  } = options ?? {};

  if (!Array.isArray(records) || records.length === 0) {
    return null;
  }

  const dateBuckets = new Map();
  const categorySet = new Set();
  const stackSet = new Set();
  const stackLabels = new Map();

  records.forEach((record, recordIndex) => {
    const normalizedDate = normalizeDateString(record?.date_joined);
    if (!normalizedDate) {
      return;
    }

    const entries = typeof resolveEntries === 'function'
      ? resolveEntries(record, recordIndex)
      : null;

    if (!Array.isArray(entries) || entries.length === 0) {
      return;
    }

    const dayEntry = dateBuckets.get(normalizedDate) ?? new Map();

    entries.forEach((entry) => {
      const category = sanitizeLabel(entry?.category, categoryFallback);
      const stackKey = sanitizeLabel(entry?.stack, stackFallback);
      if (!category || !stackKey) {
        return;
      }

      const weight = typeof entry?.weight === 'number' && Number.isFinite(entry.weight)
        ? entry.weight
        : 1;

      const stackLabel = sanitizeLabel(entry?.stackLabel, stackKey);
      categorySet.add(category);
      stackSet.add(stackKey);
      stackLabels.set(stackKey, stackLabel);

      const stackEntry = dayEntry.get(category) ?? new Map();
      stackEntry.set(stackKey, (stackEntry.get(stackKey) ?? 0) + weight);
      dayEntry.set(category, stackEntry);
    });

    if (dayEntry.size > 0) {
      dateBuckets.set(normalizedDate, dayEntry);
    }
  });

  if (!dateBuckets.size || !categorySet.size || !stackSet.size) {
    return null;
  }

  const categories = Array.from(categorySet).sort(labelCollator.compare);
  const sortedDates = Array.from(dateBuckets.keys()).sort(labelCollator.compare);
  const stackKeys = Array.from(stackSet);

  if (typeof stackOrder === 'function') {
    stackKeys.sort(stackOrder);
  } else {
    stackKeys.sort(labelCollator.compare);
  }

  const runningTotals = new Map(
    stackKeys.map(
      (stackKey) => [stackKey, new Map(categories.map((category) => [category, 0]))],
    ),
  );

  const frames = [];
  let globalMax = 0;

  sortedDates.forEach((dateKey) => {
    const dayEntry = dateBuckets.get(dateKey) ?? new Map();

    dayEntry.forEach((stackEntry, category) => {
      stackEntry.forEach((count, stackKey) => {
        const categoryMap = runningTotals.get(stackKey);
        if (!categoryMap) {
          return;
        }
        categoryMap.set(
          category,
          (categoryMap.get(category) ?? 0) + count,
        );
      });
    });

    const frameData = stackKeys.map((stackKey) => {
      const categoryMap = runningTotals.get(stackKey);
      return {
        y: categories.map((category) => categoryMap?.get(category) ?? 0),
      };
    });

    categories.forEach((_, categoryIndex) => {
      let categoryTotal = 0;
      frameData.forEach((traceData) => {
        categoryTotal += traceData.y[categoryIndex] ?? 0;
      });
      if (categoryTotal > globalMax) {
        globalMax = categoryTotal;
      }
    });

    frames.push({
      name: dateKey,
      label: dateKey,
      data: frameData,
    });
  });

  const traces = stackKeys.map((stackKey, index) => ({
    type: 'bar',
    name: stackLabels.get(stackKey) ?? stackKey,
    x: categories,
    y: frames[0]?.data?.[index]?.y ?? categories.map(() => 0),
    marker: {
      color: colorway[index % colorway.length],
      line: {
        width: 1,
        color: 'rgba(6, 18, 16, 0.7)',
      },
    },
    hovertemplate: `<b>%{x}</b><br>${stackLabels.get(stackKey) ?? stackKey} :: %{y}<extra></extra>`,
  }));

  return {
    traces,
    frames,
    firstDate: sortedDates[0],
    lastDate: sortedDates[sortedDates.length - 1],
    maxCount: globalMax,
    xAxisTitle,
    yAxisTitle,
    layout: { barmode: 'stack' },
  };
};

const AFFILIATION_STACK_ORDER = ['primary', 'secondary'];
const orderAffiliationStacks = (a, b) => {
  const indexA = AFFILIATION_STACK_ORDER.indexOf(a);
  const indexB = AFFILIATION_STACK_ORDER.indexOf(b);
  if (indexA === -1 && indexB === -1) {
    return labelCollator.compare(a, b);
  }
  if (indexA === -1) {
    return 1;
  }
  if (indexB === -1) {
    return -1;
  }
  return indexA - indexB;
};

const CHART_OPTIONS = [
  {
    key: 'rarity',
    label: 'Rarity (Default)',
    panelTitle: 'rarity distributions over join timeline',
    description: 'use slider or playback controls to animate cumulative rarity counts',
    build: (records) => buildSingleCategoryTimeline(records, {
      resolveCategory: (record) => record?.operatorRecords_rarity,
      fallbackCategory: 'unspecified rarity',
      xAxisTitle: 'operator rarity',
      yAxisTitle: 'operators :: cumulative count',
      hoverLabel: 'operators',
      colorway: SCATTER_COLORWAY,
    }),
  },
  {
    key: 'class-job',
    label: 'Class vs Job (Stacked)',
    panelTitle: 'class composition stacked by job',
    description: 'job specialties stack atop each class category over time',
    build: (records) => buildStackedCategoryTimeline(records, {
      resolveEntries: (record) => [{
        category: record?.operatorRecords_class,
        stack: record?.operatorRecords_job,
        stackLabel: record?.operatorRecords_job,
      }],
      categoryFallback: 'unclassified',
      stackFallback: 'unspecified role',
      xAxisTitle: 'operator class',
      yAxisTitle: 'operators :: cumulative count',
      colorway: TIMELINE_COLORWAY,
    }),
  },
  {
    key: 'gender',
    label: 'Gender',
    panelTitle: 'gender distribution over join timeline',
    description: 'track cumulative operator counts by reported gender',
    build: (records) => buildSingleCategoryTimeline(records, {
      resolveCategory: (record) => record?.gender,
      fallbackCategory: 'unspecified',
      xAxisTitle: 'gender category',
      yAxisTitle: 'operators :: cumulative count',
      hoverLabel: 'operators',
      colorway: SCATTER_COLORWAY,
    }),
  },
  {
    key: 'species',
    label: 'Species',
    panelTitle: 'species distribution over join timeline',
    description: 'observe cumulative counts by recorded species classifications',
    build: (records) => buildSingleCategoryTimeline(records, {
      resolveCategory: (record) => record?.species,
      fallbackCategory: 'unknown species',
      xAxisTitle: 'species',
      yAxisTitle: 'operators :: cumulative count',
      hoverLabel: 'operators',
      colorway: TIMELINE_COLORWAY,
    }),
  },
  {
    key: 'affiliation',
    label: 'Affiliation (Stacked)',
    panelTitle: 'affiliation channels (primary vs secondary)',
    description: 'compare cumulative affiliation counts split by primary and secondary ties',
    build: (records) => buildStackedCategoryTimeline(records, {
      resolveEntries: (record) => {
        const entries = [
          {
            category: record?.affiliation_primary,
            stack: 'primary',
            stackLabel: 'Primary',
          },
        ];
        if (record?.affiliation_secondary) {
          entries.push({
            category: record.affiliation_secondary,
            stack: 'secondary',
            stackLabel: 'Secondary',
          });
        }
        return entries;
      },
      categoryFallback: 'unaffiliated',
      stackFallback: 'primary',
      xAxisTitle: 'affiliation',
      yAxisTitle: 'operators :: cumulative count',
      colorway: TIMELINE_COLORWAY,
      stackOrder: orderAffiliationStacks,
    }),
  },
];

const DEFAULT_EMPTY_MESSAGE = 'selected channel lacks sufficient join-date telemetry for playback';

const OperatorBar = ({ operatorStatus, onBack }) => {
  const status = operatorStatus?.status ?? { state: 'idle', error: null };
  const rawRecords = operatorStatus?.data;
  const records = useMemo(
    () => (Array.isArray(rawRecords) ? rawRecords : []),
    [rawRecords],
  );
  const totalRecords = records.length;
  const [activeChartKey, setActiveChartKey] = useState(CHART_OPTIONS[0].key);
  const activeChart = useMemo(
    () => CHART_OPTIONS.find((option) => option.key === activeChartKey) ?? CHART_OPTIONS[0],
    [activeChartKey],
  );
  const chartModel = useMemo(() => {
    if (!activeChart || typeof activeChart.build !== 'function') {
      return null;
    }
    return activeChart.build(records);
  }, [records, activeChart]);
  const plotRef = useRef(null);

  useEffect(() => {
    const handleUnhandledRejection = (event) => {
      if (event?.reason === undefined) {
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  useEffect(() => {
    const node = plotRef.current;
    if (!node) {
      return () => {};
    }

    if (
      !chartModel
      || !Array.isArray(chartModel.frames)
      || chartModel.frames.length === 0
      || !Array.isArray(chartModel.traces)
      || chartModel.traces.length === 0
    ) {
      Plotly.purge(node);
      return () => {};
    }

    const {
      frames,
      maxCount,
      firstDate,
      lastDate,
      traces,
      xAxisTitle,
      yAxisTitle,
      layout: layoutOverrides,
    } = chartModel;

    const traceIndices = traces.map((_, index) => index);
    const plotlyFrames = frames.map((frame) => ({
      name: frame.name,
      data: frame.data ?? [],
      traces: frame.traces ?? traceIndices,
    }));

    const sliderSteps = frames.map((frame) => ({
      label: frame.label,
      method: 'animate',
      args: [
        [frame.name],
        {
          mode: 'immediate',
          transition: { duration: 350, easing: 'cubic-in-out' },
          frame: { duration: 350, redraw: true },
        },
      ],
    }));

    const baseLayout = {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: {
        family: 'Courier New, monospace',
        color: GRAPH_TEXT_COLOR,
      },
      margin: { t: 60, l: 60, r: 40, b: 120 },
      hovermode: 'closest',
      xaxis: {
        title: xAxisTitle ?? 'category',
        tickangle: -25,
        zeroline: false,
        linecolor: GRAPH_AXIS_LINE_COLOR,
        tickfont: { size: 12 },
      },
      yaxis: {
        title: yAxisTitle ?? 'operators :: cumulative count',
        range: [0, Math.max((maxCount ?? 0) * 1.1, 1)],
        gridcolor: 'rgba(28, 46, 56, 0.25)',
        linecolor: GRAPH_AXIS_LINE_COLOR,
        tickformat: ',d',
      },
      sliders: [
        {
          active: 0,
          currentvalue: {
            prefix: 'join date :: ',
            font: {
              size: 12,
              color: GRAPH_TEXT_COLOR,
            },
          },
          pad: { t: 32, b: 0 },
          len: 0.9,
          x: 0.05,
          y: -0.14,
          steps: sliderSteps,
        },
      ],
      updatemenus: [
        {
          type: 'buttons',
          direction: 'left',
          x: 0.05,
          y: -0.28,
          pad: { t: 40, r: 10 },
          buttons: [
            {
              label: 'Play',
              method: 'animate',
              args: [
                null,
                {
                  mode: 'immediate',
                  fromcurrent: true,
                  transition: { duration: 350, easing: 'cubic-in-out' },
                  frame: { duration: 350, redraw: true },
                },
              ],
            },
            {
              label: 'Pause',
              method: 'animate',
              args: [
                [null],
                {
                  mode: 'immediate',
                  transition: { duration: 0 },
                  frame: { duration: 0, redraw: true },
                },
              ],
            },
          ],
        },
      ],
      annotations: [
        {
          text: `first recorded join :: ${firstDate}`,
          xref: 'paper',
          yref: 'paper',
          x: 0,
          y: 1.12,
          showarrow: false,
          font: {
            size: 11,
            color: GRAPH_TEXT_COLOR,
          },
        },
        {
          text: `latest recorded join :: ${lastDate}`,
          xref: 'paper',
          yref: 'paper',
          x: 1,
          y: 1.12,
          showarrow: false,
          font: {
            size: 11,
            color: GRAPH_TEXT_COLOR,
          },
          align: 'right',
        },
      ],
    };

    if (layoutOverrides && typeof layoutOverrides === 'object') {
      Object.entries(layoutOverrides).forEach(([key, value]) => {
        if (key === 'xaxis' || key === 'yaxis') {
          baseLayout[key] = {
            ...(baseLayout[key] ?? {}),
            ...(value ?? {}),
          };
        } else {
          baseLayout[key] = value;
        }
      });
    }

    const config = {
      displaylogo: false,
      responsive: true,
      modeBarButtonsToRemove: ['lasso2d', 'select2d'],
    };

    Plotly.newPlot(node, traces, baseLayout, config)
      .then(() => {
        Plotly.addFrames(node, plotlyFrames).catch(() => {});
      })
      .catch(() => {});

    const handleResize = () => {
      Plotly.Plots.resize(node);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      Plotly.purge(node);
    };
  }, [chartModel]);

  const datasetStatusLabel = (() => {
    if (status.state === 'loading') {
      return 'link engaged :: compiling telemetry';
    }
    if (status.state === 'error') {
      return `link failed :: ${status.error ?? 'telemetry offline'}`;
    }
    if (status.state === 'loaded') {
      return `link stable :: ${totalRecords} records cached`;
    }
    return 'link dormant :: awaiting dataset';
  })();

  const isReady = status.state === 'loaded'
    && chartModel
    && Array.isArray(chartModel.frames)
    && chartModel.frames.length > 0
    && Array.isArray(chartModel.traces)
    && chartModel.traces.length > 0;

  const chartSelectionDisabled = status.state !== 'loaded' || totalRecords === 0;

  const chartTitle = activeChart?.panelTitle ?? 'rarity distributions over join timeline';
  const chartDescription = activeChart?.description
    ?? 'use slider or playback controls to animate cumulative rarity counts';

  const handleChartChange = (event) => {
    setActiveChartKey(event.target.value);
  };

  return (
    <div className="operator-layout">
      <div className="operator-panel operator-panel--stats">
        <div className="operator-header">
          <div className="operator-header-stack">
            <div className="operator-subtitle">analytics uplink</div>
            <div className="operator-title">comparison :: categories</div>
          </div>
          <div className="operator-actions">
            <button type="button" className="dashboard-button" onClick={onBack}>
              return to stats
            </button>
          </div>
        </div>
        <div className="operator-status-line">
          <span className="status-indicator" data-state={status.state} />
          {datasetStatusLabel}
        </div>
        <div className="sunburst-toolbar">
          <div className="sunburst-toolbar__label">category channel</div>
          <div className="sunburst-select">
            <select
              value={activeChartKey}
              onChange={handleChartChange}
              disabled={chartSelectionDisabled}
            >
              {CHART_OPTIONS.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {status.state === 'loading' && (
          <div className="operator-placeholder">
            priming rarity comparison channel...
          </div>
        )}
        {status.state === 'error' && (
          <div className="operator-placeholder operator-placeholder--error">
            unable to retrieve operator telemetry
          </div>
        )}
        {status.state === 'loaded' && (!chartModel || chartModel.frames.length === 0) && (
          <div className="operator-placeholder">
            {DEFAULT_EMPTY_MESSAGE}
          </div>
        )}
        {isReady && (
          <div className="timeline-plot-panel">
            <div className="timeline-plot-panel__header">
              <div className="timeline-plot-panel__title">{chartTitle}</div>
              <div className="timeline-plot-panel__meta">
                {chartDescription}
              </div>
            </div>
            <div className="timeline-plot timeline-plot--plotly" ref={plotRef} />
          </div>
        )}
      </div>
    </div>
  );
};

export default OperatorBar;
