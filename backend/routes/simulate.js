const express = require('express');
const router = express.Router();
const { runSimulation, getSimulationHistory } = require('../controllers/simulationController');

router.post('/:projectId', runSimulation);
router.get('/:projectId/history', getSimulationHistory);

module.exports = router;
