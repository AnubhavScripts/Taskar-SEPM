/**
 * Ripple Effect Simulation Service
 * Handles tasks stored with `taskId` field (from MongoDB).
 */
const { analyzeTasks } = require('./graphService');

function simulateRipple(tasks, delays) {
  if (!tasks || tasks.length === 0) throw new Error('No tasks to simulate.');
  if (!delays || delays.length === 0) throw new Error('No delays specified.');

  // Normalize: convert Mongoose docs to plain objects, map taskId → id for graphService
  const normalizedTasks = tasks.map(t => {
    const plain = t.toObject ? t.toObject() : { ...t };
    return {
      id: plain.taskId ?? plain.id,
      taskId: plain.taskId ?? plain.id,
      name: plain.name,
      duration: plain.duration,
      dependencies: plain.dependencies ? [...plain.dependencies] : [],
      startDay: plain.startDay || 0,
      endDay: plain.endDay || 0,
      delayAdded: 0,
      riskLevel: plain.riskLevel || 'low',
      isCriticalPath: plain.isCriticalPath || false,
    };
  });

  // Build successor map: id → [ids of tasks that depend on this]
  const successors = {};
  for (const task of normalizedTasks) {
    successors[task.id] = successors[task.id] || [];
    for (const depId of task.dependencies) {
      successors[depId] = successors[depId] || [];
    }
  }
  for (const task of normalizedTasks) {
    for (const depId of task.dependencies) {
      if (!successors[depId].includes(task.id)) {
        successors[depId].push(task.id);
      }
    }
  }

  const affectedTaskIds = new Set();

  // Apply delays + BFS propagation
  for (const { taskId, delayDays } of delays) {
    if (!delayDays || delayDays <= 0) continue;
    const delay = Math.round(Number(delayDays));
    const target = normalizedTasks.find(t => t.id === Number(taskId));
    if (!target) continue;

    target.duration += delay;
    target.delayAdded += delay;
    affectedTaskIds.add(target.id);

    // BFS ripple
    const visited = new Set([target.id]);
    const queue = [...(successors[target.id] || [])];
    while (queue.length > 0) {
      const currId = queue.shift();
      if (visited.has(currId)) continue;
      visited.add(currId);
      affectedTaskIds.add(currId);
      for (const nextId of (successors[currId] || [])) {
        if (!visited.has(nextId)) queue.push(nextId);
      }
    }
  }

  // Re-analyze with updated durations
  const result = analyzeTasks(normalizedTasks);

  // Build delta report
  const deltaReport = result.tasks.map(simTask => {
    const orig = normalizedTasks.find(t => t.id === simTask.id);
    const origEndDay = orig ? (orig.endDay - orig.delayAdded) : 0;
    // Find original endDay from the input tasks (before mutation)
    const originalTask = tasks.find(t => (t.taskId ?? t.id) === simTask.id);
    return {
      id: simTask.id,
      name: simTask.name,
      originalEnd: originalTask?.endDay ?? origEndDay,
      newEnd: simTask.endDay,
      daysPushed: simTask.endDay - (originalTask?.endDay ?? origEndDay),
      isAffected: affectedTaskIds.has(simTask.id),
      delayAdded: orig?.delayAdded || 0,
      riskLevel: simTask.riskLevel,
      isCriticalPath: simTask.isCriticalPath,
    };
  });

  // Re-map result tasks back to taskId format
  const outputTasks = result.tasks.map(t => ({
    ...t,
    taskId: t.id,
  }));

  return {
    tasks: outputTasks,
    simulatedDuration: result.totalDuration,
    affectedTasks: [...affectedTaskIds],
    criticalPath: result.criticalPath,
    bottlenecks: result.bottlenecks,
    deltaReport,
  };
}

module.exports = { simulateRipple };
