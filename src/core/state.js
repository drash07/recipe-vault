'use strict';

// ── APP STATE ─────────────────────────────────────────────────────
let selectedDay  = todayIdx;
let weekOffset   = 0;
let activeFilter = 'all';
let searchQuery  = '';

// ── DATA ──────────────────────────────────────────────────────────
let recipes   = [];
let mealPlan  = {};
let groceries = [];

// ── AUTH ──────────────────────────────────────────────────────────
let db          = null;
let currentUser = null;
let userProfile = null;

// ── TRANSIENT UI STATE ────────────────────────────────────────────
let pendingImport      = null;
let aiSuggestions      = [];
let smartPlanResult    = null;
let _smartPlanModified = false;
let _generatedRecipe   = null;
let _pendingNewRecipe  = null;
let pickingMealType    = null;
let _pickType          = null;
