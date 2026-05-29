const Project = require('../models/Project');
const { simulateRipple } = require('../services/simulationService');
const { predictOutcomes } = require('../services/predictionService');

// ─── POST /api/simulate/:projectId ────────────────────────────────────────────
// Run ripple simulation on a project
const runSimulation = async (req, res) => {
  try {
    const { delays } = req.body;
    // delays: [{ taskId: Number, delayDays: Number }]

    if (!delays || !Array.isArray(delays) || delays.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Provide at least one delay: [{ taskId, delayDays }]',
      });
    }

    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    // Run ripple simulation
    const {
      tasks: simTasks,
      simulatedDuration,
      affectedTasks,
      criticalPath,
      bottlenecks,
      deltaReport,
    } = simulateRipple(project.tasks, delays);

    // Run prediction on simulated state
    const prediction = predictOutcomes(simTasks, criticalPath, bottlenecks, simulatedDuration);

    // Persist simulation result
    project.simulatedDuration = simulatedDuration;
    project.simulationHistory.push({
      appliedAt: new Date(),
      delays,
      resultDuration: simulatedDuration,
      affectedTasks,
    });
    await project.save();

    res.json({
      success: true,
      data: {
        projectId: project._id,
        originalDuration: project.totalDuration,
        simulatedDuration,
        delayedBy: simulatedDuration - project.totalDuration,
        affectedTasks,
        criticalPath,
        bottlenecks,
        deltaReport,
        prediction,
        tasks: simTasks,
      },
    });
  } catch (err) {
    console.error('[runSimulation]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── GET /api/simulate/:projectId/history ─────────────────────────────────────
// Get simulation history for a project
const getSimulationHistory = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId, 'simulationHistory title');
    if (!project) return res.status(404).json({ success: false, error: 'Project not found.' });
    res.json({ success: true, data: project.simulationHistory });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { runSimulation, getSimulationHistory };
