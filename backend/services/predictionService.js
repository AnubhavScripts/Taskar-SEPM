/**
 * Prediction Service
 * Rule-based prediction engine (no ML required).
 * Generates:
 *  - Delay risk score per task (0–100)
 *  - Overall project risk classification
 *  - Bottleneck warnings
 *  - Estimated completion confidence
 *  - Recommendations
 */

/**
 * Score a single task's delay risk (0 = no risk, 100 = certain delay)
 */
function scoreTaskRisk(task, criticalPath, bottlenecks) {
  let score = 0;
  const tid = task.taskId ?? task.id;

  // On critical path: major risk factor
  if (criticalPath.includes(tid)) score += 40;

  // Is a bottleneck: many tasks depend on it
  if (bottlenecks.includes(tid)) score += 25;

  // Long duration = more opportunity for delay
  if (task.duration >= 14) score += 20;
  else if (task.duration >= 7) score += 10;

  // Many dependencies = complex coordination needed
  if (task.dependencies.length >= 3) score += 15;
  else if (task.dependencies.length >= 1) score += 5;

  return Math.min(score, 100);
}

/**
 * Classify overall project risk
 */
function classifyProjectRisk(tasks, criticalPath, totalDuration) {
  const highRiskTasks = tasks.filter(t => t.riskLevel === 'high').length;
  const medRiskTasks = tasks.filter(t => t.riskLevel === 'medium').length;
  const cpLength = criticalPath.length;
  const cpRatio = cpLength / tasks.length;

  let riskScore = 0;
  riskScore += highRiskTasks * 20;
  riskScore += medRiskTasks * 10;
  riskScore += cpRatio > 0.5 ? 20 : cpRatio > 0.25 ? 10 : 0;
  riskScore += totalDuration > 60 ? 20 : totalDuration > 30 ? 10 : 0;

  if (riskScore >= 60) return 'high';
  if (riskScore >= 30) return 'medium';
  return 'low';
}

/**
 * Generate actionable recommendations
 */
function generateRecommendations(tasks, criticalPath, bottlenecks, totalDuration) {
  const recommendations = [];

  // Bottleneck-specific
  for (const bId of bottlenecks) {
    const bt = tasks.find(t => t.id === bId);
    if (bt) {
      recommendations.push({
        type: 'bottleneck',
        severity: 'high',
        message: `"${bt.name}" is a major bottleneck — many tasks depend on it. Consider parallelizing or adding resources.`,
        taskId: bId,
      });
    }
  }

  // Long critical path tasks
  const longCPTasks = tasks.filter(t => criticalPath.includes(t.id) && t.duration >= 7);
  for (const t of longCPTasks.slice(0, 2)) {
    recommendations.push({
      type: 'critical_path',
      severity: 'high',
      message: `"${t.name}" is on the critical path and takes ${t.duration} days. Any delay here directly delays the project.`,
      taskId: t.id,
    });
  }

  // Tasks with no dependencies that could be parallelized
  const parallelizable = tasks.filter(t => t.dependencies.length === 0 && !criticalPath.includes(t.id));
  if (parallelizable.length >= 2) {
    recommendations.push({
      type: 'optimization',
      severity: 'low',
      message: `${parallelizable.map(t => `"${t.name}"`).join(', ')} have no dependencies — they can run in parallel to save time.`,
    });
  }

  // Very long project
  if (totalDuration > 60) {
    recommendations.push({
      type: 'timeline',
      severity: 'medium',
      message: `Project spans ${totalDuration} days. Consider breaking it into phases/milestones to reduce risk.`,
    });
  }

  return recommendations;
}

/**
 * Main prediction function
 */
function predictOutcomes(tasks, criticalPath, bottlenecks, totalDuration) {
  const taskPredictions = tasks.map(task => ({
    id: task.taskId ?? task.id,
    name: task.name,
    riskScore: scoreTaskRisk(task, criticalPath, bottlenecks),
    riskLevel: task.riskLevel,
    isCriticalPath: task.isCriticalPath,
    startDay: task.startDay,
    endDay: task.endDay,
    duration: task.duration,
  }));

  const overallRisk = classifyProjectRisk(tasks, criticalPath, totalDuration);
  const recommendations = generateRecommendations(tasks, criticalPath, bottlenecks, totalDuration);

  // Confidence: inverse of risk, adjusted for critical path ratio
  const avgRisk = taskPredictions.reduce((sum, t) => sum + t.riskScore, 0) / (taskPredictions.length || 1);
  const confidence = Math.max(10, Math.round(100 - avgRisk * 0.7));

  return {
    taskPredictions,
    overallRisk,
    confidence,
    recommendations,
    summary: {
      totalTasks: tasks.length,
      criticalPathLength: criticalPath.length,
      bottleneckCount: bottlenecks.length,
      estimatedCompletionDays: totalDuration,
      highRiskCount: taskPredictions.filter(t => t.riskLevel === 'high').length,
      mediumRiskCount: taskPredictions.filter(t => t.riskLevel === 'medium').length,
    },
  };
}

module.exports = { predictOutcomes };
