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
} from '../../../../constants/colorPalettes';

// Scatter plots that compare combat and medical metrics by operator class/rarity.

const METRIC_OPTIONS = [
  { key: 'combat_hp', label: 'combat_hp' },
  { key: 'combat_atk', label: 'combat_atk' },
  { key: 'combat_def', label: 'combat_def' },
  { key: 'combat_res', label: 'combat_res' },
  { key: 'combat_cldn', label: 'combat_cldn' },
  { key: 'combat_cost', label: 'combat_cost' },
  { key: 'combat_blk', label: 'combat_blk' },
  { key: 'combat_atkspd', label: 'combat_atkspd' },
];

const METRIC_MAP = new Map(METRIC_OPTIONS.map((metric) => [metric.key, metric]));
const MEDICAL_METRICS = [
  { key: 'medical_fusion', label: 'medical_fusion' },
  { key: 'medical_bloodRatio', label: 'medical_bloodRatio' },
];
const MEDICAL_X_METRIC = MEDICAL_METRICS[0];
const MEDICAL_Y_METRIC = MEDICAL_METRICS[1];
const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
const CLASS_PALETTE = SCATTER_COLORWAY;

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

const resolveOperatorLabel = (record) => (
  sanitizeLabel(
    record?.name_code ?? record?.code ?? record?.name_real,
    'unknown operator',
  )
);

const parseMetricValue = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') {
      return null;
    }
    const numeric = Number(trimmed);
    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }
  return null;
};

const OperatorScatter = ({ operatorStatus, onBack }) => {
  const status = operatorStatus?.status ?? { state: 'idle', error: null };
  const rawRecords = operatorStatus?.data;
  const records = useMemo(
    () => (Array.isArray(rawRecords) ? rawRecords : []),
    [rawRecords],
  );
  const plotRef = useRef(null);
  const [mode, setMode] = useState('2d');
  const [selectedMetrics, setSelectedMetrics] = useState(['combat_atk', 'combat_def']);
  const [graphType, setGraphType] = useState('combat');
  const isCombatGraph = graphType === 'combat';
  const [metricsOpen, setMetricsOpen] = useState(false);
  const metricsPanelRef = useRef(null);
  const classOptions = useMemo(() => {
    if (!records.length) {
      return [];
    }
    const classSet = new Set();
    records.forEach((record) => {
      classSet.add(sanitizeLabel(record?.operatorRecords_class, 'unclassified'));
    });
    return Array.from(classSet).sort(collator.compare);
  }, [records]);
  const [rarityOptions, setRarityOptions] = useState([]);
  const [selectedRarities, setSelectedRarities] = useState([]);
  const [rarityOpen, setRarityOpen] = useState(false);
  const rarityPanelRef = useRef(null);
  const classColorMap = useMemo(() => {
    const map = new Map();
    classOptions.forEach((label, index) => {
      map.set(label, CLASS_PALETTE[index % CLASS_PALETTE.length]);
    });
    return map;
  }, [classOptions]);

  useEffect(() => {
    if (!isCombatGraph) {
      if (mode !== '2d') {
        setMode('2d');
      }
      setMetricsOpen(false);
      setRarityOpen(false);
      return;
    }

    setSelectedMetrics((previous) => {
      if (mode === '3d') {
        const next = [...previous];
        while (next.length < 3) {
          const fallback = METRIC_OPTIONS.find((metric) => !next.includes(metric.key));
          if (!fallback) {
            break;
          }
          next.push(fallback.key);
        }
        const normalized = next.slice(0, 3);
        const unchanged = normalized.length === previous.length
          && normalized.every((value, index) => value === previous[index]);
        return unchanged ? previous : normalized;
      }
      if (previous.length > 2) {
        const normalized = previous.slice(0, 2);
        const unchanged = normalized.length === previous.length
          && normalized.every((value, index) => value === previous[index]);
        return unchanged ? previous : normalized;
      }
      return previous;
    });
    setMetricsOpen(false);
    setRarityOpen(false);
  }, [mode, isCombatGraph]);

  useEffect(() => {
    if (!records.length) {
      setRarityOptions([]);
      setSelectedRarities([]);
      return;
    }

    const raritySet = new Set();

    records.forEach((record) => {
      raritySet.add(sanitizeLabel(record?.operatorRecords_rarity, '—'));
    });

    const rarities = Array.from(raritySet).sort(collator.compare);

    setRarityOptions(rarities);

    setSelectedRarities((previous) => {
      const filtered = previous.filter((value) => rarities.includes(value));
      if (filtered.length === 0) {
        return rarities;
      }
      if (filtered.length === rarities.length) {
        return filtered;
      }
      if (filtered.length === previous.length) {
        const extras = rarities.filter((value) => !filtered.includes(value));
        return [...filtered, ...extras];
      }
      return filtered;
    });

    setMetricsOpen(false);
    setRarityOpen(false);
  }, [records]);

  useEffect(() => {
    if (!metricsOpen && !rarityOpen) {
      return () => {};
    }

    const handleClickAway = (event) => {
      if (metricsOpen && metricsPanelRef.current && !metricsPanelRef.current.contains(event.target)) {
        setMetricsOpen(false);
      }
      if (rarityOpen && rarityPanelRef.current && !rarityPanelRef.current.contains(event.target)) {
        setRarityOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickAway);
    return () => {
      document.removeEventListener('mousedown', handleClickAway);
    };
  }, [metricsOpen, rarityOpen]);

  const maxSelection = mode === '3d' ? 3 : 2;
  const minSelection = maxSelection;
  const hasMinimumSelection = isCombatGraph ? selectedMetrics.length >= minSelection : true;

  const axesMetrics = useMemo(
    () => selectedMetrics.slice(0, maxSelection).map((key) => METRIC_MAP.get(key)).filter(Boolean),
    [selectedMetrics, maxSelection],
  );

  const combatXMetric = axesMetrics[0] ?? null;
  const combatYMetric = axesMetrics[1] ?? null;
  const combatZMetric = mode === '3d' ? axesMetrics[2] ?? null : null;

  const xMetric = isCombatGraph ? combatXMetric : MEDICAL_X_METRIC;
  const yMetric = isCombatGraph ? combatYMetric : MEDICAL_Y_METRIC;
  const zMetric = isCombatGraph && mode === '3d' ? combatZMetric : null;

  const metricExtents = useMemo(() => {
    if (!records.length) {
      return {};
    }

    const extents = {};
    METRIC_OPTIONS.forEach((metric) => {
      extents[metric.key] = { min: Infinity, max: -Infinity };
    });

    records.forEach((record) => {
      METRIC_OPTIONS.forEach((metric) => {
        const parsed = parseMetricValue(record?.[metric.key]);
        if (parsed === null) {
          return;
        }
        const bucket = extents[metric.key];
        if (parsed < bucket.min) {
          bucket.min = parsed;
        }
        if (parsed > bucket.max) {
          bucket.max = parsed;
        }
      });
    });

    return extents;
  }, [records]);

  const scatterBundle = useMemo(() => {
    if (!isCombatGraph) {
      if (!records.length) {
        return null;
      }

      const classGroups = new Map();
      let medicalXMin = Infinity;
      let medicalXMax = -Infinity;
      let medicalYMin = Infinity;
      let medicalYMax = -Infinity;

      records.forEach((record, index) => {
        const fusion = parseMetricValue(record?.[MEDICAL_X_METRIC.key]);
        const bloodRatio = parseMetricValue(record?.[MEDICAL_Y_METRIC.key]);
        if (fusion === null || bloodRatio === null) {
          return;
        }

        if (fusion < medicalXMin) {
          medicalXMin = fusion;
        }
        if (fusion > medicalXMax) {
          medicalXMax = fusion;
        }
        if (bloodRatio < medicalYMin) {
          medicalYMin = bloodRatio;
        }
        if (bloodRatio > medicalYMax) {
          medicalYMax = bloodRatio;
        }

        const classLabel = sanitizeLabel(record?.operatorRecords_class, 'unclassified');
        const rarityLabel = sanitizeLabel(record?.operatorRecords_rarity, '—');
        const operatorLabel = resolveOperatorLabel(record);

        if (!classGroups.has(classLabel)) {
          const color = classColorMap.get(classLabel) ?? CLASS_PALETTE[0];
          classGroups.set(classLabel, {
            classLabel,
            color,
            x: [],
            y: [],
            text: [],
            customdata: [],
          });
        }

        const group = classGroups.get(classLabel);
        group.x.push(fusion);
        group.y.push(bloodRatio);
        group.text.push(rarityLabel);
        group.customdata.push([operatorLabel, rarityLabel, classLabel, index]);
      });

      const groups = Array.from(classGroups.values()).filter((group) => group.x.length > 0);
      if (!groups.length) {
        return null;
      }

      const traces = groups.map((group) => ({
        type: 'scatter',
        mode: 'markers+text',
        name: group.classLabel,
        x: group.x,
        y: group.y,
        text: group.text,
        textposition: 'top center',
        textfont: {
          family: 'Courier New, monospace',
          color: '#04120A',
          size: 10,
        },
        marker: {
          size: 18,
          color: group.color,
          line: {
            width: 1,
            color: 'rgba(6, 18, 16, 0.85)',
          },
          opacity: 0.88,
        },
        customdata: group.customdata,
        hovertemplate: `<b>%{customdata[0]}</b><br>${MEDICAL_X_METRIC.label} :: %{x}<br>${MEDICAL_Y_METRIC.label} :: %{y}<br>class :: %{customdata[2]}<br>rarity :: %{customdata[1]}<extra></extra>`,
      }));

      const layout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: {
          family: 'Courier New, monospace',
          color: GRAPH_TEXT_COLOR,
        },
        margin: { t: 48, l: 64, r: 140, b: 64 },
        xaxis: {
          title: MEDICAL_X_METRIC.label,
          gridcolor: 'rgba(77, 255, 167, 0.12)',
          zerolinecolor: GRAPH_AXIS_LINE_COLOR,
          tickfont: { size: 12, color: GRAPH_TEXT_COLOR },
          titlefont: { size: 13, color: GRAPH_TEXT_COLOR },
          range: [
            Number.isFinite(medicalXMin) ? medicalXMin : null,
            Number.isFinite(medicalXMax) ? medicalXMax : null,
          ],
        },
        yaxis: {
          title: MEDICAL_Y_METRIC.label,
          gridcolor: 'rgba(77, 255, 167, 0.12)',
          zerolinecolor: GRAPH_AXIS_LINE_COLOR,
          tickfont: { size: 12, color: GRAPH_TEXT_COLOR },
          titlefont: { size: 13, color: GRAPH_TEXT_COLOR },
          range: [
            Number.isFinite(medicalYMin) ? medicalYMin : null,
            Number.isFinite(medicalYMax) ? medicalYMax : null,
          ],
        },
        legend: {
          orientation: 'v',
          yanchor: 'top',
          y: 1,
          xanchor: 'left',
          x: 1.02,
          bgcolor: 'rgba(4, 10, 12, 0.6)',
          bordercolor: 'rgba(77, 255, 167, 0.22)',
          borderwidth: 1,
          font: {
            size: 11,
            color: GRAPH_TEXT_COLOR,
          },
        },
      };

      return {
        traces,
        layout,
        hasPoints: true,
        mode: '2d',
        graphType: 'medical',
      };
    }

    if (
      !records.length
      || !hasMinimumSelection
      || !selectedRarities.length
      || !xMetric
      || !yMetric
      || (mode === '3d' && !zMetric)
    ) {
      return null;
    }

    const raritySelection = new Set(selectedRarities);

    const classGroups = new Map();

    records.forEach((record, index) => {
      const classLabel = sanitizeLabel(record?.operatorRecords_class, 'unclassified');
      const rarityLabel = sanitizeLabel(record?.operatorRecords_rarity, '—');

      if (!raritySelection.has(rarityLabel)) {
        return;
      }

      const xValue = parseMetricValue(record?.[xMetric.key]);
      const yValue = parseMetricValue(record?.[yMetric.key]);
      const zValue = mode === '3d' ? parseMetricValue(record?.[zMetric.key]) : null;

      if (xValue === null || yValue === null || (mode === '3d' && zValue === null)) {
        return;
      }

      const operatorLabel = resolveOperatorLabel(record);

      if (!classGroups.has(classLabel)) {
        const color = classColorMap.get(classLabel) ?? CLASS_PALETTE[0];
        classGroups.set(classLabel, {
          classLabel,
          color,
          x: [],
          y: [],
          z: [],
          text: [],
          customdata: [],
        });
      }

      const group = classGroups.get(classLabel);
      group.x.push(xValue);
      group.y.push(yValue);
      if (mode === '3d') {
        group.z.push(zValue);
      }
      group.text.push(rarityLabel);
      group.customdata.push([operatorLabel, rarityLabel, classLabel, index]);
    });

    const groups = Array.from(classGroups.values()).filter((group) => group.x.length > 0);
    if (!groups.length) {
      return null;
    }

    if (mode === '3d') {
      const traces = groups.map((group) => ({
        type: 'scatter3d',
        mode: 'markers+text',
        name: group.classLabel,
        x: group.x,
        y: group.y,
        z: group.z,
        text: group.text,
        textposition: 'middle center',
        textfont: {
          family: 'Courier New, monospace',
          color: '#04120A',
          size: 11,
        },
        marker: {
          size: 8,
          color: group.color,
          line: {
            width: 1,
            color: 'rgba(6, 18, 16, 0.85)',
          },
          opacity: 0.9,
        },
        customdata: group.customdata,
        hovertemplate: `<b>%{customdata[0]}</b><br>${xMetric.label} :: %{x}<br>${yMetric.label} :: %{y}<br>${zMetric.label} :: %{z}<br>class :: %{customdata[2]}<br>rarity :: %{customdata[1]}<extra></extra>`,
      }));

      const layout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        font: {
          family: 'Courier New, monospace',
          color: GRAPH_TEXT_COLOR,
        },
        margin: { t: 48, l: 0, r: 140, b: 0 },
        scene: {
          bgcolor: 'rgba(0,0,0,0)',
          xaxis: {
            title: xMetric.label,
            gridcolor: 'rgba(77, 255, 167, 0.12)',
            zerolinecolor: GRAPH_AXIS_LINE_COLOR,
            tickfont: { size: 11, color: GRAPH_TEXT_COLOR },
            titlefont: { size: 12, color: GRAPH_TEXT_COLOR },
            range: [
              Number.isFinite(metricExtents[xMetric.key]?.min) ? metricExtents[xMetric.key].min : null,
              Number.isFinite(metricExtents[xMetric.key]?.max) ? metricExtents[xMetric.key].max : null,
            ],
          },
          yaxis: {
            title: yMetric.label,
            gridcolor: 'rgba(77, 255, 167, 0.12)',
            zerolinecolor: GRAPH_AXIS_LINE_COLOR,
            tickfont: { size: 11, color: GRAPH_TEXT_COLOR },
            titlefont: { size: 12, color: GRAPH_TEXT_COLOR },
            range: [
              Number.isFinite(metricExtents[yMetric.key]?.min) ? metricExtents[yMetric.key].min : null,
              Number.isFinite(metricExtents[yMetric.key]?.max) ? metricExtents[yMetric.key].max : null,
            ],
          },
          zaxis: {
            title: zMetric.label,
            gridcolor: 'rgba(77, 255, 167, 0.12)',
            zerolinecolor: GRAPH_AXIS_LINE_COLOR,
            tickfont: { size: 11, color: GRAPH_TEXT_COLOR },
            titlefont: { size: 12, color: GRAPH_TEXT_COLOR },
            range: [
              Number.isFinite(metricExtents[zMetric.key]?.min) ? metricExtents[zMetric.key].min : null,
              Number.isFinite(metricExtents[zMetric.key]?.max) ? metricExtents[zMetric.key].max : null,
            ],
          },
          domain: { x: [0, 0.78], y: [0, 1] },
        },
        legend: {
          orientation: 'v',
          yanchor: 'top',
          y: 1,
          xanchor: 'left',
          x: 1.02,
          bgcolor: 'rgba(4, 10, 12, 0.6)',
          bordercolor: 'rgba(77, 255, 167, 0.22)',
          borderwidth: 1,
          font: {
            size: 11,
            color: GRAPH_TEXT_COLOR,
          },
        },
      };

      return {
        traces,
        layout,
        hasPoints: true,
        mode,
        graphType: 'combat',
      };
    }

    const traces = groups.map((group) => ({
      type: 'scatter',
      mode: 'markers+text',
      name: group.classLabel,
      x: group.x,
      y: group.y,
      text: group.text,
      textposition: 'middle center',
      textfont: {
        family: 'Courier New, monospace',
        color: '#04120A',
        size: 11,
      },
      marker: {
        size: 20,
        color: group.color,
        line: {
          width: 1,
          color: 'rgba(6, 18, 16, 0.85)',
        },
        opacity: 0.92,
      },
      customdata: group.customdata,
      hovertemplate: `<b>%{customdata[0]}</b><br>${xMetric.label} :: %{x}<br>${yMetric.label} :: %{y}<br>class :: %{customdata[2]}<br>rarity :: %{customdata[1]}<extra></extra>`,
    }));

    const layout = {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: {
        family: 'Courier New, monospace',
        color: GRAPH_TEXT_COLOR,
      },
      margin: { t: 48, l: 64, r: 140, b: 64 },
      xaxis: {
        title: xMetric.label,
        gridcolor: 'rgba(77, 255, 167, 0.12)',
        zerolinecolor: GRAPH_AXIS_LINE_COLOR,
        tickfont: { size: 12, color: GRAPH_TEXT_COLOR },
        titlefont: { size: 13, color: GRAPH_TEXT_COLOR },
        range: [
          Number.isFinite(metricExtents[xMetric.key]?.min) ? metricExtents[xMetric.key].min : null,
          Number.isFinite(metricExtents[xMetric.key]?.max) ? metricExtents[xMetric.key].max : null,
        ],
      },
      yaxis: {
        title: yMetric.label,
        gridcolor: 'rgba(77, 255, 167, 0.12)',
        zerolinecolor: GRAPH_AXIS_LINE_COLOR,
        tickfont: { size: 12, color: GRAPH_TEXT_COLOR },
        titlefont: { size: 13, color: GRAPH_TEXT_COLOR },
        range: [
          Number.isFinite(metricExtents[yMetric.key]?.min) ? metricExtents[yMetric.key].min : null,
          Number.isFinite(metricExtents[yMetric.key]?.max) ? metricExtents[yMetric.key].max : null,
        ],
      },
      legend: {
        orientation: 'v',
        yanchor: 'top',
        y: 1,
        xanchor: 'left',
        x: 1.02,
        bgcolor: 'rgba(4, 10, 12, 0.6)',
        bordercolor: 'rgba(77, 255, 167, 0.22)',
        borderwidth: 1,
        font: {
          size: 11,
          color: GRAPH_TEXT_COLOR,
        },
      },
    };

    return {
      traces,
      layout,
      hasPoints: true,
      mode,
      graphType: 'combat',
    };
  }, [isCombatGraph, records, hasMinimumSelection, selectedRarities, mode, xMetric, yMetric, zMetric, classColorMap, metricExtents]);

  useEffect(() => {
    const node = plotRef.current;
    if (!node) {
      return () => {};
    }

    if (!scatterBundle || !scatterBundle.hasPoints) {
      Plotly.purge(node);
      return () => {};
    }

    Plotly.react(node, scatterBundle.traces, scatterBundle.layout, {
      displaylogo: false,
      responsive: true,
      modeBarButtonsToRemove: scatterBundle.mode === '3d' ? ['lasso3d'] : ['lasso2d'],
    });

    const handleResize = () => {
      Plotly.Plots.resize(node);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      Plotly.purge(node);
    };
  }, [scatterBundle]);

  const handleToggleMetric = (metricKey) => {
    setSelectedMetrics((previous) => {
      if (previous.includes(metricKey)) {
        return previous.filter((key) => key !== metricKey);
      }
      if (previous.length >= maxSelection) {
        return previous;
      }
      return [...previous, metricKey];
    });
  };

  const handleToggleRarity = (value) => {
    setSelectedRarities((previous) => {
      if (previous.includes(value)) {
        if (previous.length === 1) {
          return previous;
        }
        return previous.filter((entry) => entry !== value);
      }
      return [...previous, value];
    });
  };

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

  const metricsButtonLabel = (() => {
    if (selectedMetrics.length === 0) {
      return 'select metrics';
    }
    if (selectedMetrics.length === maxSelection) {
      return `${selectedMetrics.length}/${maxSelection} selected`;
    }
    return `${selectedMetrics.length} selected`;
  })();

  const rarityButtonLabel = (() => {
    if (!rarityOptions.length) {
      return 'no rarities';
    }
    if (selectedRarities.length === rarityOptions.length) {
      return 'all rarities';
    }
    return `${selectedRarities.length} selected`;
  })();

  const hasRaritySelection = selectedRarities.length > 0;

  const selectionPrompt = isCombatGraph
    ? (mode === '3d'
      ? 'choose three combat metrics and refine rarity filter'
      : 'choose two combat metrics and refine rarity filter')
    : 'medical fusion vs blood ratio · filters not required';

  const emptyPlotMessage = isCombatGraph
    ? 'no matching records for the current filters'
    : 'medical telemetry unavailable for the current dataset';

  const selectionBlockingMessage = (() => {
    if (!isCombatGraph) {
      return null;
    }
    if (!records.length) {
      return null;
    }
    if (!hasRaritySelection) {
      return 'select at least one rarity to activate the scatter plot';
    }
    if (!hasMinimumSelection) {
      return mode === '3d'
        ? 'select three metrics to activate the scatter plot'
        : 'select two metrics to activate the scatter plot';
    }
    return null;
  })();

  const hasScatterPoints = Boolean(scatterBundle?.hasPoints);
  const canRenderPlot = status.state === 'loaded' && !selectionBlockingMessage && hasScatterPoints;

  const toggleMetricsPanel = () => {
    if (!isCombatGraph) {
      return;
    }
    setMetricsOpen((previous) => {
      const next = !previous;
      if (!previous && next) {
        setRarityOpen(false);
      }
      return next;
    });
  };

  const toggleRarityPanel = () => {
    if (!rarityOptions.length || !isCombatGraph) {
      return;
    }
    setRarityOpen((previous) => {
      const next = !previous;
      if (!previous && next) {
        setMetricsOpen(false);
      }
      return next;
    });
  };

  return (
    <div className="operator-layout">
      <div className="operator-panel operator-panel--stats">
        <div className="operator-header">
          <div className="operator-header-stack">
            <div className="operator-subtitle">analytics uplink</div>
            <div className="operator-title">Comparison: Scatter</div>
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
        <div className="scatter-mode scatter-mode--inline">
          <div className="scatter-mode__segment">
            <span className="scatter-mode__label">graph type</span>
            <div className="scatter-mode-toggle" role="group" aria-label="scatter graph type">
              <button
                type="button"
                className={`scatter-mode-toggle__button${graphType === 'combat' ? ' scatter-mode-toggle__button--active' : ''}`}
                onClick={() => setGraphType('combat')}
                aria-pressed={graphType === 'combat'}
              >
                combat
              </button>
              <button
                type="button"
                className={`scatter-mode-toggle__button${graphType === 'medical' ? ' scatter-mode-toggle__button--active' : ''}`}
                onClick={() => setGraphType('medical')}
                aria-pressed={graphType === 'medical'}
              >
                medical
              </button>
            </div>
          </div>
          {isCombatGraph && (
            <div className="scatter-mode__segment">
              <span className="scatter-mode__label">view mode</span>
              <div className="scatter-mode-toggle" role="group" aria-label="scatter dimensionality">
                <button
                  type="button"
                  className={`scatter-mode-toggle__button${mode === '2d' ? ' scatter-mode-toggle__button--active' : ''}`}
                  onClick={() => setMode('2d')}
                  aria-pressed={mode === '2d'}
                >
                  2D
                </button>
                <button
                  type="button"
                  className={`scatter-mode-toggle__button${mode === '3d' ? ' scatter-mode-toggle__button--active' : ''}`}
                  onClick={() => setMode('3d')}
                  aria-pressed={mode === '3d'}
                >
                  3D
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="scatter-controls">
          <div className="scatter-controls__legend">{selectionPrompt}</div>
          <div className="scatter-select-group">
            {isCombatGraph ? (
              <>
                <div className="scatter-select">
                  <span className="scatter-select__label">metrics</span>
                  <div className="scatter-select-trigger" ref={metricsPanelRef}>
                    <button
                      type="button"
                      className="scatter-metric-button"
                      onClick={toggleMetricsPanel}
                      aria-expanded={metricsOpen}
                    >
                      {metricsButtonLabel}
                      <span className="scatter-metric-button__chevron" aria-hidden="true">▾</span>
                    </button>
                    {metricsOpen && (
                      <div className="scatter-metric-popover">
                        {METRIC_OPTIONS.map((metric) => {
                          const checked = selectedMetrics.includes(metric.key);
                          const disabled = !checked && selectedMetrics.length >= maxSelection;
                          return (
                            <label
                              key={metric.key}
                              className={`scatter-metric-option${checked ? ' scatter-metric-option--active' : ''}`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => handleToggleMetric(metric.key)}
                                disabled={disabled}
                              />
                              <span>{metric.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div className="scatter-select">
                  <span className="scatter-select__label">rarity</span>
                  <div className="scatter-select-trigger" ref={rarityPanelRef}>
                    <button
                      type="button"
                      className="scatter-metric-button"
                      onClick={toggleRarityPanel}
                      aria-expanded={rarityOpen}
                      disabled={rarityOptions.length === 0}
                    >
                      {rarityButtonLabel}
                      <span className="scatter-metric-button__chevron" aria-hidden="true">▾</span>
                    </button>
                    {rarityOpen && (
                      <div className="scatter-metric-popover">
                        {rarityOptions.map((option) => {
                          const checked = selectedRarities.includes(option);
                          const disabled = checked && selectedRarities.length === 1;
                          return (
                            <label
                              key={option}
                              className={`scatter-metric-option${checked ? ' scatter-metric-option--active' : ''}`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => handleToggleRarity(option)}
                                disabled={disabled}
                              />
                              <span>{option}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="scatter-select">
                <span className="scatter-select__label">filters</span>
                <div className="scatter-panel__note">
                  medical scatter includes all operators · no filters available
                </div>
              </div>
            )}
          </div>
        </div>
        {status.state === 'loading' && (
          <div className="operator-placeholder">assembling scatter projection...</div>
        )}
        {status.state === 'error' && (
          <div className="operator-placeholder operator-placeholder--error">
            unable to render telemetry
          </div>
        )}
        {status.state === 'loaded' && !records.length && (
          <div className="operator-placeholder">dataset returned no entries</div>
        )}
        {status.state === 'loaded' && selectionBlockingMessage && (
          <div className="operator-placeholder">{selectionBlockingMessage}</div>
        )}
        {status.state === 'loaded' && !selectionBlockingMessage && !hasScatterPoints && (
          <div className="operator-placeholder operator-placeholder--empty">
            {emptyPlotMessage}
          </div>
        )}
        {canRenderPlot && (
          <div className="scatter-shell">
            <div className="scatter-plot" ref={plotRef} />
            {isCombatGraph ? (
              <aside className="scatter-panel">
                <div className="scatter-panel__header">plot context</div>
                <div className="scatter-panel__item">
                  <span className="scatter-panel__label">x-axis</span>
                  <span className="scatter-panel__value">{xMetric.label}</span>
                </div>
                <div className="scatter-panel__item">
                  <span className="scatter-panel__label">y-axis</span>
                  <span className="scatter-panel__value">{yMetric.label}</span>
                </div>
                {mode === '3d' && zMetric && (
                  <div className="scatter-panel__item">
                    <span className="scatter-panel__label">z-axis</span>
                    <span className="scatter-panel__value">{zMetric.label}</span>
                  </div>
                )}
                <div className="scatter-panel__item">
                  <span className="scatter-panel__label">marker</span>
                  <span className="scatter-panel__value">class color · rarity inside</span>
                </div>
                <div className="scatter-panel__note">
                  hover nodes to reveal operator name and precise values
                </div>
              </aside>
            ) : (
              <aside className="scatter-panel">
                <div className="scatter-panel__header">medical context</div>
                <div className="scatter-panel__item">
                  <span className="scatter-panel__label">x-axis</span>
                  <span className="scatter-panel__value">{MEDICAL_X_METRIC.label}</span>
                </div>
                <div className="scatter-panel__item">
                  <span className="scatter-panel__label">y-axis</span>
                  <span className="scatter-panel__value">{MEDICAL_Y_METRIC.label}</span>
                </div>
                <div className="scatter-panel__note">
                  class colors carry over from combat view · rarity prints inside markers
                </div>
              </aside>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OperatorScatter;
