const Project = require('../models/Project');
const AuditLog = require('../models/AuditLog');

// @desc    Create project
// @route   POST /api/projects
const createProject = async (req, res) => {
  const { name, description, tags } = req.body;

  const project = await Project.create({
    name,
    description,
    tags,
    owner: req.user._id,
    members: [{ user: req.user._id, role: req.user.role }],
  });

  await AuditLog.create({
    projectId: project._id,
    userId: req.user._id,
    action: 'PROJECT_CREATED',
    entityType: 'Project',
    entityId: project._id,
  });

  res.status(201).json({ success: true, data: project });
};

// @desc    Get all projects (user's projects)
// @route   GET /api/projects
const getProjects = async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query;

  const filter = {
    $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
  };

  if (status) filter.status = status;
  if (search) filter.name = { $regex: search, $options: 'i' };

  const total = await Project.countDocuments(filter);
  const projects = await Project.find(filter)
    .populate('owner', 'name email')
    .populate('members.user', 'name email')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({ success: true, data: projects, total, page: Number(page) });
};

// @desc    Get single project
// @route   GET /api/projects/:id
const getProject = async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('owner', 'name email')
    .populate('members.user', 'name email');

  if (!project) return res.status(404).json({ error: 'Project not found' });

  res.json({ success: true, data: project });
};

// @desc    Update project
// @route   PUT /api/projects/:id
const updateProject = async (req, res) => {
  const { name, description, tags, status } = req.body;

  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, owner: req.user._id },
    { name, description, tags, status },
    { new: true, runValidators: true }
  );

  if (!project) return res.status(404).json({ error: 'Project not found or unauthorized' });

  res.json({ success: true, data: project });
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
const deleteProject = async (req, res) => {
  const project = await Project.findOneAndDelete({ _id: req.params.id, owner: req.user._id });

  if (!project) return res.status(404).json({ error: 'Project not found or unauthorized' });

  await AuditLog.create({
    userId: req.user._id,
    action: 'PROJECT_DELETED',
    entityType: 'Project',
    entityId: req.params.id,
  });

  res.json({ success: true, message: 'Project deleted' });
};

module.exports = { createProject, getProjects, getProject, updateProject, deleteProject };
