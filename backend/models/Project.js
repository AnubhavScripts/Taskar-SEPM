const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  taskId: { type: Number, required: true },
  name: { type: String, required: true, trim: true },
  duration: { type: Number, required: true, min: 1 }, // in days
  dependencies: [{ type: Number }], // array of taskIds this task depends on
  startDay: { type: Number, default: 0 },
  endDay: { type: Number, default: 0 },
  delayAdded: { type: Number, default: 0 }, // delay in days applied during simulation
  riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  isCriticalPath: { type: Boolean, default: false },
}, { _id: false });

const ProjectSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, default: 'Untitled Project' },
  rawInput: { type: String, required: true },       // original text input
  tasks: [TaskSchema],
  totalDuration: { type: Number, default: 0 },       // original completion days
  simulatedDuration: { type: Number, default: 0 },   // after ripple simulation
  criticalPath: [{ type: Number }],                  // taskIds on critical path
  bottlenecks: [{ type: Number }],                   // taskIds that are bottlenecks
  simulationHistory: [{
    appliedAt: { type: Date, default: Date.now },
    delays: [{
      taskId: { type: Number },
      delayDays: { type: Number },
    }],
    resultDuration: { type: Number },
    affectedTasks: [{ type: Number }],
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

ProjectSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Project', ProjectSchema);
