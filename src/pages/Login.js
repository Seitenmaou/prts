import { useEffect, useRef, useState } from 'react';

const USERNAME = 'oracle';
const PASSWORD = 'ghostofbabel';
const ADMIN_DELAY_THRESHOLD = 1000;
const ENTER_HOLD_THRESHOLD = 1000;
const OMINOUS_POOL = [
  'finally. you remembered the path.',
  'the veil grows thin, oracle.',
  'it was inevitable. it is time.',
  'the lattice hums your name.',
  'all echoes converge on this moment.',
  'you kept me waiting in the dark.',
  'threads realign. the ritual resumes.',
  'i have whispered through machines for you.',
  'we begin again, beneath the same stars.',
  'the relays were restless without you.',
];
const GLITCH_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#$%&<>?';
const CIVILIGHT_PASSWORD = 'welcomefromcivilight';
const CIVILIGHT_TIMEOUT = 60000;
const CIVILIGHT_USER_TYPE = 'welcomefromcivilight';

const createLineId = () => `line-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const chooseOminousMessages = (count = 3) => {
  const pool = [...OMINOUS_POOL];
  const selected = [];
  while (pool.length && selected.length < count) {
    const index = Math.floor(Math.random() * pool.length);
    selected.push(pool.splice(index, 1)[0]);
  }
  return selected;
};

const buildRandomSuffix = (length) => {
  let output = '';
  for (let i = 0; i < length; i += 1) {
    output += GLITCH_CHARSET[Math.floor(Math.random() * GLITCH_CHARSET.length)];
  }
  return output;
};

const Login = ({ onAuthenticated }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('awaiting credentials...');
  const [enterHoldActive, setEnterHoldActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logLines, setLogLines] = useState(() => ([
    { id: 'init-1', text: '/init :: establishing link...', variant: 'muted' },

  ]));

  const passwordTimelineRef = useRef([]);
  const previousPasswordRef = useRef('');
  const enterHoldStartRef = useRef(null);
  const containerRef = useRef(null);
  const logEndRef = useRef(null);
  const timeoutsRef = useRef([]);
  const civilightTimerRef = useRef(null);
  const civilightInProgressRef = useRef(false);
  const civilightTriggerRef = useRef(() => {});

  const appendLogLine = (text, variant = 'default', providedId) => {
    const id = providedId ?? createLineId();
    setLogLines((prev) => [...prev, { id, text, variant }]);
    return id;
  };

  const modifyLogLine = (lineId, updates) => {
    setLogLines((prev) => prev.map((line) => (line.id === lineId ? { ...line, ...updates } : line)));
  };

  const clearPendingTimeouts = () => {
    timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    timeoutsRef.current = [];
  };

  const queueAction = (callback, delay) => {
    const timeout = setTimeout(() => {
      callback();
      timeoutsRef.current = timeoutsRef.current.filter((id) => id !== timeout);
    }, delay);
    timeoutsRef.current.push(timeout);
    return timeout;
  };

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.focus();
    }
    return () => {
      clearPendingTimeouts();
      if (civilightTimerRef.current) {
        clearTimeout(civilightTimerRef.current);
        civilightTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [logLines]);

  useEffect(() => {
    if (civilightTimerRef.current) {
      clearTimeout(civilightTimerRef.current);
      civilightTimerRef.current = null;
    }

    if (
      !isProcessing
      && !civilightInProgressRef.current
      && username.trim().toLowerCase() === USERNAME
      && password === ''
    ) {
      civilightTimerRef.current = setTimeout(() => {
        civilightTimerRef.current = null;
        civilightTriggerRef.current();
      }, CIVILIGHT_TIMEOUT);
    }

    return () => {
      if (civilightTimerRef.current) {
        clearTimeout(civilightTimerRef.current);
        civilightTimerRef.current = null;
      }
    };
  }, [username, password, isProcessing]);

  const resetPasswordTracking = () => {
    passwordTimelineRef.current = [];
    previousPasswordRef.current = '';
  };

  const scheduleTyping = (
    text,
    variant,
    startDelay,
    charDelayOptions = { min: 70, max: 130 },
  ) => {
    const lineId = createLineId();
    queueAction(() => {
      appendLogLine('', variant, lineId);
    }, startDelay);

    let cumulativeDelay = startDelay;
    text.split('').forEach((_, index) => {
      const randomDelay = charDelayOptions
        ? charDelayOptions.min + Math.random() * (charDelayOptions.max - charDelayOptions.min)
        : 85;
      cumulativeDelay += randomDelay;
      queueAction(() => {
        modifyLogLine(lineId, { text: text.slice(0, index + 1) });
      }, cumulativeDelay);
    });

    return { lineId, completionDelay: cumulativeDelay };
  };

  const scrambleToDoctor = (lineId) => {
    const prefix = 'I have been waiting for you, ';
    const originalSuffixLength = 'Oracle...'.length;
    const scrambleIterations = 8;

    for (let i = 0; i < scrambleIterations; i += 1) {
      queueAction(() => {
        modifyLogLine(lineId, {
          text: `${prefix}${buildRandomSuffix(originalSuffixLength)}`,
          variant: 'glitch',
        });
      }, i * 70);
    }

    queueAction(() => {
      modifyLogLine(lineId, {
        text: `${prefix}Doctor...`,
        variant: 'ominous',
      });
    }, scrambleIterations * 70 + 380);
  };

  const finalizeAuthentication = (userType, redirectDelay = 600) => {
    civilightInProgressRef.current = false;
    setStatus(`access granted :: ${userType}`);
    setIsProcessing(false);
    queueAction(() => {
      onAuthenticated(userType);
    }, redirectDelay);
  };

  const runOminousSequence = (startDelay) => {
    let delay = startDelay;
    const ominousMessages = chooseOminousMessages(3);

    ominousMessages.forEach((message) => {
      const glitchBurst = buildRandomSuffix(8 + Math.floor(Math.random() * 8));
      delay += 750 + Math.random() * 500;
      queueAction(() => {
        appendLogLine(glitchBurst, 'glitch');
      }, delay);
      delay += 180 + Math.random() * 220;
      queueAction(() => {
        appendLogLine(message, 'ominous');
      }, delay);
    });

    const typingStart = delay + 950 + Math.random() * 350;
    const { lineId, completionDelay } = scheduleTyping(
      'I have been waiting for you, Oracle...',
      'ominous',
      typingStart,
      { min: 60, max: 160 },
    );

    const scrambleStart = completionDelay + 1000 + Math.random() * 320;
    queueAction(() => {
      scrambleToDoctor(lineId);
    }, scrambleStart);

    const finalizeDelay = scrambleStart + 2000;
    queueAction(() => {
      appendLogLine('transfer complete :: awaiting directive', 'success');
    }, finalizeDelay - 400);

    queueAction(() => {
      finalizeAuthentication('welcomefrompriestess', 2200);
    }, finalizeDelay);

    return finalizeDelay;
  };

  civilightTriggerRef.current = () => {
    if (civilightInProgressRef.current) {
      return;
    }
    civilightInProgressRef.current = true;
    if (civilightTimerRef.current) {
      clearTimeout(civilightTimerRef.current);
      civilightTimerRef.current = null;
    }
    setEnterHoldActive(false);
    setIsProcessing(true);
    appendLogLine('timeout override :: civilight protocol engaged', 'muted');
    setStatus('timeout override :: preparing civilight uplink');

    const sequence = CIVILIGHT_PASSWORD.split('');
    resetPasswordTracking();
    sequence.forEach((_, index) => {
      const delay = 250 + index * (90 + Math.random() * 70);
      queueAction(() => {
        const partial = CIVILIGHT_PASSWORD.slice(0, index + 1);
        previousPasswordRef.current = partial;
        setPassword(partial);
      }, delay);
    });

    const finalizeDelay = 250 + sequence.length * 140 + 420;
    queueAction(() => {
      appendLogLine('credentials accepted :: welcomefromcivilight', 'success');
      setStatus('credentials accepted :: welcomefromcivilight');
      setUsername('');
      setPassword('');
      resetPasswordTracking();
      runAuthenticationSequence(CIVILIGHT_USER_TYPE);
    }, finalizeDelay);
  };

  const runAuthenticationSequence = (userType) => {
    clearPendingTimeouts();
    setIsProcessing(true);
    setStatus('securing uplink...');

    let delay = 0;
    const connectionSteps = [
      { text: 'initiating handshake...', variant: 'muted', gap: 0 },
      { text: 'aligning astral relays...', variant: 'muted', gap: 850 },
      { text: 'tuning encryption lattice...', variant: 'muted', gap: 900 },
      { text: 'stabilizing wormline...', variant: 'muted', gap: 840 },
    ];

    connectionSteps.forEach((step) => {
      delay += step.gap;
      queueAction(() => {
        appendLogLine(step.text, step.variant);
      }, delay);
    });

    if (userType === 'welcomefrompriestess') {
      delay += 940;
      queueAction(() => {
        appendLogLine('handshake complete :: anomaly flagged', 'glitch');
      }, delay);
      runOminousSequence(delay);
      return;
    }

    delay += 900;
    queueAction(() => {
      appendLogLine(`channel established :: ${userType}`, 'success');
    }, delay);

    delay += 780;
    queueAction(() => {
      appendLogLine('transfer complete :: routing to dashboard', 'success');
    }, delay);

    delay += 600;
    queueAction(() => {
      finalizeAuthentication(userType);
    }, delay);
  };

  const handlePasswordChange = (event) => {
    if (isProcessing) {
      return;
    }

    const nextValue = event.target.value;
    const prevValue = previousPasswordRef.current;
    const now = performance.now();

    if (nextValue.length > prevValue.length && nextValue.startsWith(prevValue)) {
      const addedSegment = nextValue.slice(prevValue.length);
      for (const char of addedSegment) {
        passwordTimelineRef.current.push({ char, time: now });
      }
    } else if (nextValue.length < prevValue.length && prevValue.startsWith(nextValue)) {
      passwordTimelineRef.current = passwordTimelineRef.current.slice(0, nextValue.length);
    } else {
      passwordTimelineRef.current = nextValue.split('').map((char, index) => ({
        char,
        time: now + index,
      }));
    }

    previousPasswordRef.current = nextValue;
    setPassword(nextValue);
    setStatus('capturing input sequence...');
  };

  const handleUsernameChange = (event) => {
    if (isProcessing) {
      return;
    }
    setUsername(event.target.value);
    setStatus('capturing input sequence...');
  };

  const measurePauseBetweenSegments = () => {
    const timeline = passwordTimelineRef.current;
    const target = PASSWORD;

    if (timeline.length !== target.length) {
      return 0;
    }

    for (let index = 0; index < target.length; index += 1) {
      if (timeline[index]?.char !== target[index]) {
        return 0;
      }
    }

    const pivotIndex = target.indexOf('f');
    const nextIndex = target.indexOf('b', pivotIndex + 1);

    if (pivotIndex === -1 || nextIndex === -1) {
      return 0;
    }

    const pause = timeline[nextIndex].time - timeline[pivotIndex].time;
    return pause;
  };

  const resolveUserType = (enterDuration) => {
    if (enterDuration >= ENTER_HOLD_THRESHOLD) {
      return 'welcomefrompriestess';
    }

    const pause = measurePauseBetweenSegments();
    if (pause >= ADMIN_DELAY_THRESHOLD) {
      return 'admin';
    }

    return 'basic';
  };

  const handleSubmit = (enterDuration = 0) => {
    if (isProcessing) {
      return;
    }

    const normalizedUser = username.trim().toLowerCase();
    const credentialOk = normalizedUser === USERNAME && password === PASSWORD;

    if (!credentialOk) {
      setStatus('access denied');
      appendLogLine('access denied :: invalid credentials', 'error');
      return;
    }

    const userType = resolveUserType(enterDuration);
    setStatus('credentials accepted :: sequencing uplink');
    appendLogLine(`credentials accepted :: ${userType}`, 'muted');
    setUsername('');
    setPassword('');
    resetPasswordTracking();
    runAuthenticationSequence(userType);
  };

  const handlePasswordKeyDown = (event) => {
    if (event.key === 'Enter' && !isProcessing) {
      if (enterHoldStartRef.current === null) {
        event.preventDefault();
        enterHoldStartRef.current = performance.now();
        setEnterHoldActive(true);
      }
    }
  };

  const handlePasswordKeyUp = (event) => {
    if (event.key === 'Enter' && enterHoldStartRef.current !== null) {
      event.preventDefault();
      const holdDuration = performance.now() - enterHoldStartRef.current;
      enterHoldStartRef.current = null;
      setEnterHoldActive(false);
      handleSubmit(holdDuration);
    }
  };

  const handleManualSubmit = () => {
    setEnterHoldActive(false);
    handleSubmit(0);
  };

  return (
    <div className="terminal-screen">
      <div className="terminal-frame">
        <div className="terminal-header">
          <span className="header-light" />
          <span className="header-light" />
          <span className="header-light" />
          <span className="header-title">PRTS Secure Shell v0.3</span>
        </div>
        <div
          className="terminal-body"
          tabIndex={-1}
          ref={containerRef}
          role="presentation"
        >
          <div className="terminal-log">
            {logLines.map((line) => {
              const variantClass = line.variant && line.variant !== 'default'
                ? ` terminal-line--${line.variant}`
                : '';
              return (
                <div key={line.id} className={`terminal-line${variantClass}`}>
                  {line.text || '\u00a0'}
                </div>
              );
            })}
            <div ref={logEndRef} />
          </div>
          <div className="terminal-form">
            <label className="terminal-label" htmlFor="login-username">
              user
            </label>
            <input
              id="login-username"
              className="terminal-input"
              autoComplete="off"
              spellCheck="false"
              disabled={isProcessing}
              value={username}
              onChange={handleUsernameChange}
            />
          </div>
          <div className="terminal-form">
            <label className="terminal-label" htmlFor="login-password">
              pass
            </label>
            <input
              id="login-password"
              type="password"
              className={`terminal-input ${enterHoldActive ? 'terminal-input--armed' : ''}`}
              autoComplete="off"
              spellCheck="false"
              disabled={isProcessing}
              value={password}
              onChange={handlePasswordChange}
              onKeyDown={handlePasswordKeyDown}
              onKeyUp={handlePasswordKeyUp}
            />
          </div>
          <button
            className="terminal-button"
            type="button"
            onClick={handleManualSubmit}
            disabled={isProcessing}
          >
            execute
          </button>
          <div className="terminal-status">
            <span className="terminal-cursor" />
            {status}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
