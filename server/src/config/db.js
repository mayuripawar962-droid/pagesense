// ============================================================
// src/config/db.js — MongoDB Connection
// ============================================================
// This file connects the Express server to MongoDB using Mongoose.
//
// IMPORTANT DESIGN DECISION for MVP:
// MongoDB failure does NOT crash the server.
// The AI features (analyze, ask, flashcards, quiz) work without
// a database — they just won't save/load projects.
// This lets you develop and test AI features even if MongoDB
// is not running on your machine yet.
//
// When MongoDB IS connected, saving and loading projects works.
// ============================================================

import mongoose from 'mongoose';

// Track connection state so we can expose it to other parts of the app
let isConnected = false;

export const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      // These options prevent deprecation warnings in newer Mongoose versions
      serverSelectionTimeoutMS: 5000, // Stop trying after 5 seconds
    });

    isConnected = true;
    console.log(`✅ MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    // Log clearly but do NOT crash the server (no process.exit)
    // The app runs in "stateless mode" — AI features still work
    isConnected = false;
    console.warn(`⚠️  MongoDB not available: ${error.message}`);
    console.warn(`⚠️  Running in stateless mode — AI features work, but projects won't be saved.`);
    console.warn(`⚠️  To enable saving: install MongoDB or set MONGODB_URI to a MongoDB Atlas URL.`);
  }
};

// Export a helper so controllers can check if DB is available
// before attempting to save/load data
export const getDBStatus = () => isConnected;
