// ============================================================
// src/routes/projectRoutes.js — Project CRUD Routes
// ============================================================
// Maps HTTP method + URL path → controller function
//
// All routes here are prefixed with /api/projects in server.js
//
// ROUTE OVERVIEW:
//   POST   /api/projects                        → create a new project
//   GET    /api/projects                        → list all projects
//   GET    /api/projects/:id                    → get one project (full data)
//   DELETE /api/projects/:id                    → delete a project
//   POST   /api/projects/:id/sources            → add a source to a project
//   DELETE /api/projects/:id/sources/:sourceId  → remove a source from a project
// ============================================================

import express from 'express';
import {
  createProject,
  getAllProjects,
  getProjectById,
  addSource,
  removeSource,
  deleteProject,
} from '../controllers/projectController.js';
import { validateMongoId } from '../middleware/validateMongoId.js';

const router = express.Router();

// ── Project-level routes ──────────────────────────────────────
router.post  ('/',    createProject);
router.get   ('/',    getAllProjects);

// validateMongoId middleware runs BEFORE the controller on any route
// with an :id param — it rejects bad IDs early with a clean error
// instead of letting Mongoose throw a confusing CastError.
router.get   ('/:id', validateMongoId('id'), getProjectById);
router.delete('/:id', validateMongoId('id'), deleteProject);

// ── Source-level routes (nested under a project) ──────────────
router.post  ('/:id/sources',            validateMongoId('id'), addSource);
router.delete('/:id/sources/:sourceId',  validateMongoId('id'), removeSource);

export default router;
