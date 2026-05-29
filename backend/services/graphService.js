/**
 * Graph Service
 * Builds a directed acyclic graph (DAG) from task list.
 * Computes:
 *  - Topological order (Kahn's algorithm)
 *  - Earliest Start / Finish times (forward pass)
 *  - Critical Path (backward pass)
 *  - Bottleneck detection
 */

/**
 * Build adjacency list from tasks array.
 * tasks: [{ id, name, duration, dependencies: [id, ...] }]
 */
function buildGraph(tasks) {
  const nodes = {};    // id → { id, name, duration, dependencies }
  const adj = {};      // id → [ids that depend on this id]  (forward edges)
  const inDegree = {}; // id → count of incoming edges

  for (const task of tasks) {
    nodes[task.id] = { ...task };
    adj[task.id] = adj[task.id] || [];
    inDegree[task.id] = inDegree[task.id] || 0;
  }

  for (const task of tasks) {
    for (const depId of task.dependencies) {
      adj[depId] = adj[depId] || [];
      adj[depId].push(task.id);
      inDegree[task.id] = (inDegree[task.id] || 0) + 1;
    }
  }

  return { nodes, adj, inDegree };
}

/**
 * Topological sort using Kahn's BFS algorithm.
 * Returns sorted task ids or throws if cycle detected.
 */
function topologicalSort(nodes, adj, inDegree) {
  const queue = [];
  const inDeg = { ...inDegree };

  // Start with nodes having no dependencies
  for (const id of Object.keys(nodes)) {
    if (inDeg[id] === 0) queue.push(Number(id));
  }

  const order = [];
  while (queue.length > 0) {
    const curr = queue.shift();
    order.push(curr);
    for (const next of (adj[curr] || [])) {
      inDeg[next]--;
      if (inDeg[next] === 0) queue.push(next);
    }
  }

  if (order.length !== Object.keys(nodes).length) {
    console.warn('Circular dependency detected in tasks. Analysis may be inaccurate.');
    // Fallback: append missing nodes to ensure the rest of the pipeline doesn't crash
    const inOrder = new Set(order);
    for (const id of Object.keys(nodes)) {
      if (!inOrder.has(Number(id))) order.push(Number(id));
    }
  }

  return order;
}

/**
 * Forward pass: compute Earliest Start (ES) and Earliest Finish (EF) for each task.
 * Returns map: id → { es, ef }
 */
function forwardPass(topoOrder, nodes, adj) {
  const timing = {};

  for (const id of topoOrder) {
    timing[id] = { es: 0, ef: 0 };
  }

  for (const id of topoOrder) {
    const task = nodes[id];
    // ES = max EF of all predecessors
    let maxPredEF = 0;
    for (const predId of task.dependencies) {
      if (timing[predId]) {
        maxPredEF = Math.max(maxPredEF, timing[predId].ef);
      }
    }
    timing[id].es = maxPredEF;
    timing[id].ef = maxPredEF + task.duration;
  }

  return timing;
}

/**
 * Backward pass: compute Latest Start (LS) and Latest Finish (LF) for each task.
 * Returns map: id → { ls, lf }
 */
function backwardPass(topoOrder, nodes, adj, timing, projectEnd) {
  const late = {};

  for (const id of topoOrder) {
    late[id] = { ls: 0, lf: 0 };
  }

  // Reverse topological order
  const reversed = [...topoOrder].reverse();

  for (const id of reversed) {
    const successors = adj[id] || [];
    if (successors.length === 0) {
      // End tasks: LF = project end
      late[id].lf = projectEnd;
    } else {
      // LF = min LS of successors
      late[id].lf = Math.min(...successors.map(s => late[s].ls));
    }
    late[id].ls = late[id].lf - nodes[id].duration;
  }

  return late;
}

/**
 * Identify critical path tasks (slack = 0).
 * slack = LS - ES
 */
function findCriticalPath(topoOrder, timing, late) {
  const criticalPath = [];
  for (const id of topoOrder) {
    const slack = late[id].ls - timing[id].es;
    if (Math.abs(slack) < 0.001) {
      criticalPath.push(id);
    }
  }
  return criticalPath;
}

/**
 * Find bottlenecks: tasks with the most dependents (outgoing edges).
 * Returns top 2 bottleneck task ids.
 */
function findBottlenecks(adj, criticalPath) {
  const scored = Object.entries(adj).map(([id, successors]) => ({
    id: Number(id),
    score: successors.length + (criticalPath.includes(Number(id)) ? 2 : 0),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.filter(s => s.score > 0).slice(0, 2).map(s => s.id);
}

/**
 * Compute risk level for each task.
 * Heuristic:
 *   - high: on critical path + many dependents
 *   - medium: on critical path OR many dependents
 *   - low: otherwise
 */
function computeRisk(tasks, criticalPath, adj) {
  return tasks.map(task => {
    const isCP = criticalPath.includes(task.id);
    const deps = (adj[task.id] || []).length;
    let riskLevel = 'low';
    if (isCP && deps >= 2) riskLevel = 'high';
    else if (isCP || deps >= 2) riskLevel = 'medium';
    return { ...task, riskLevel, isCriticalPath: isCP };
  });
}

/**
 * Main entry point: analyze(tasks)
 * Returns enriched tasks + schedule metadata.
 */
function analyzeTasks(tasks) {
  if (!tasks || tasks.length === 0) {
    return { tasks: [], totalDuration: 0, criticalPath: [], bottlenecks: [] };
  }

  const { nodes, adj, inDegree } = buildGraph(tasks);
  const topoOrder = topologicalSort(nodes, adj, inDegree);
  const timing = forwardPass(topoOrder, nodes, adj);

  const projectEnd = Math.max(...Object.values(timing).map(t => t.ef));
  const late = backwardPass(topoOrder, nodes, adj, timing, projectEnd);

  const criticalPath = findCriticalPath(topoOrder, timing, late);
  const bottlenecks = findBottlenecks(adj, criticalPath);

  const enrichedTasks = computeRisk(tasks, criticalPath, adj).map(task => ({
    ...task,
    startDay: timing[task.id].es,
    endDay: timing[task.id].ef,
  }));

  return {
    tasks: enrichedTasks,
    totalDuration: projectEnd,
    criticalPath,
    bottlenecks,
    timing,
    late,
    topoOrder,
    adj,
  };
}

module.exports = { analyzeTasks, buildGraph, topologicalSort };
