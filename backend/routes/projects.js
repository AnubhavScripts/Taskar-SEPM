const express = require('express');
const router = express.Router();
const { extractAndCreate, listProjects, getProject, deleteProject } = require('../controllers/projectController');

router.post('/extract', extractAndCreate);
router.get('/', listProjects);
router.get('/:id', getProject);
router.delete('/:id', deleteProject);

module.exports = router;
