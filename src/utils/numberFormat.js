const NUMERIC_PATTERN = /^[+-]?\d+(?:\.\d+)?$/;

export const isPlainNumericString = (value) => {
  if (typeof value !== 'string') {
    return false;
  }

  const sanitized = value.replace(/,/g, '').trim();
  if (sanitized === '') {
    return false;
  }

  return NUMERIC_PATTERN.test(sanitized);
};

export const parseMaybeNumber = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') {
      return null;
    }
    const parsed = Number(trimmed);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return null;
};

export const parseStatValue = (value) => {
  const numeric = parseMaybeNumber(value);
  if (numeric !== null) {
    return numeric;
  }
  if (typeof value === 'string') {
    const match = value.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
    if (match) {
      const parsed = Number.parseFloat(match[0]);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
  }
  return null;
};

const roundToHundredth = (value) => {
  if (!Number.isFinite(value)) {
    return value;
  }
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

export const formatRoundedNumber = (value, { useGrouping = false } = {}) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  const rounded = roundToHundredth(value);
  const hasFraction = Math.abs(rounded % 1) > Number.EPSILON;

  return rounded.toLocaleString(undefined, {
    useGrouping,
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: hasFraction ? 2 : 0,
  });
};

export const formatRoundedValue = (rawValue, { useGrouping = false } = {}) => {
  if (rawValue === null || rawValue === undefined || rawValue === '') {
    return rawValue;
  }

  if (typeof rawValue === 'number') {
    return formatRoundedNumber(rawValue, { useGrouping }) ?? rawValue;
  }

  if (typeof rawValue === 'string') {
    const sanitized = rawValue.replace(/,/g, '').trim();
    if (sanitized === '') {
      return rawValue;
    }
    if (NUMERIC_PATTERN.test(sanitized)) {
      const numeric = Number(sanitized);
      if (!Number.isNaN(numeric)) {
        return formatRoundedNumber(numeric, {
          useGrouping: rawValue.includes(',') || useGrouping,
        }) ?? rawValue;
      }
    }
  }

  return rawValue;
};
