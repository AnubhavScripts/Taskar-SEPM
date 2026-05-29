/**
 * NLP Extraction Module — Enhanced for natural/student-style inputs
 */

// ─── Duration Parsing ──────────────────────────────────────────────────────────

const DURATION_PATTERNS = [
  // "in 3 days", "within 5 days", "by 2 days"
  { regex: /\bin\s+(\d+(?:\.\d+)?)\s*(?:business\s+)?days?/i, multiplier: 1 },
  // "5 days", "3 business days"
  { regex: /(\d+(?:\.\d+)?)\s*(?:business\s+)?days?/i, multiplier: 1 },
  // "2 weeks"
  { regex: /(\d+(?:\.\d+)?)\s*weeks?/i, multiplier: 7 },
  // "1 month"
  { regex: /(\d+(?:\.\d+)?)\s*months?/i, multiplier: 30 },
  // "3 hours" → round to 1 day minimum
  { regex: /(\d+(?:\.\d+)?)\s*hours?/i, multiplier: 1 / 8 },
  // "a day", "a week"
  { regex: /\ba\s+(day|week|month)\b/i, multiplier: null },
  // "daily" / "every day" → treat as 1-day recurring task
  { regex: /\b(daily|every\s+day|each\s+day)\b/i, multiplier: null, fixed: 1 },
  // "weekly" → 7 days
  { regex: /\b(weekly|every\s+week)\b/i, multiplier: null, fixed: 7 },
];

function parseDuration(text) {
  for (const p of DURATION_PATTERNS) {
    const match = text.match(p.regex);
    if (match) {
      if (p.fixed !== undefined) return p.fixed;
      if (p.multiplier === null) {
        const unit = (match[1] || '').toLowerCase();
        if (unit === 'day') return 1;
        if (unit === 'week') return 7;
        if (unit === 'month') return 30;
      }
      const val = parseFloat(match[1]) * p.multiplier;
      return Math.max(1, Math.round(val));
    }
  }
  return null;
}

// ─── Task Name Extraction ──────────────────────────────────────────────────────

const DEPENDENCY_SIGNALS = [
  'depends on', 'after', 'once', 'when', 'following', 'subsequent to',
  'upon completion of', 'after completing', 'after finishing',
];

const TASK_INTRO_VERBS = [
  'complete', 'finish', 'build', 'develop', 'design', 'test', 'deploy',
  'review', 'write', 'create', 'implement', 'set up', 'configure', 'integrate',
  'launch', 'release', 'prepare', 'conduct', 'perform', 'execute', 'plan',
  'study', 'learn', 'do', 'submit', 'work on', 'prepare for', 'practice',
  'research', 'read', 'code', 'debug', 'fix', 'update', 'refactor',
];

const DOMAIN_TERMS = [
  // Tech
  'frontend', 'backend', 'database', 'db', 'api', 'ui', 'ux', 'design',
  'testing', 'qa', 'deployment', 'devops', 'infrastructure', 'auth',
  'authentication', 'authorization', 'payment', 'integration', 'migration',
  'documentation', 'docs', 'code review', 'sprint', 'planning',
  'analytics', 'reporting', 'notification', 'server', 'client', 'pipeline',
  'ci/cd', 'monitoring', 'logging', 'security', 'performance', 'optimization',
  // Student
  'dsa', 'data structures', 'algorithms', 'assignment', 'project', 'exam',
  'quiz', 'homework', 'lab', 'submission', 'presentation', 'thesis', 'report',
  'revision', 'practice', 'leetcode', 'coding', 'interview', 'internship',
  'module', 'chapter', 'lecture', 'tutorial', 'workshop',
];

// Patterns that introduce a task: "have to X", "need to X", "must X"
// Stop before: "in X days", "daily", "weekly" — but NOT "for" (to allow "study for exams")
const OBLIGATION_PATTERN = /(?:have to|need to|must|should|going to|want to|plan to)\s+([a-z][\w\s]{2,35}?)(?:\s+(?:in|by|within|daily|weekly|every)|\s*[,\.;]|$)/i;

function extractTaskNameFromSentence(sentence) {
  let s = sentence.trim();

  // Try obligation pattern first: "I have to study DSA daily"
  const oblMatch = s.match(OBLIGATION_PATTERN);
  if (oblMatch) {
    let candidate = oblMatch[1].trim();
    // Only remove trailing duration ("in 3 days", "by friday", etc.) — NOT mid-phrase articles
    candidate = candidate
      .replace(/\s+(?:in|within|by)\s+\d+\s*\w+\s*$/i, '')  // remove "in 3 days" at end
      .replace(/\s+(daily|weekly|every\s+\w+)$/i, '')          // remove "daily/weekly" at end
      .replace(/^(?:an?\s+|the\s+)/i, '')                      // remove leading article only
      .trim()
    if (candidate.length >= 2) {
      // Capitalize each word for cleanliness
      return candidate.split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ')
    }
  }

  // Strip duration phrases
  for (const { regex } of DURATION_PATTERNS) {
    s = s.replace(new RegExp(regex.source, 'gi'), '');
  }

  // Strip dependency signals
  for (const signal of DEPENDENCY_SIGNALS) {
    s = s.replace(new RegExp(`\\b${signal}\\b[^,\\.]*`, 'gi'), '');
  }

  // Strip common phrases
  s = s.replace(/\b(should be done|needs to be done|will take|takes?|estimated at|estimated to take|planned for|scheduled for|have to|need to|must|going to|want to|plan to|i will|i have to|i need to|i must)\b/gi, '');
  s = s.replace(/\b(the|a|an|is|are|will|be|been|have|has|it|this|that|these|those|and|or|but|so|then|also|already|just|i|we|they|he|she|daily|weekly)\b/gi, ' ');
  s = s.replace(/[,\.;:!?]/g, ' ').replace(/\s+/g, ' ').trim();

  if (s.length < 2) return null;

  // Check domain terms (highest confidence)
  const lower = s.toLowerCase();
  for (const term of DOMAIN_TERMS) {
    if (lower.includes(term)) {
      const idx = lower.indexOf(term);
      const before = s.slice(0, idx).trim().split(' ').slice(-1).join(' ');
      const after = s.slice(idx + term.length).trim().split(' ').slice(0, 1).join(' ');
      let name = [before, term, after].filter(Boolean).join(' ').trim();
      name = name.charAt(0).toUpperCase() + name.slice(1);
      if (name.length >= 2) return name;
    }
  }

  // Fallback: first 3 meaningful words
  const words = s.split(' ').filter(w => w.length > 1);
  if (words.length === 0) return null;
  const name = words.slice(0, 3).join(' ');
  return name.charAt(0).toUpperCase() + name.slice(1);
}

// ─── Dependency Inference ──────────────────────────────────────────────────────

function inferDependencies(tasks, rawText) {
  const text = rawText.toLowerCase();

  const depPatterns = [
    /(\w[\w\s]*?)\s+depends\s+on\s+([\w\s,and]+?)(?:[,\.;]|$)/gi,
    /(\w[\w\s]*?)\s+after\s+([\w\s,and]+?)(?:\s+(?:is|are)\s+(?:done|complete|finished))?(?:[,\.;]|$)/gi,
    /(\w[\w\s]*?)\s+once\s+([\w\s,and]+?)\s+(?:is|are)?\s*(?:done|complete|finished)(?:[,\.;]|$)/gi,
    /(\w[\w\s]*?)\s+following\s+([\w\s,and]+?)(?:[,\.;]|$)/gi,
  ];

  const nameToId = {};
  tasks.forEach(t => {
    nameToId[t.name.toLowerCase()] = t.id;
    const firstWord = t.name.toLowerCase().split(' ')[0];
    if (!nameToId[firstWord]) nameToId[firstWord] = t.id;
  });

  tasks.forEach(task => {
    const tFirst = task.name.toLowerCase().split(' ')[0];
    for (const pattern of depPatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const g1 = match[1]?.toLowerCase().trim() || '';
        const g2 = match[2]?.toLowerCase().trim() || '';
        if (g1.includes(tFirst) || tFirst.includes(g1.split(' ')[0])) {
          const deps = g2.split(/\s*(?:,|and)\s*/);
          deps.forEach(dep => {
            dep = dep.trim();
            for (const [n, id] of Object.entries(nameToId)) {
              if (dep.includes(n.split(' ')[0]) || n.includes(dep.split(' ')[0])) {
                if (id !== task.id && !task.dependencies.includes(id)) {
                  task.dependencies.push(id);
                }
              }
            }
          });
        }
      }
    }
  });

  return tasks;
}

// ─── Main Extraction Function ──────────────────────────────────────────────────

function extractTasks(rawText) {
  if (!rawText || rawText.trim().length < 5) {
    throw new Error('Input text is too short to extract tasks.');
  }

  // Split by sentence-ending punctuation, newlines, commas+obligation, or "and i have/need/must"
  const raw = rawText
    .replace(/\band\s+i\s+(have\s+to|need\s+to|must|will)\b/gi, '. I $1') // "and i have to" → new sentence
    .replace(/\band\s+i\s+/gi, '. I ')  // "and i " → new sentence
  const sentences = raw
    .split(/(?<=[.!?;])\s+|(?<=\n)|,\s*(?=[A-Z]|i\s+have|i\s+need|i\s+must|i\s+will)/i)
    .map(s => s.trim())
    .filter(s => s.length > 3);

  const extracted = [];
  let idCounter = 1;

  for (const sentence of sentences) {
    const duration = parseDuration(sentence);
    // Allow sentences without explicit duration only if they match obligation pattern
    const hasObligation = OBLIGATION_PATTERN.test(sentence);
    if (!duration && !hasObligation) continue;

    const name = extractTaskNameFromSentence(sentence);
    if (!name || name.length < 2) continue;

    // Dedup: only skip if full name matches or first two words match (allows "Study DSA" + "Study Exams")
    const nameWords = name.toLowerCase().split(' ')
    const alreadyExists = extracted.some(t => {
      const tWords = t.name.toLowerCase().split(' ')
      if (t.name.toLowerCase() === name.toLowerCase()) return true
      // Only dedup if first 2 words match (e.g. same verb + same noun)
      return nameWords[0] === tWords[0] && nameWords[1] && tWords[1] && nameWords[1] === tWords[1]
    })
    if (alreadyExists) continue;

    extracted.push({
      id: idCounter++,
      name,
      duration: duration || 1, // default 1 day for daily/obligation tasks
      dependencies: [],
    });
  }

  // Fallback: try comma-split aggressive parse
  if (extracted.length === 0) {
    return aggressiveParse(rawText);
  }

  // For tasks with no duration (daily obligation tasks), give them a sensible default
  extracted.forEach(t => { if (!t.duration) t.duration = 1; });

  const tasksWithDeps = inferDependencies(extracted, rawText);
  return { tasks: tasksWithDeps };
}

function aggressiveParse(rawText) {
  // Split on commas, semicolons, newlines, or "I have to / I need to"
  const lines = rawText
    .split(/[,;\n]|(?=i\s+have\s+to|i\s+need\s+to|i\s+must)/i)
    .map(s => s.trim())
    .filter(s => s.length > 2);

  const tasks = [];
  let id = 1;

  for (const line of lines) {
    const duration = parseDuration(line) || 3;
    const name = extractTaskNameFromSentence(line) || line.slice(0, 30).trim();
    if (!name || name.length < 2) continue;

    const nameWords2 = name.toLowerCase().split(' ')
    const alreadyExists2 = tasks.some(t => {
      const tWords = t.name.toLowerCase().split(' ')
      if (t.name.toLowerCase() === name.toLowerCase()) return true
      return nameWords2[0] === tWords[0] && nameWords2[1] && tWords[1] && nameWords2[1] === tWords[1]
    })
    if (alreadyExists2) continue

    tasks.push({ id: id++, name, duration, dependencies: [] });
  }

  const tasksWithDeps = inferDependencies(tasks, rawText);
  return { tasks: tasksWithDeps };
}

module.exports = { extractTasks, parseDuration };
