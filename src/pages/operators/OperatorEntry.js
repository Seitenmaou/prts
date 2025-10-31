import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useParams } from 'react-router-dom';
import Plotly from 'plotly.js-dist';

// Detailed view for a single operator with optional metric charting.

const getOperatorName = (record, fallbackLabel) => {
  if (!record || typeof record !== 'object') {
    return fallbackLabel;
  }

  return (
    record.name_code
    ?? record.code
    ?? record.name_real
    ?? fallbackLabel
  );
};

const inferRecordById = (records, rawId) => {
  if (!Array.isArray(records) || !rawId) {
    return null;
  }

  const normalizedId = rawId.trim().toLowerCase();
  if (!normalizedId) {
    return null;
  }

  const directMatch = records.find((record) => {
    const candidate = record?.ID ?? record?.id ?? record?.operator_id;
    if (candidate === null || candidate === undefined) {
      return false;
    }
    return String(candidate).trim().toLowerCase() === normalizedId;
  });

  if (directMatch) {
    return directMatch;
  }

  const numericIndex = Number.parseInt(normalizedId, 10);
  if (Number.isNaN(numericIndex) || numericIndex < 0 || numericIndex >= records.length) {
    return null;
  }

  return records[numericIndex];
};

const formatFieldValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value.toLocaleString() : String(value);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : '—';
  }
  return String(value);
};

const PHOTO_FIELD_CANDIDATES = [
  'photoFilePath',
  'photo_filepath',
  'photo_file_path',
  'photoPath',
  'photo_path',
  'photo',
  'portraitFilePath',
  'portrait_filepath',
  'portrait_file_path',
  'portraitPath',
  'portrait_path',
  'portrait',
  'filepath',
  'filePath',
];

const resolveOperatorPhotoPath = (record) => {
  if (!record || typeof record !== 'object') {
    return '';
  }

  for (let index = 0; index < PHOTO_FIELD_CANDIDATES.length; index += 1) {
    const key = PHOTO_FIELD_CANDIDATES[index];
    const value = record?.[key];
    if (typeof value !== 'string') {
      continue;
    }
    const trimmed = value.trim();
    if (trimmed) {
      return trimmed;
    }
  }

  return '';
};

const IDENTITY_FIELDS = [
  { key: 'ID', label: 'operator id' },
  { key: 'name_code', label: 'callsign' },
  { key: 'code', label: 'alt code' },
  { key: 'name_real', label: 'real name' },
  { key: 'gender', label: 'gender' },
  { key: 'species', label: 'species' },
  { key: 'date_birth', label: 'date of birth' },
  { key: 'place_birth', label: 'place of birth' },
  { key: 'date_joined', label: 'date joined' },
];

const AFFILIATION_FIELDS = [
  { key: 'affiliation_primary', label: 'primary affiliation' },
  { key: 'affiliation_secondary', label: 'secondary affiliation' },
  { key: 'operatorRecords_class', label: 'tactical class' },
  { key: 'operatorRecords_job', label: 'role designation' },
  { key: 'operatorRecords_rarity', label: 'rarity tier' },
];

const MEDICAL_FIELDS = [
  { key: 'medical_fusion', label: 'fusion compatibility' },
  { key: 'medical_bloodRatio', label: 'blood ratio' },
  { key: 'experience_combat', label: 'combat experience' },
  { key: 'height', label: 'height' },
];

const SKILL_LEVEL_LABELS = ['Flawed', 'Normal', 'Standard', 'Excellent', 'Outstanding', 'REDACTED'];
const SKILL_RATINGS = {
  flawed: 0,
  normal: 1,
  standard: 2,
  excellent: 3,
  outstanding: 4,
  redacted: 5,
};

const SKILL_FIELDS = [
  { key: 'skills_strength', label: 'strength' },
  { key: 'skills_mobility', label: 'mobility' },
  { key: 'skills_endurance', label: 'endurance' },
  { key: 'skills_tacticalAcumen', label: 'tactical acumen' },
  { key: 'skills_combat', label: 'combat arts' },
  { key: 'skills_artsAdaptability', label: 'arts adaptability' },
];

const COMBAT_FIELDS = [
  { key: 'combat_hp', label: 'hp' },
  { key: 'combat_atk', label: 'attack' },
  { key: 'combat_def', label: 'defense' },
  { key: 'combat_res', label: 'resistance' },
  { key: 'combat_cldn', label: 'cooldown' },
  { key: 'combat_cost', label: 'deployment cost' },
  { key: 'combat_blk', label: 'block' },
  { key: 'combat_atkspd', label: 'attack speed' },
];

const RADAR_MODES = [
  { key: 'skills', label: 'skill matrix', fields: SKILL_FIELDS },
  { key: 'combat', label: 'combat telemetry', fields: COMBAT_FIELDS },
];

const INVERTED_COMBAT_FIELDS = new Set(['combat_cost', 'combat_cldn']);

const EMPTY_RADAR_DATA = Object.freeze({
  labels: [],
  normalized: [],
  hoverText: [],
  entries: [],
  hasData: false,
});

const parseNumericValue = (raw) => {
  if (raw === null || raw === undefined || raw === '') {
    return null;
  }
  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? raw : null;
  }
  if (typeof raw === 'string') {
    const normalized = raw.replace(/,/g, '');
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const parseSkillMetric = (raw) => {
  if (raw === null || raw === undefined || raw === '') {
    return null;
  }

  if (typeof raw === 'number') {
    if (!Number.isFinite(raw)) {
      return null;
    }
    return Math.max(0, Math.min(5, Math.round(raw)));
  }

  const segments = String(raw).split('/').map((segment) => segment.trim().toLowerCase()).filter(Boolean);
  if (!segments.length) {
    return null;
  }

  let highest = -1;
  segments.forEach((segment) => {
    const mapped = SKILL_RATINGS[segment];
    if (typeof mapped === 'number') {
      highest = Math.max(highest, mapped);
      return;
    }

    const asNumber = Number.parseFloat(segment);
    if (Number.isFinite(asNumber)) {
      highest = Math.max(highest, Math.max(0, Math.min(5, Math.round(asNumber))));
    }
  });

  return highest >= 0 ? highest : null;
};

const computeFieldStats = (records, fields, parseValue = parseNumericValue) => {
  const stats = {
    max: {},
    min: {},
  };

  fields.forEach(({ key }) => {
    stats.max[key] = 0;
    stats.min[key] = Infinity;
  });

  if (Array.isArray(records)) {
    records.forEach((record) => {
      if (!record || typeof record !== 'object') {
        return;
      }
      fields.forEach(({ key }) => {
        const numeric = parseValue(record?.[key]);
        if (numeric === null) {
          return;
        }
        if (numeric > stats.max[key]) {
          stats.max[key] = numeric;
        }
        if (numeric < stats.min[key]) {
          stats.min[key] = numeric;
        }
      });
    });
  }

  fields.forEach(({ key }) => {
    if (!Number.isFinite(stats.min[key])) {
      stats.min[key] = 0;
    }
  });

  return stats;
};

const formatAverageValue = (value) => {
  if (value === null || Number.isNaN(value)) {
    return '—';
  }
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 });
};

const formatSkillLevelLabel = (value) => {
  if (value === null || Number.isNaN(value)) {
    return '—';
  }
  const clamped = Math.min(SKILL_LEVEL_LABELS.length - 1, Math.max(0, Math.round(value)));
  return SKILL_LEVEL_LABELS[clamped] ?? '—';
};

const buildFieldDataFromRecord = (record, fields, parseValue, formatDisplay = (raw) => formatFieldValue(raw)) => {
  const data = {};
  fields.forEach((field) => {
    const raw = record?.[field.key];
    const numeric = parseValue(raw);
    data[field.key] = {
      numeric,
      display: formatDisplay(raw, numeric),
    };
  });
  return data;
};

const buildFieldDataFromAverages = (records, fields, parseValue, formatDisplay = formatAverageValue) => {
  const aggregates = {};
  fields.forEach((field) => {
    aggregates[field.key] = { sum: 0, count: 0 };
  });

  if (Array.isArray(records)) {
    records.forEach((record) => {
      if (!record || typeof record !== 'object') {
        return;
      }
      fields.forEach((field) => {
        const numeric = parseValue(record?.[field.key]);
        if (numeric === null) {
          return;
        }
        const bucket = aggregates[field.key];
        bucket.sum += numeric;
        bucket.count += 1;
      });
    });
  }

  const data = {};
  fields.forEach((field) => {
    const { sum, count } = aggregates[field.key];
    if (count > 0) {
      const average = sum / count;
      data[field.key] = {
        numeric: average,
        display: formatDisplay(average, average),
      };
    } else {
      data[field.key] = {
        numeric: null,
        display: '—',
      };
    }
  });

  return data;
};

const buildRadarDataset = (fields, stats, fieldData, { invertedKeys = new Set() } = {}) => {
  const labels = [];
  const normalized = [];
  const hoverText = [];
  const entries = [];

  fields.forEach((field) => {
    const data = fieldData?.[field.key] ?? {};
    const numeric = Number.isFinite(data.numeric) ? data.numeric : null;
    const display = data.display ?? '—';
    const max = stats.max?.[field.key] ?? 0;
    const min = stats.min?.[field.key] ?? 0;

    let normalizedValue = 0;
    if (numeric !== null && Number.isFinite(numeric) && Number.isFinite(max) && max > 0) {
      if (invertedKeys.has(field.key)) {
        const span = Math.max(0, max - min);
        if (span > 0) {
          normalizedValue = (max - numeric) / span;
        } else {
          normalizedValue = 0.5;
        }
      } else {
        normalizedValue = numeric / max;
      }
    }
    normalizedValue = Math.max(0, Math.min(1, normalizedValue));

    labels.push(field.label);
    normalized.push(normalizedValue);

    const formattedMax = Number.isFinite(max) && max > 0 ? max.toLocaleString() : '—';
    hoverText.push(`value :: ${display}<br>axis max :: ${formattedMax}`);

    entries.push({
      key: field.key,
      label: field.label,
      numeric,
      display,
      max,
    });
  });

  return {
    labels,
    normalized,
    hoverText,
    entries,
    hasData: entries.some((entry) => entry.numeric !== null),
  };
};

const OperatorEntry = ({ operatorStatus, onBack }) => {
  const { operatorId = '' } = useParams();
  const status = operatorStatus?.status ?? { state: 'idle', error: null };
  const rawRecords = operatorStatus?.data;
  const records = useMemo(
    () => (Array.isArray(rawRecords) ? rawRecords : []),
    [rawRecords],
  );

  const record = useMemo(
    () => inferRecordById(records, operatorId),
    [records, operatorId],
  );
  const [activeRadarKey, setActiveRadarKey] = useState('skills');
  const [compareSelection, setCompareSelection] = useState('');
  const [compareQuery, setCompareQuery] = useState('');
  const radarPlotRef = useRef(null);
  const compareBlurTimeoutRef = useRef(null);
  const compareInputId = useMemo(
    () => `operator-compare-input-${String(operatorId ?? 'current')}`,
    [operatorId],
  );
  const collator = useMemo(
    () => new Intl.Collator('en', { sensitivity: 'base', numeric: true }),
    [],
  );

  const skillFieldStats = useMemo(
    () => computeFieldStats(records, SKILL_FIELDS, parseSkillMetric),
    [records],
  );
  const combatFieldStats = useMemo(
    () => computeFieldStats(records, COMBAT_FIELDS),
    [records],
  );

  const skillFieldData = useMemo(
    () => buildFieldDataFromRecord(
      record,
      SKILL_FIELDS,
      parseSkillMetric,
      (raw, numeric) => {
        if (numeric === null || Number.isNaN(numeric)) {
          return formatFieldValue(raw);
        }
        return formatSkillLevelLabel(numeric);
      },
    ),
    [record],
  );
  const combatFieldData = useMemo(
    () => buildFieldDataFromRecord(record, COMBAT_FIELDS, parseNumericValue),
    [record],
  );

  const radarDataSets = useMemo(() => {
    const skillsDataset = buildRadarDataset(
      SKILL_FIELDS,
      skillFieldStats,
      skillFieldData,
    );
    const combatDataset = buildRadarDataset(
      COMBAT_FIELDS,
      combatFieldStats,
      combatFieldData,
      { invertedKeys: INVERTED_COMBAT_FIELDS },
    );

    return {
      skills: skillsDataset,
      combat: combatDataset,
    };
  }, [skillFieldStats, combatFieldStats, skillFieldData, combatFieldData]);

  const activeRadar = useMemo(
    () => RADAR_MODES.find((mode) => mode.key === activeRadarKey) ?? RADAR_MODES[0],
    [activeRadarKey],
  );
  const activeRadarData = useMemo(
    () => radarDataSets[activeRadar.key] ?? EMPTY_RADAR_DATA,
    [radarDataSets, activeRadar],
  );

  const compareOptions = useMemo(() => {
    if (!Array.isArray(records) || records.length === 0) {
      return [];
    }

    const options = [
      { value: 'average:all', label: 'average :: all operators' },
    ];

    const classToken = record?.operatorRecords_class;
    if (classToken) {
      options.push({
        value: 'average:class',
        label: `average :: class (${formatFieldValue(classToken)})`,
      });
    }

    const jobToken = record?.operatorRecords_job;
    if (jobToken) {
      options.push({
        value: 'average:job',
        label: `average :: job (${formatFieldValue(jobToken)})`,
      });
    }

    const namedRecords = records.map((candidate, index) => ({
      index,
      name: getOperatorName(candidate, `operator ${index}`),
    }));

    namedRecords.sort((left, right) => collator.compare(left.name, right.name));

    namedRecords.forEach(({ index, name }) => {
      options.push({
        value: `operator:${index}`,
        label: name,
      });
    });

    return options;
  }, [records, record, collator]);

  useEffect(() => {
    if (!compareSelection) {
      return;
    }
    const match = compareOptions.find((option) => option.value === compareSelection);
    if (!match) {
      setCompareSelection('');
      setCompareQuery('');
    }
  }, [compareSelection, compareOptions]);

  useEffect(() => {
    if (!compareSelection) {
      return;
    }
    const match = compareOptions.find((option) => option.value === compareSelection);
    if (match && match.label !== compareQuery) {
      setCompareQuery(match.label);
    }
  }, [compareSelection, compareOptions, compareQuery]);

  const comparisonData = useMemo(() => {
    if (!record || !compareSelection || !Array.isArray(records) || records.length === 0) {
      return null;
    }

    let skillData = null;
    let combatData = null;
    let comparisonLabel = '';

    if (compareSelection === 'average:all') {
      skillData = buildFieldDataFromAverages(
        records,
        SKILL_FIELDS,
        parseSkillMetric,
        (value) => formatSkillLevelLabel(value),
      );
      combatData = buildFieldDataFromAverages(records, COMBAT_FIELDS, parseNumericValue);
      comparisonLabel = 'Average :: All Operators';
    } else if (compareSelection === 'average:class') {
      const classToken = record?.operatorRecords_class;
      if (!classToken) {
        return null;
      }
      const filtered = records.filter(
        (candidate) => candidate?.operatorRecords_class === classToken,
      );
      if (!filtered.length) {
        return null;
      }
      skillData = buildFieldDataFromAverages(
        filtered,
        SKILL_FIELDS,
        parseSkillMetric,
        (value) => formatSkillLevelLabel(value),
      );
      combatData = buildFieldDataFromAverages(filtered, COMBAT_FIELDS, parseNumericValue);
      comparisonLabel = `Average :: Class (${formatFieldValue(classToken)})`;
    } else if (compareSelection === 'average:job') {
      const jobToken = record?.operatorRecords_job;
      if (!jobToken) {
        return null;
      }
      const filtered = records.filter(
        (candidate) => candidate?.operatorRecords_job === jobToken,
      );
      if (!filtered.length) {
        return null;
      }
      skillData = buildFieldDataFromAverages(
        filtered,
        SKILL_FIELDS,
        parseSkillMetric,
        (value) => formatSkillLevelLabel(value),
      );
      combatData = buildFieldDataFromAverages(filtered, COMBAT_FIELDS, parseNumericValue);
      comparisonLabel = `Average :: Job (${formatFieldValue(jobToken)})`;
    } else if (compareSelection.startsWith('operator:')) {
      const [, indexToken] = compareSelection.split(':');
      const targetIndex = Number.parseInt(indexToken, 10);
      if (Number.isNaN(targetIndex) || targetIndex < 0 || targetIndex >= records.length) {
        return null;
      }
      const targetRecord = records[targetIndex];
      if (!targetRecord) {
        return null;
      }
      skillData = buildFieldDataFromRecord(
        targetRecord,
        SKILL_FIELDS,
        parseSkillMetric,
        (_raw, numeric) => formatSkillLevelLabel(numeric),
      );
      combatData = buildFieldDataFromRecord(targetRecord, COMBAT_FIELDS, parseNumericValue);
      comparisonLabel = getOperatorName(targetRecord, `operator ${targetIndex}`);
    } else {
      return null;
    }

    const datasets = {
      skills: buildRadarDataset(
        SKILL_FIELDS,
        skillFieldStats,
        skillData,
      ),
      combat: buildRadarDataset(
        COMBAT_FIELDS,
        combatFieldStats,
        combatData,
        { invertedKeys: INVERTED_COMBAT_FIELDS },
      ),
    };

    if (!datasets.skills.hasData && !datasets.combat.hasData) {
      return null;
    }

    return {
      displayName: comparisonLabel,
      datasets,
    };
  }, [compareSelection, record, records, skillFieldStats, combatFieldStats]);

  const [compareDropdownOpen, setCompareDropdownOpen] = useState(false);

  const filteredCompareOptions = useMemo(() => {
    if (!compareOptions.length) {
      return [];
    }
    const query = compareQuery.trim().toLowerCase();
    if (!query) {
      return compareOptions;
    }
    return compareOptions.filter((option) => option.label.toLowerCase().includes(query));
  }, [compareOptions, compareQuery]);

  const displayName = getOperatorName(
    record,
    operatorId ? `operator ${operatorId}` : 'unknown operator',
  );

  const handleCompareInputChange = (event) => {
    const next = event.target.value;
    setCompareQuery(next);
    const match = compareOptions.find(
      (option) => option.label.toLowerCase() === next.toLowerCase(),
    );
    if (match) {
      setCompareSelection(match.value);
    }
  };

  const handleClearComparison = () => {
    setCompareSelection('');
    setCompareQuery('');
    setCompareDropdownOpen(false);
  };

  const handleCompareFocus = () => {
    if (compareBlurTimeoutRef.current) {
      clearTimeout(compareBlurTimeoutRef.current);
      compareBlurTimeoutRef.current = null;
    }
    setCompareDropdownOpen(true);
  };

  const handleCompareBlur = () => {
    compareBlurTimeoutRef.current = setTimeout(() => {
      setCompareDropdownOpen(false);
    }, 120);
  };

  const handleCompareOptionSelect = (option) => {
    if (compareBlurTimeoutRef.current) {
      clearTimeout(compareBlurTimeoutRef.current);
      compareBlurTimeoutRef.current = null;
    }
    setCompareSelection(option.value);
    setCompareQuery(option.label);
    setCompareDropdownOpen(false);
  };

  const resolveValueClasses = (primaryNumeric, comparisonNumeric) => {
    if (comparisonNumeric === null || comparisonNumeric === undefined) {
      return {
        primary: '',
        comparison: '',
      };
    }

    if (primaryNumeric === null || primaryNumeric === undefined) {
      return {
        primary: 'operator-profile__radar-value--lower',
        comparison: 'operator-profile__radar-value--higher',
      };
    }

    const epsilon = 1e-6;
    if (Math.abs(primaryNumeric - comparisonNumeric) <= epsilon) {
      return {
        primary: 'operator-profile__radar-value--equal',
        comparison: 'operator-profile__radar-value--equal',
      };
    }

    if (primaryNumeric > comparisonNumeric) {
      return {
        primary: 'operator-profile__radar-value--higher',
        comparison: 'operator-profile__radar-value--lower',
      };
    }

    return {
      primary: 'operator-profile__radar-value--lower',
      comparison: 'operator-profile__radar-value--higher',
    };
  };

  useEffect(() => () => {
    if (compareBlurTimeoutRef.current) {
      clearTimeout(compareBlurTimeoutRef.current);
      compareBlurTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    const node = radarPlotRef.current;
    if (!node) {
      return () => {};
    }

    if (!record || !activeRadarData.hasData) {
      Plotly.purge(node);
      return () => {};
    }

    const comparisonDataset = comparisonData?.datasets?.[activeRadar.key] ?? null;
    const thetaBase = activeRadarData.labels.slice();

    if (!thetaBase.length) {
      Plotly.purge(node);
      return () => {};
    }

    const primaryValues = activeRadarData.normalized.slice();
    const primaryHover = activeRadarData.hoverText.slice();

    const thetaClosed = [...thetaBase, thetaBase[0]];
    const primaryValuesClosed = [...primaryValues, primaryValues[0] ?? 0];
    const primaryHoverClosed = [
      ...primaryHover,
      primaryHover[0] ?? (primaryHover[primaryHover.length - 1] ?? ''),
    ];

    const traces = [
      {
        type: 'scatterpolar',
        r: primaryValuesClosed,
        theta: thetaClosed,
        fill: 'toself',
        name: displayName,
        text: primaryHoverClosed,
        line: {
          color: 'rgba(16, 16, 16, 0.82)',
          width: 2,
        },
        fillcolor: 'rgba(16, 16, 16, 0.3)',
        marker: {
          color: 'rgba(16, 16, 16, 0.82)',
          size: 6,
        },
        opacity: 0.9,
        hovertemplate: `<b>${displayName}</b><br>%{theta}<br>%{text}<extra></extra>`,
      },
    ];

    if (comparisonDataset && comparisonDataset.hasData) {
      const comparisonValues = comparisonDataset.normalized.slice();
      const comparisonHover = comparisonDataset.hoverText.slice();
      const comparisonValuesClosed = [...comparisonValues, comparisonValues[0] ?? 0];
      const comparisonHoverClosed = [
        ...comparisonHover,
        comparisonHover[0] ?? (comparisonHover[comparisonHover.length - 1] ?? ''),
      ];

      traces.push({
        type: 'scatterpolar',
        r: comparisonValuesClosed,
        theta: thetaClosed,
        fill: 'toself',
        name: comparisonData.displayName,
        text: comparisonHoverClosed,
        line: {
          color: 'rgba(96, 96, 96, 0.85)',
          width: 1.6,
          dash: 'dot',
        },
        fillcolor: 'rgba(120, 120, 120, 0.2)',
        marker: {
          color: 'rgba(96, 96, 96, 0.9)',
          size: 6,
        },
        opacity: 0.7,
        hovertemplate: `<b>${comparisonData.displayName}</b><br>%{theta}<br>%{text}<extra></extra>`,
      });
    }

    const layout = {
      margin: { t: 36, r: 36, b: 36, l: 36 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: {
        family: 'Courier New, monospace',
        color: '#111111',
        size: 12,
      },
      polar: {
        bgcolor: 'rgba(0,0,0,0)',
        radialaxis: {
          range: [0, 1],
          tickvals: [0, 0.25, 0.5, 0.75, 1],
          ticktext: ['0', '0.25', '0.5', '0.75', '1'],
          gridcolor: 'rgba(0, 0, 0, 0.2)',
          linecolor: 'rgba(0, 0, 0, 0.45)',
          tickfont: {
            color: '#111111',
            size: 10,
          },
        },
        angularaxis: {
          gridcolor: 'rgba(0, 0, 0, 0.12)',
          linecolor: 'rgba(0, 0, 0, 0.4)',
          tickfont: {
            color: '#111111',
            size: 11,
          },
        },
      },
      showlegend: Boolean(comparisonDataset?.hasData),
      legend: {
        orientation: 'h',
        x: 0.5,
        y: -0.1,
        xanchor: 'center',
        yanchor: 'top',
      },
    };

    Plotly.react(node, traces, layout, {
      displaylogo: false,
      responsive: true,
      modeBarButtonsToRemove: ['select2d', 'lasso2d', 'zoomIn2d', 'zoomOut2d'],
      displayModeBar: false,
    });

    const handleResize = () => {
      Plotly.Plots.resize(node);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      Plotly.purge(node);
    };
  }, [record, activeRadar, activeRadarData, displayName, comparisonData]);


  const datasetStatusLabel = (() => {
    if (status.state === 'loading') {
      return 'link engaged :: retrieving dossier';
    }
    if (status.state === 'error') {
      return `link failed :: ${status.error ?? 'dossier offline'}`;
    }
    if (status.state === 'loaded') {
      return `link stable :: ${records.length.toLocaleString()} entries cached`;
    }
    return 'link dormant :: awaiting dossier manifest';
  })();

  const renderContent = () => {
    if (status.state === 'loading') {
      return (
        <div className="operator-entry-message">
          acquiring operator profile&hellip;
        </div>
      );
    }

    if (status.state === 'error') {
      return (
        <div className="operator-entry-message operator-entry-message--error">
          dossier connection disrupted :: {status.error ?? 'unknown fault'}
        </div>
      );
    }

    if (!record) {
      if (status.state !== 'loaded') {
        return (
          <div className="operator-entry-message operator-entry-message--warning">
            dossier manifest pending :: synchronize dataset to access entry
          </div>
        );
      }

      return (
        <div className="operator-entry-message operator-entry-message--warning">
          no dossier located for id &ldquo;{operatorId}&rdquo;
        </div>
      );
    }

    const infoSections = [
      { key: 'identity', title: 'identity signal', fields: IDENTITY_FIELDS },
      {
        key: 'affiliationReadiness',
        title: 'affiliation & readiness',
        fields: [...AFFILIATION_FIELDS, ...MEDICAL_FIELDS],
      },
    ];
    const photoPath = resolveOperatorPhotoPath(record);

    const comparisonDataset = comparisonData?.datasets?.[activeRadar.key] ?? null;
    const comparisonEntriesMap = new Map(
      (comparisonDataset?.entries ?? []).map((entry) => [entry.key, entry]),
    );
    const comparisonEnabled = Boolean(comparisonDataset && comparisonDataset.hasData);
    const comparisonLabel = comparisonData?.displayName ?? '';
    const primaryRadarEntries = activeRadarData.entries ?? [];

    return (
      <div className="operator-profile">
        <header className="operator-profile__header">
          <div className="operator-profile__identity">
            <div className="operator-profile__subtitle">operator dossier</div>
            <div className="operator-profile__callout">{displayName}</div>
          </div>
        </header>

        <div className="operator-profile__grid">
          <section className="operator-profile__section operator-profile__section--photo">
            <h3 className="operator-profile__section-title">visual record</h3>
            {photoPath ? (
              <div className="operator-profile__photo-card">
                <div className="operator-profile__photo-frame">
                  <img
                    className="operator-profile__photo"
                    src={photoPath}
                    alt={`${displayName} portrait`}
                    loading="lazy"
                  />
                </div>
                <div className="operator-profile__photo-caption">{displayName}</div>
              </div>
            ) : (
              <div className="operator-profile__photo-placeholder">
                Data not available
              </div>
            )}
          </section>
          {infoSections.map((section) => (
            <section key={section.key} className="operator-profile__section">
              <h3 className="operator-profile__section-title">{section.title}</h3>
              <dl className="operator-profile__fields">
                {section.fields.map((field) => (
                  <div key={field.key} className="operator-profile__field">
                    <dt>{field.label}</dt>
                    <dd>{formatFieldValue(record?.[field.key])}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
          <section className="operator-profile__section operator-profile__section--radar">
            <div className="operator-profile__radar-header">
              <h3 className="operator-profile__section-title">performance matrices</h3>
              <div className="operator-profile__radar-tabs">
                {RADAR_MODES.map((mode) => (
                  <button
                    key={mode.key}
                    type="button"
                    className={`operator-radar-tab${activeRadar.key === mode.key ? ' operator-radar-tab--active' : ''}`}
                    onClick={() => setActiveRadarKey(mode.key)}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="operator-profile__compare-controls">
              <label className="operator-profile__compare-label" htmlFor={compareInputId}>
                compare dossier
              </label>
              <div className="operator-profile__compare-input-row">
                <div className="operator-profile__compare-input-wrapper">
                  <input
                    id={compareInputId}
                    className="operator-profile__compare-input"
                    type="text"
                    value={compareQuery}
                    onChange={handleCompareInputChange}
                    onFocus={handleCompareFocus}
                    onBlur={handleCompareBlur}
                    placeholder="search operator or average..."
                    autoComplete="off"
                  />
                  {compareDropdownOpen && filteredCompareOptions.length > 0 && (
                    <div className="operator-profile__compare-dropdown" role="listbox">
                      {filteredCompareOptions.map((option) => (
                        <button
                          type="button"
                          key={option.value}
                          className="operator-profile__compare-option"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            handleCompareOptionSelect(option);
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {compareSelection && (
                  <button
                    type="button"
                    className="operator-profile__compare-clear"
                    onClick={handleClearComparison}
                  >
                    clear comparison
                  </button>
                )}
              </div>
            </div>
            {comparisonEnabled && (
              <div className="operator-profile__compare-summary">
                <span className="operator-profile__compare-name operator-profile__compare-name--primary">
                  {displayName}
                </span>
                <span className="operator-profile__compare-delimiter">vs</span>
                <span className="operator-profile__compare-name operator-profile__compare-name--secondary">
                  {comparisonLabel}
                </span>
              </div>
            )}
            <div className="operator-profile__radar-shell">
              <div className="operator-profile__radar-canvas">
                <div className="operator-profile__radar-plot" ref={radarPlotRef} />
                {!activeRadarData.hasData && (
                  <div className="operator-profile__radar-placeholder">
                    insufficient telemetry :: {activeRadar.label}
                  </div>
                )}
              </div>
              <ul className="operator-profile__radar-legend">
                {primaryRadarEntries.map((entry) => {
                  const comparisonEntry = comparisonEntriesMap.get(entry.key);
                  const { primary: primaryClass, comparison: comparisonClass } = resolveValueClasses(
                    entry.numeric,
                    comparisonEntry?.numeric ?? null,
                  );
                  return (
                    <li key={entry.key} className="operator-profile__radar-entry">
                      <span className="operator-profile__radar-entry-label">{entry.label}</span>
                      <div className="operator-profile__radar-entry-values">
                        <div className="operator-profile__radar-value-group">
                          <div className="operator-profile__radar-value-caption">{displayName}</div>
                          <span className={`operator-profile__radar-value ${primaryClass}`}>{entry.display}</span>
                        </div>
                        {comparisonEnabled && (
                          <div className="operator-profile__radar-value-group">
                            <div className="operator-profile__radar-value-caption">{comparisonLabel}</div>
                            <span
                              className={`operator-profile__radar-value operator-profile__radar-value--secondary ${comparisonClass}`}
                            >
                              {comparisonEntry?.display ?? '—'}
                            </span>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        </div>
      </div>
    );
  };

  return (
    <div className="operator-layout">
      <div className="operator-panel operator-panel--entry">
        <div className="operator-header">
          <div className="operator-header-stack">
            <div className="operator-subtitle">records uplink</div>
            <div className="operator-title">operator entry</div>
          </div>
          <div className="operator-actions">
            <button type="button" className="dashboard-button" onClick={onBack}>
              return to table
            </button>
          </div>
        </div>
        <div className="operator-status-line">
          <span className="status-indicator" data-state={status.state} />
          {datasetStatusLabel}
        </div>
        <div className="operator-entry-shell">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default OperatorEntry;
