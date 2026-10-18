// ============================================================
// src/controllers/projectController.js — Project CRUD
// ============================================================
// This controller handles everything related to Research Projects:
//   - Create a new project
//   - Get all projects (list view)
//   - Get one project by ID (full detail view)
//   - Add a source to a project
//   - Remove a source from a project
//   - Delete an entire project
//
// WHAT IS CRUD?
// Create, Read, Update, Delete — the four basic database operations.
// Every resource in a backend application supports some or all of these.
//
// HOW CONTROLLERS WORK:
// 1. Request arrives from React frontend
// 2. Controller reads data from req.body or req.params
// 3. Controller validates the data
// 4. Controller talks to the database (via the Project model)
// 5. Controller sends a response back to React
// ============================================================

import Project from '../models/Project.js';
import { createError } from '../middleware/errorHandler.js';
import { getDBStatus } from '../config/db.js';
import { countWords } from '../utils/helpers.js';

// ── Helper: check DB is available before any save/load ────────
const requireDB = () => {
  if (!getDBStatus()) {
    throw createError(
      503,
      'Database is not connected. Projects cannot be saved in stateless mode. Please connect MongoDB to enable project saving.'
    );
  }
};

// ============================================================
// POST /api/projects
// Create a new research project
// ============================================================
// Request body: { title, description }
// Response:     { success, project }
export const createProject = async (req, res, next) => {
  try {
    requireDB();

    const { title, description } = req.body;

    if (!title || !title.trim()) {
      throw createError(400, 'Project title is required.');
    }

    const project = await Project.create({
      title:       title.trim(),
      description: description ? description.trim() : '',
      sources:     [],
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully.',
      project,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET /api/projects
// Get all projects (newest first, without source content)
// ============================================================
// Response: { success, count, projects }
export const getAllProjects = async (req, res, next) => {
  try {
    requireDB();

    // Select only the fields needed for a list view.
    // We exclude source content (it's large) — only fetched when
    // the user opens a specific project.
    const projects = await Project.find({})
      .select('title description isAnalyzed createdAt updatedAt sources.title sources.wordCount')
      .sort({ createdAt: -1 }) // newest first
      .lean(); // .lean() returns plain JS objects — faster than full Mongoose docs

    res.status(200).json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET /api/projects/:id
// Get one project by its ID (full data including all content)
// ============================================================
// URL param: :id — the MongoDB _id of the project
// Response:  { success, project }
export const getProjectById = async (req, res, next) => {
  try {
    requireDB();

    const project = await Project.findById(req.params.id);

    if (!project) {
      throw createError(404, 'Project not found.');
    }

    res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// POST /api/projects/:id/sources
// Add a new source to an existing project
// ============================================================
// URL param:    :id — project ID
// Request body: { title, content }
// Response:     { success, source, project }
export const addSource = async (req, res, next) => {
  try {
    requireDB();

    const { title, content } = req.body;

    // Validate
    if (!title || !title.trim()) {
      throw createError(400, 'Source title is required.');
    }
    if (!content || content.trim().length < 100) {
      throw createError(400, 'Source content must be at least 100 characters.');
    }
    if (content.length > 15000) {
      throw createError(400, 'Source content cannot exceed 15,000 characters.');
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      throw createError(404, 'Project not found.');
    }

    if (project.sources.length >= 6) {
      throw createError(400, 'A project cannot have more than 6 sources.');
    }

    // Build the new source object
    const newSource = {
      title:     title.trim(),
      content:   content.trim(),
      wordCount: countWords(content),
      analysis:  null, // null until individual analysis is run
    };

    // Push the new source into the project's sources array
    project.sources.push(newSource);

    // Mark the project as no longer analyzed
    // (adding a new source invalidates the old combined analysis)
    project.isAnalyzed = false;
    project.combinedAnalysis = null;

    await project.save();

    // Return the newly added source (the last one in the array)
    const addedSource = project.sources[project.sources.length - 1];

    res.status(201).json({
      success: true,
      message: 'Source added successfully.',
      source:  addedSource,
      project,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// DELETE /api/projects/:id/sources/:sourceId
// Remove a specific source from a project
// ============================================================
// URL params: :id — project ID, :sourceId — source _id
// Response:   { success, message, project }
export const removeSource = async (req, res, next) => {
  try {
    requireDB();

    const project = await Project.findById(req.params.id);
    if (!project) {
      throw createError(404, 'Project not found.');
    }

    // Find the source by its _id inside the sources array
    const sourceIndex = project.sources.findIndex(
      (s) => s._id.toString() === req.params.sourceId
    );

    if (sourceIndex === -1) {
      throw createError(404, 'Source not found in this project.');
    }

    // Remove it using splice
    project.sources.splice(sourceIndex, 1);

    // Removing a source invalidates any existing analysis
    project.isAnalyzed = false;
    project.combinedAnalysis = null;

    await project.save();

    res.status(200).json({
      success: true,
      message: 'Source removed successfully.',
      project,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// DELETE /api/projects/:id
// Delete an entire project and all its data
// ============================================================
// URL param: :id — project ID
// Response:  { success, message }
export const deleteProject = async (req, res, next) => {
  try {
    requireDB();

    const project = await Project.findByIdAndDelete(req.params.id);

    if (!project) {
      throw createError(404, 'Project not found.');
    }

    res.status(200).json({
      success: true,
      message: `Project "${project.title}" deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
};
