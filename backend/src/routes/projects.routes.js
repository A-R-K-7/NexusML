const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');
const {
  createProject, getProjects, getProject, updateProject, deleteProject,
} = require('../controllers/projects.controller');

router.use(auth);

router.post('/', role('Owner', 'Contributor'), createProject);
router.get('/', getProjects);
router.get('/:id', getProject);
router.put('/:id', role('Owner', 'Contributor'), updateProject);
router.delete('/:id', role('Owner'), deleteProject);

module.exports = router;
