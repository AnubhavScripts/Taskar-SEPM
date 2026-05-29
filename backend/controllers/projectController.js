const Project = require('../models/Project');
const { extractTasks } = require('../services/nlpService');
const { analyzeTasks } = require('../services/graphService');
const { predictOutcomes } = require('../services/predictionService');

// ─── POST /api/projects/extract ───────────────────────────────────────────────
// Accept raw text, extract tasks, analyze graph, predict, save to DB
const extractAndCreate = async (req, res) => {
  try {
    const { rawInput, title } = req.body;
    if (!rawInput || rawInput.trim().length < 5) {
      return res.status(400).json({ success: false, error: 'Please provide a meaningful text input.' });
    }

    // Step 1: NLP extraction
    const { tasks: rawTasks } = extractTasks(rawInput);
    if (!rawTasks || rawTasks.length === 0) {
      return res.status(422).json({
        success: false,
        error: 'Could not extract any tasks from the input. Try describing tasks with durations like "Frontend takes 5 days".',
      });
    }

    // Step 2: Graph analysis (CPM scheduling)
    const analysisResult = analyzeTasks(rawTasks);
    const { totalDuration, criticalPath, bottlenecks } = analysisResult;

    // Normalize: graphService uses 'id', schema requires 'taskId'
    const tasks = analysisResult.tasks.map(t => ({
      taskId: t.id ?? t.taskId,
      name: t.name,
      duration: t.duration,
      dependencies: t.dependencies || [],
      startDay: t.startDay || 0,
      endDay: t.endDay || 0,
      delayAdded: t.delayAdded || 0,
      riskLevel: t.riskLevel || 'low',
      isCriticalPath: t.isCriticalPath || false,
    }));

    // Step 3: Prediction
    const prediction = predictOutcomes(tasks, criticalPath, bottlenecks, totalDuration);

    // Step 4: Save project to MongoDB
    const project = await Project.create({
      title: title || `Project ${new Date().toLocaleDateString()}`,
      rawInput,
      tasks,
      totalDuration,
      simulatedDuration: totalDuration,
      criticalPath,
      bottlenecks,
    });

    res.status(201).json({
      success: true,
      data: {
        projectId: project._id,
        title: project.title,
        tasks,
        totalDuration,
        criticalPath,
        bottlenecks,
        prediction,
      },
    });
  } catch (err) {
    console.error('[extractAndCreate]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── GET /api/projects ─────────────────────────────────────────────────────────
// List all projects (summary)
const listProjects = async (req, res) => {
  try {
    const projects = await Project.find({}, 'title totalDuration simulatedDuration createdAt tasks').sort({ createdAt: -1 });
    res.json({ success: true, data: projects });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── GET /api/projects/:id ─────────────────────────────────────────────────────
// Get a single project
const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found.' });
    res.json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── DELETE /api/projects/:id ──────────────────────────────────────────────────
const deleteProject = async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Project deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { extractAndCreate, listProjects, getProject, deleteProject };
