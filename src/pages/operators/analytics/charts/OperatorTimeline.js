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
  TIMELINE_COLORWAY,
} from '../../../../constants/colorPalettes';

// Timeline dashboard that replays operator onboarding metrics with filters.

const EMPTY_ARRAY = [];
const METRIC_OPTIONS = [
  {
    key: 'operator-count',
    label: 'total operators :: cumulative',
    description: 'Displays cumulative onboarding count across join dates.',
  },
  {
    key: 'average-stat',
    label: 'average stats :: hp / atk / def',
    description: 'Plots cumulative averages for HP, ATK, and DEF metrics.',
  },
  {
    key: 'max-stat',
    label: 'max stats :: hp / atk / def',
    description: 'Tracks running maxima for HP, ATK, and DEF metrics.',
  },
  {
    key: 'min-stat',
    label: 'min stats :: hp / atk / def',
    description: 'Tracks running minima for HP, ATK, and DEF metrics.',
  },
];

const FILTER_OPTIONS = [
  { key: 'all', label: 'all records' },
  { key: 'class', label: 'group by class' },
  { key: 'rarity', label: 'group by rarity' },
  { key: 'gender', label: 'group by gender category' },
];

const FILTER_CONFIG = {
  all: {
    label: 'all records',
  },
  class: {
    field: 'operatorRecords_class',
    fallback: 'unclassified',
  },
  rarity: {
    field: 'operatorRecords_rarity',
    fallback: 'unspecified rarity',
  },
  gender: {
    field: 'gender',
    fallback: 'unspecified',
  },
};

const labelCollator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

const sanitizeLabel = (value, fallback) => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return fallback;
};

const STAT_FIELDS = [
  { key: 'combat_hp', label: 'HP' },
  { key: 'combat_atk', label: 'Attack' },
  { key: 'combat_def', label: 'Defense' },
];

const parseStatValue = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const numeric = Number(trimmed);
    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }
  return null;
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
    if (Number.isNaN(timestamp)) {
      return null;
    }
    return value.toISOString();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date.toISOString();
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

const resolveGroupInfo = (record, filterKey) => {
  const config = FILTER_CONFIG[filterKey];
  if (!config || !config.field) {
    return { key: 'all', label: FILTER_CONFIG.all.label };
  }
  const label = sanitizeLabel(record?.[config.field], config.fallback);
  return { key: label, label };
};

const buildOperatorCountSeries = (records, filterKey) => {
  if (!Array.isArray(records) || records.length === 0) {
    return null;
  }

  const groupEntries = new Map();
  const colorOrder = new Map();
  const getColorIndex = (key) => {
    const normalized = key ?? 'operator-default';
    if (!colorOrder.has(normalized)) {
      colorOrder.set(normalized, colorOrder.size);
    }
    return colorOrder.get(normalized);
  };
  let minDate = null;
  let maxDate = null;
  let totalRecords = 0;

  records.forEach((record) => {
    const normalized = normalizeDateString(record?.date_joined);
    if (!normalized) {
      return;
    }
    const { key, label } = resolveGroupInfo(record, filterKey);
    const entry = groupEntries.get(key) ?? {
      key,
      label,
      counts: new Map(),
    };
    entry.counts.set(normalized, (entry.counts.get(normalized) ?? 0) + 1);
    groupEntries.set(key, entry);
    totalRecords += 1;
    if (!minDate || normalized < minDate) {
      minDate = normalized;
    }
    if (!maxDate || normalized > maxDate) {
      maxDate = normalized;
    }
  });

  if (!minDate || groupEntries.size === 0) {
    return null;
  }

  const series = Array.from(groupEntries.values()).map((entry) => {
    const sortedDates = Array.from(entry.counts.keys()).sort();
    let cumulative = 0;
    const x = [];
    const y = [];
    const customdata = [];
    const isAggregate = filterKey === 'all';
    const label = isAggregate ? 'total operators' : entry.label;

    sortedDates.forEach((dateKey) => {
      const dailyCount = entry.counts.get(dateKey);
      cumulative += dailyCount;
      x.push(dateKey);
      y.push(cumulative);
      customdata.push([dailyCount, cumulative]);
    });

    if (!x.length) {
      return null;
    }

    const colorIndex = getColorIndex(entry.key);

    return {
      key: entry.key,
      label,
      x,
      y,
      customdata,
      hovertemplate: `<b>%{x}</b><br>new operators :: %{customdata[0]}<br>cumulative :: %{y}<extra>${label}</extra>`,
      legendgroup: entry.key,
      colorIndex,
    };
  }).filter(Boolean).sort((a, b) => labelCollator.compare(a.label, b.label));

  const plots = [{
    key: 'operator-count-plot',
    title: 'Total Operators',
    tabLabel: 'Total Operators',
    yAxisTitle: 'operator count (cumulative)',
    series,
  }];

  return {
    plots,
    start: minDate,
    end: maxDate,
    total: totalRecords,
  };
};

const buildAverageStatSeries = (records, filterKey) => {
  if (!Array.isArray(records) || records.length === 0) {
    return null;
  }

  const groupEntries = new Map();
  const colorOrder = new Map();
  const getColorIndex = (key) => {
    const normalized = key ?? 'stat-default';
    if (!colorOrder.has(normalized)) {
      colorOrder.set(normalized, colorOrder.size);
    }
    return colorOrder.get(normalized);
  };
  let minDate = null;
  let maxDate = null;
  let totalRecords = 0;

  records.forEach((record) => {
    const normalized = normalizeDateString(record?.date_joined);
    if (!normalized) {
      return;
    }

    totalRecords += 1;
    if (!minDate || normalized < minDate) {
      minDate = normalized;
    }
    if (!maxDate || normalized > maxDate) {
      maxDate = normalized;
    }

    const { key, label } = resolveGroupInfo(record, filterKey);
    const entry = groupEntries.get(key) ?? {
      key,
      label,
      dateSet: new Set(),
      stats: new Map(),
    };

    entry.dateSet.add(normalized);

    STAT_FIELDS.forEach((stat) => {
      const value = parseStatValue(record?.[stat.key]);
      if (value === null) {
        return;
      }

      const statEntry = entry.stats.get(stat.key) ?? {
        sumByDate: new Map(),
        countByDate: new Map(),
      };

      statEntry.sumByDate.set(
        normalized,
        (statEntry.sumByDate.get(normalized) ?? 0) + value,
      );
      statEntry.countByDate.set(
        normalized,
        (statEntry.countByDate.get(normalized) ?? 0) + 1,
      );
      entry.stats.set(stat.key, statEntry);
    });

    groupEntries.set(key, entry);
  });

  if (!minDate || groupEntries.size === 0) {
    return null;
  }

  const plotMap = new Map();

  STAT_FIELDS.forEach((stat) => {
    plotMap.set(stat.key, {
      key: `stat-${stat.key}`,
      title: stat.label,
      tabLabel: `Avg ${stat.label}`,
      yAxisTitle: `${stat.label} (cumulative avg)`,
      series: [],
    });
  });

  Array.from(groupEntries.values())
    .sort((a, b) => labelCollator.compare(a.label, b.label))
    .forEach((group) => {
      const sortedDates = Array.from(group.dateSet).sort();

      STAT_FIELDS.forEach((stat) => {
        const statData = group.stats.get(stat.key);
        if (!statData) {
          return;
        }

        let cumulativeSum = 0;
        let cumulativeCount = 0;
        const x = [];
        const y = [];
        const customdata = [];

        sortedDates.forEach((dateKey) => {
          const dailySum = statData.sumByDate.get(dateKey) ?? 0;
          const dailyCount = statData.countByDate.get(dateKey) ?? 0;

          if (dailyCount === 0 && cumulativeCount === 0) {
            return;
          }

          cumulativeSum += dailySum;
          cumulativeCount += dailyCount;
          if (cumulativeCount === 0) {
            return;
          }

          const cumulativeAverage = cumulativeSum / cumulativeCount;

          x.push(dateKey);
          y.push(cumulativeAverage);
          customdata.push([dailyCount, cumulativeCount]);
        });

        if (!x.length) {
          return;
        }

        const isAggregate = filterKey === 'all';
        const colorKey = isAggregate ? stat.key : group.key;
        const displayLabel = isAggregate ? stat.label : group.label;

        const colorIndex = getColorIndex(colorKey);

        const plot = plotMap.get(stat.key);
        if (!plot) {
          return;
        }

        plot.series.push({
          key: `${group.key}::${stat.key}`,
          label: displayLabel,
          x,
          y,
          customdata,
          colorIndex,
          hovertemplate: `<b>%{x}</b><br>new records :: %{customdata[0]}<br>operators tracked :: %{customdata[1]}<br>cumulative avg :: %{y:.2f}<extra>${stat.label}${isAggregate ? '' : ` :: ${group.label}`}</extra>`,
          legendgroup: isAggregate ? `avg-${stat.key}` : `avg-${group.key}-${stat.key}`,
        });
      });
    });

  const plots = STAT_FIELDS.map((stat) => plotMap.get(stat.key))
    .filter((plot) => plot && plot.series.length > 0);

  if (plots.length === 0) {
    return null;
  }

  return {
    plots,
    start: minDate,
    end: maxDate,
    total: totalRecords,
  };
};

const collectStatExtrema = (records, filterKey) => {
  const groupEntries = new Map();
  let minDate = null;
  let maxDate = null;
  let totalRecords = 0;

  records.forEach((record) => {
    const normalized = normalizeDateString(record?.date_joined);
    if (!normalized) {
      return;
    }

    totalRecords += 1;
    if (!minDate || normalized < minDate) {
      minDate = normalized;
    }
    if (!maxDate || normalized > maxDate) {
      maxDate = normalized;
    }

    const { key, label } = resolveGroupInfo(record, filterKey);
    const entry = groupEntries.get(key) ?? {
      key,
      label,
      stats: new Map(),
    };

    STAT_FIELDS.forEach((stat) => {
      const value = parseStatValue(record?.[stat.key]);
      if (value === null) {
        return;
      }
      const statData = entry.stats.get(stat.key) ?? new Map();
      const current = statData.get(normalized) ?? {
        max: Number.NEGATIVE_INFINITY,
        min: Number.POSITIVE_INFINITY,
      };
      if (value > current.max) {
        current.max = value;
      }
      if (value < current.min) {
        current.min = value;
      }
      statData.set(normalized, current);
      entry.stats.set(stat.key, statData);
    });

    groupEntries.set(key, entry);
  });

  return {
    groupEntries,
    minDate,
    maxDate,
    totalRecords,
  };
};

const buildMaxStatSeries = (records, filterKey) => {
  if (!Array.isArray(records) || records.length === 0) {
    return null;
  }

  const { groupEntries, minDate, maxDate, totalRecords } = collectStatExtrema(records, filterKey);

  if (!minDate || groupEntries.size === 0) {
    return null;
  }

  const plotMap = new Map();
  STAT_FIELDS.forEach((stat) => {
    plotMap.set(stat.key, {
      key: `stat-${stat.key}`,
      title: stat.label,
      tabLabel: `Max ${stat.label}`,
      yAxisTitle: `${stat.label} (running max)`,
      series: [],
    });
  });

  const colorOrder = new Map();
  const getColorIndex = (key) => {
    const normalized = key ?? 'stat-default';
    if (!colorOrder.has(normalized)) {
      colorOrder.set(normalized, colorOrder.size);
    }
    return colorOrder.get(normalized);
  };

  Array.from(groupEntries.values())
    .sort((a, b) => labelCollator.compare(a.label, b.label))
    .forEach((group) => {
      STAT_FIELDS.forEach((stat) => {
        const statData = group.stats.get(stat.key);
        if (!statData) {
          return;
        }

        const sortedDates = Array.from(statData.keys()).sort();
        let runningMax = Number.NEGATIVE_INFINITY;
        const x = [];
        const y = [];
        const customdata = [];

        sortedDates.forEach((dateKey) => {
          const dailyEntry = statData.get(dateKey);
          const dailyMax = dailyEntry?.max ?? Number.NEGATIVE_INFINITY;
          if (!Number.isFinite(dailyMax)) {
            return;
          }
          runningMax = Math.max(runningMax, dailyMax);
          if (!Number.isFinite(runningMax)) {
            return;
          }
          x.push(dateKey);
          y.push(runningMax);
          customdata.push([dailyMax]);
        });

        if (!x.length) {
          return;
        }

        const isAggregate = filterKey === 'all';
        const colorKey = isAggregate ? stat.key : group.key;
        const displayLabel = isAggregate ? stat.label : group.label;
        const colorIndex = getColorIndex(colorKey);
        const plot = plotMap.get(stat.key);
        if (!plot) {
          return;
        }

        plot.series.push({
          key: `${group.key}::${stat.key}`,
          label: displayLabel,
          x,
          y,
          customdata,
          colorIndex,
          hovertemplate: `<b>%{x}</b><br>daily max :: %{customdata[0]}<br>running max :: %{y}<extra>${stat.label}${isAggregate ? '' : ` :: ${group.label}`}</extra>`,
          legendgroup: isAggregate ? `max-${stat.key}` : `max-${group.key}-${stat.key}`,
        });
      });
    });

  const plots = STAT_FIELDS.map((stat) => plotMap.get(stat.key))
    .filter((plot) => plot && plot.series.length > 0);

  if (plots.length === 0) {
    return null;
  }

  return {
    plots,
    start: minDate,
    end: maxDate,
    total: totalRecords,
  };
};

const buildMinStatSeries = (records, filterKey) => {
  if (!Array.isArray(records) || records.length === 0) {
    return null;
  }

  const { groupEntries, minDate, maxDate, totalRecords } = collectStatExtrema(records, filterKey);

  if (!minDate || groupEntries.size === 0) {
    return null;
  }

  const plotMap = new Map();
  STAT_FIELDS.forEach((stat) => {
    plotMap.set(stat.key, {
      key: `stat-${stat.key}`,
      title: stat.label,
      tabLabel: `Min ${stat.label}`,
      yAxisTitle: `${stat.label} (running min)`,
      series: [],
    });
  });

  const colorOrder = new Map();
  const getColorIndex = (key) => {
    const normalized = key ?? 'stat-default';
    if (!colorOrder.has(normalized)) {
      colorOrder.set(normalized, colorOrder.size);
    }
    return colorOrder.get(normalized);
  };

  Array.from(groupEntries.values())
    .sort((a, b) => labelCollator.compare(a.label, b.label))
    .forEach((group) => {
      STAT_FIELDS.forEach((stat) => {
        const statData = group.stats.get(stat.key);
        if (!statData) {
          return;
        }

        const sortedDates = Array.from(statData.keys()).sort();
        let runningMin = Number.POSITIVE_INFINITY;
        const x = [];
        const y = [];
        const customdata = [];

        sortedDates.forEach((dateKey) => {
          const dailyEntry = statData.get(dateKey);
          const dailyMin = dailyEntry?.min ?? Number.POSITIVE_INFINITY;
          if (!Number.isFinite(dailyMin)) {
            return;
          }
          runningMin = Math.min(runningMin, dailyMin);
          if (!Number.isFinite(runningMin)) {
            return;
          }
          x.push(dateKey);
          y.push(runningMin);
          customdata.push([dailyMin]);
        });

        if (!x.length) {
          return;
        }

        const isAggregate = filterKey === 'all';
        const colorKey = isAggregate ? stat.key : group.key;
        const displayLabel = isAggregate ? stat.label : group.label;
        const colorIndex = getColorIndex(colorKey);
        const plot = plotMap.get(stat.key);
        if (!plot) {
          return;
        }

        plot.series.push({
          key: `${group.key}::${stat.key}`,
          label: displayLabel,
          x,
          y,
          customdata,
          colorIndex,
          hovertemplate: `<b>%{x}</b><br>daily min :: %{customdata[0]}<br>running min :: %{y}<extra>${stat.label}${isAggregate ? '' : ` :: ${group.label}`}</extra>`,
          legendgroup: isAggregate ? `min-${stat.key}` : `min-${group.key}-${stat.key}`,
        });
      });
    });

  const plots = STAT_FIELDS.map((stat) => plotMap.get(stat.key))
    .filter((plot) => plot && plot.series.length > 0);

  if (plots.length === 0) {
    return null;
  }

  return {
    plots,
    start: minDate,
    end: maxDate,
    total: totalRecords,
  };
};

const METRIC_BUILDERS = {
  'operator-count': buildOperatorCountSeries,
  'average-stat': buildAverageStatSeries,
  'max-stat': buildMaxStatSeries,
  'min-stat': buildMinStatSeries,
};

const formatDateRangeLabel = (start, end) => {
  if (!start || !end) {
    return 'timeline pending :: awaiting date telemetry';
  }
  return `range :: ${start} → ${end}`;
};

const OperatorTimeline = ({ operatorStatus, onBack }) => {
  const status = operatorStatus?.status ?? { state: 'idle', error: null };
  const rawRecords = operatorStatus?.data;
  const records = useMemo(
    () => (Array.isArray(rawRecords) ? rawRecords : EMPTY_ARRAY),
    [rawRecords],
  );
  const plotRef = useRef(null);
  const [activePlotKey, setActivePlotKey] = useState(null);
  const [metricKey, setMetricKey] = useState(METRIC_OPTIONS[0].key);
  const [filterKey, setFilterKey] = useState(FILTER_OPTIONS[0].key);

  const activeMetric = useMemo(
    () => METRIC_OPTIONS.find((option) => option.key === metricKey) ?? METRIC_OPTIONS[0],
    [metricKey],
  );

  const activeFilter = useMemo(
    () => FILTER_OPTIONS.find((option) => option.key === filterKey) ?? FILTER_OPTIONS[0],
    [filterKey],
  );

  const timelineSeries = useMemo(
    () => {
      if (activeMetric.placeholder) {
        return null;
      }
      const builder = METRIC_BUILDERS[activeMetric.key];
      if (typeof builder !== 'function') {
        return null;
      }
      return builder(records, filterKey);
    },
    [records, activeMetric, filterKey],
  );

  useEffect(() => {
    if (!timelineSeries || !Array.isArray(timelineSeries.plots) || timelineSeries.plots.length === 0) {
      setActivePlotKey(null);
      if (plotRef.current) {
        Plotly.purge(plotRef.current);
      }
      return;
    }
    setActivePlotKey((previous) => {
      if (previous && timelineSeries.plots.some((plot) => plot.key === previous)) {
        return previous;
      }
      return timelineSeries.plots[0].key;
    });
  }, [timelineSeries]);

  const activePlot = useMemo(() => {
    if (!timelineSeries || !Array.isArray(timelineSeries.plots)) {
      return null;
    }
    return timelineSeries.plots.find((plot) => plot.key === activePlotKey) ?? null;
  }, [timelineSeries, activePlotKey]);

  useEffect(() => {
    const node = plotRef.current;
    if (!node) {
      return () => {};
    }
    if (!activePlot || !Array.isArray(activePlot.series) || activePlot.series.length === 0) {
      Plotly.purge(node);
      return () => {};
    }

    const showLegend = activePlot.series.length > 1;
    const traces = activePlot.series.map((entry) => {
      const colorIndex = entry.colorIndex ?? 0;
      const color = TIMELINE_COLORWAY[colorIndex % TIMELINE_COLORWAY.length];
      return {
        type: 'scatter',
        mode: 'lines+markers',
        name: entry.label,
        x: entry.x,
        y: entry.y,
        line: {
          color,
          width: 3,
        },
        marker: {
          color,
          size: 6,
        },
        hovertemplate: entry.hovertemplate ?? '<b>%{x}</b><br>value :: %{y}<extra></extra>',
        customdata: entry.customdata ?? [],
        legendgroup: entry.legendgroup ?? entry.key,
        showlegend: showLegend,
      };
    });

    const layout = {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: {
        family: 'Courier New, monospace',
        color: GRAPH_TEXT_COLOR,
      },
      margin: { t: 36, r: 18, b: 48, l: 56 },
      hoverlabel: {
        bgcolor: 'rgba(6, 18, 16, 0.92)',
        bordercolor: '#4DFFA7',
        font: {
          family: 'Courier New, monospace',
          color: '#C5F5CC',
          size: 12,
        },
      },
      xaxis: {
        title: 'date_joined',
        gridcolor: 'rgba(77, 255, 167, 0.15)',
        linecolor: GRAPH_AXIS_LINE_COLOR,
        tickfont: {
          size: 11,
          color: GRAPH_TEXT_COLOR,
        },
        titlefont: {
          size: 12,
          color: GRAPH_TEXT_COLOR,
        },
      },
      yaxis: {
        title: activePlot.yAxisTitle,
        gridcolor: 'rgba(77, 255, 167, 0.12)',
        linecolor: GRAPH_AXIS_LINE_COLOR,
        tickfont: {
          size: 11,
          color: GRAPH_TEXT_COLOR,
        },
        titlefont: {
          size: 12,
          color: GRAPH_TEXT_COLOR,
        },
      },
      hovermode: 'x unified',
      legend: {
        orientation: 'h',
        yanchor: 'bottom',
        y: 1.02,
        xanchor: 'left',
        x: 0,
        font: {
          size: 10,
          color: GRAPH_TEXT_COLOR,
        },
      },
    };

    Plotly.react(node, traces, layout, {
      displaylogo: false,
      responsive: true,
      modeBarButtonsToRemove: ['lasso2d', 'select2d'],
    });

    const handleResize = () => {
      Plotly.Plots.resize(node);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [activePlot]);

  const datasetStatusLabel = (() => {
    if (status.state === 'loading') {
      return 'link engaged :: compiling telemetry';
    }
    if (status.state === 'error') {
      return `link failed :: ${status.error ?? 'telemetry offline'}`;
    }
    if (status.state === 'loaded') {
      return `link stable :: ${records.length} records cached`;
    }
    return 'link dormant :: awaiting dataset';
  })();

  const isMetricPlaceholder = activeMetric.placeholder;
  const hasPlots = Array.isArray(timelineSeries?.plots) && timelineSeries.plots.length > 0;
  const isReady = status.state === 'loaded' && hasPlots && activePlot;

  const filterNoteMessage = (() => {
    const primarySeriesCount = activePlot?.series?.length ?? timelineSeries?.plots?.[0]?.series?.length ?? 0;
    if (activeFilter.key === 'class') {
      const descriptor = primarySeriesCount > 0 ? `${primarySeriesCount} class channels` : 'class channels';
      return `rendering ${descriptor} :: ${activeMetric.label}`;
    }
    if (activeFilter.key === 'rarity') {
      const descriptor = primarySeriesCount > 0 ? `${primarySeriesCount} rarity tiers` : 'rarity tiers';
      return `rendering ${descriptor} :: ${activeMetric.label}`;
    }
    if (activeFilter.key === 'gender') {
      const descriptor = primarySeriesCount > 0 ? `${primarySeriesCount} gender categories` : 'gender categories';
      return `rendering ${descriptor} :: ${activeMetric.label}`;
    }
    if (activeMetric.key === 'average-stat') {
      return 'displaying aggregate averages across all operators';
    }
    if (activeMetric.key === 'max-stat') {
      return 'displaying running maxima across all operators';
    }
    if (activeMetric.key === 'min-stat') {
      return 'displaying running minima across all operators';
    }
    return 'displaying aggregate counts across all operators';
  })();

  return (
    <div className="operator-layout">
      <div className="operator-panel operator-panel--stats">
        <div className="operator-header">
          <div className="operator-header-stack">
            <div className="operator-subtitle">analytics uplink</div>
            <div className="operator-title">operator timeline</div>
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
        <div className="timeline-toolbar">
          <div className="timeline-toolbar__control">
            <label className="timeline-toolbar__label" htmlFor="timeline-metric-select">
              data channel
            </label>
            <select
              id="timeline-metric-select"
              className="timeline-select"
              value={activeMetric.key}
              onChange={(event) => setMetricKey(event.target.value)}
            >
              {METRIC_OPTIONS.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="timeline-toolbar__hint">{activeMetric.description}</div>
          </div>
          <div className="timeline-toolbar__status">
            <span className="timeline-toolbar__label">date window</span>
            <span className="timeline-toolbar__value">
              {formatDateRangeLabel(timelineSeries?.start, timelineSeries?.end)}
            </span>
          </div>
          <div className={`timeline-toolbar__status${activeFilter.key !== 'all' ? ' timeline-toolbar__status--filter' : ''}`}>
            <span className="timeline-toolbar__label">active filter</span>
            <span className="timeline-toolbar__value">
              {activeFilter.key === 'class' && 'split :: class designation'}
              {activeFilter.key === 'rarity' && 'split :: rarity tier'}
              {activeFilter.key === 'gender' && 'split :: gender category'}
              {activeFilter.key === 'all' && 'aggregate :: all records'}
            </span>
          </div>
        </div>
        {status.state === 'loading' && (
          <div className="operator-placeholder">initializing timeline telemetry...</div>
        )}
        {status.state === 'error' && (
          <div className="operator-placeholder operator-placeholder--error">
            unable to render temporal feed
          </div>
        )}
        {status.state === 'loaded' && !timelineSeries && (
          <div className="operator-placeholder">
            {isMetricPlaceholder
              ? 'selected metric pending :: awaiting calculation channel'
              : activeMetric.key === 'average-stat'
                ? 'dataset lacks sufficient stat telemetry for average calculations'
                : activeMetric.key === 'max-stat'
                  ? 'dataset lacks sufficient stat telemetry for max calculations'
                  : activeMetric.key === 'min-stat'
                    ? 'dataset lacks sufficient stat telemetry for min calculations'
                    : 'dataset contains no valid date_joined entries'}
          </div>
        )}
        {isReady && (
          <div className="timeline-shell">
            <div className="timeline-canvas">
              <nav className="timeline-tabs">
                {timelineSeries.plots.map((plot) => (
                  <button
                    type="button"
                    key={plot.key}
                    className={`timeline-tab${plot.key === activePlotKey ? ' timeline-tab--active' : ''}`}
                    onClick={() => setActivePlotKey(plot.key)}
                  >
                    {plot.tabLabel ?? plot.title}
                  </button>
                ))}
              </nav>
              <div className="timeline-plot-panel">
                <header className="timeline-plot-panel__header">
                  <div className="timeline-plot-panel__title">{activePlot?.title}</div>
                  <div className="timeline-plot-panel__meta">{activePlot?.yAxisTitle}</div>
                </header>
                <div className="timeline-plot timeline-plot--plotly" ref={plotRef} />
              </div>
            </div>
            <aside className="timeline-menu">
              <div className="timeline-menu__header">filter console</div>
              <label className="timeline-menu__label" htmlFor="timeline-filter-select">
                active filter
              </label>
              <select
                id="timeline-filter-select"
                className="timeline-select"
                value={activeFilter.key}
                onChange={(event) => setFilterKey(event.target.value)}
              >
                {FILTER_OPTIONS.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="timeline-menu__note">
                {filterNoteMessage}
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

export default OperatorTimeline;
