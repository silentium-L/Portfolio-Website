/* data.jsx – Mock data for Gym Tracker */

const MOCK_USER = {
  name: 'Alex', email: 'alex@example.com', joined: '2025-11-15',
  height: 182, currentWeight: 84.5,
  goals: { weeklyWorkouts: 4, targetWeight: 82 }
};

const EXERCISES = [
  { id: 1, name: 'Bench Press', muscle: 'Chest', type: 'strength', icon: '🏋️' },
  { id: 2, name: 'Squat', muscle: 'Legs', type: 'strength', icon: '🦵' },
  { id: 3, name: 'Deadlift', muscle: 'Back', type: 'strength', icon: '💪' },
  { id: 4, name: 'Overhead Press', muscle: 'Shoulders', type: 'strength', icon: '🏋️' },
  { id: 5, name: 'Barbell Row', muscle: 'Back', type: 'strength', icon: '💪' },
  { id: 6, name: 'Pull-ups', muscle: 'Back', type: 'strength', icon: '💪' },
  { id: 7, name: 'Leg Press', muscle: 'Legs', type: 'strength', icon: '🦵' },
  { id: 8, name: 'Lat Pulldown', muscle: 'Back', type: 'strength', icon: '💪' },
  { id: 9, name: 'Dumbbell Curl', muscle: 'Arms', type: 'strength', icon: '💪' },
  { id: 10, name: 'Tricep Pushdown', muscle: 'Arms', type: 'strength', icon: '💪' },
  { id: 11, name: 'Running', muscle: 'Cardio', type: 'cardio', icon: '🏃' },
  { id: 12, name: 'Cycling', muscle: 'Cardio', type: 'cardio', icon: '🚴' },
  { id: 13, name: 'Lateral Raise', muscle: 'Shoulders', type: 'strength', icon: '🏋️' },
  { id: 14, name: 'Cable Fly', muscle: 'Chest', type: 'strength', icon: '🏋️' },
  { id: 15, name: 'Leg Curl', muscle: 'Legs', type: 'strength', icon: '🦵' },
];

const WEEK_LABELS = ['KW 13','KW 14','KW 15','KW 16','KW 17','KW 18','KW 19','KW 20'];

const WEEKLY_VOLUME = [18200, 21000, 19500, 22800, 24100, 23500, 25200, 26800];
const WEEKLY_WORKOUTS_COUNT = [3, 4, 3, 4, 4, 3, 4, 3];
const BODY_WEIGHT_SERIES = [86.2, 85.8, 85.5, 85.1, 84.8, 84.6, 84.5, 84.3];

const MUSCLE_DISTRIBUTION = {
  Chest: 85, Back: 92, Legs: 68, Shoulders: 78, Arms: 72, Core: 45
};

// Heatmap: last 90 days, 0=rest, 1=light, 2=moderate, 3=intense
function generateHeatmap() {
  const data = [];
  const today = new Date();
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dow = d.getDay();
    let intensity = 0;
    if (dow === 0 || dow === 4) intensity = 0; // rest days
    else if (dow === 1 || dow === 3 || dow === 5) intensity = Math.random() > 0.15 ? (Math.random() > 0.4 ? 3 : 2) : 0;
    else intensity = Math.random() > 0.5 ? 1 : 0;
    data.push({ date: d.toISOString().slice(0,10), intensity, dow });
  }
  return data;
}
const HEATMAP_DATA = generateHeatmap();

const RECENT_WORKOUTS = [
  { id: 1, name: 'Push Day', date: '2026-05-19', duration: 62, exercises: [
    { exerciseId: 1, sets: [{w:85,r:8},{w:87.5,r:7},{w:87.5,r:6},{w:85,r:8}] },
    { exerciseId: 4, sets: [{w:52.5,r:8},{w:55,r:7},{w:55,r:6}] },
    { exerciseId: 14, sets: [{w:15,r:12},{w:17.5,r:10},{w:17.5,r:10}] },
    { exerciseId: 13, sets: [{w:12,r:12},{w:14,r:10},{w:14,r:10}] },
  ]},
  { id: 2, name: 'Pull Day', date: '2026-05-17', duration: 58, exercises: [
    { exerciseId: 3, sets: [{w:140,r:5},{w:145,r:4},{w:140,r:5}] },
    { exerciseId: 5, sets: [{w:70,r:8},{w:72.5,r:7},{w:72.5,r:7}] },
    { exerciseId: 8, sets: [{w:65,r:10},{w:67.5,r:9},{w:67.5,r:8}] },
    { exerciseId: 9, sets: [{w:16,r:12},{w:18,r:10},{w:18,r:9}] },
  ]},
  { id: 3, name: 'Leg Day', date: '2026-05-16', duration: 55, exercises: [
    { exerciseId: 2, sets: [{w:110,r:8},{w:115,r:6},{w:115,r:6},{w:110,r:8}] },
    { exerciseId: 7, sets: [{w:180,r:10},{w:200,r:8},{w:200,r:8}] },
    { exerciseId: 15, sets: [{w:45,r:12},{w:50,r:10},{w:50,r:10}] },
  ]},
  { id: 4, name: 'Push Day', date: '2026-05-14', duration: 60, exercises: [
    { exerciseId: 1, sets: [{w:82.5,r:8},{w:85,r:8},{w:87.5,r:6},{w:85,r:7}] },
    { exerciseId: 4, sets: [{w:50,r:9},{w:52.5,r:8},{w:55,r:6}] },
    { exerciseId: 14, sets: [{w:15,r:12},{w:15,r:12},{w:17.5,r:10}] },
  ]},
  { id: 5, name: 'Pull Day', date: '2026-05-12', duration: 52, exercises: [
    { exerciseId: 3, sets: [{w:135,r:5},{w:140,r:5},{w:140,r:4}] },
    { exerciseId: 5, sets: [{w:67.5,r:8},{w:70,r:8},{w:70,r:7}] },
    { exerciseId: 6, sets: [{w:10,r:8},{w:10,r:7},{w:10,r:7}] },
  ]},
  { id: 6, name: 'Cardio', date: '2026-05-11', duration: 35, exercises: [
    { exerciseId: 11, sets: [{w:0,r:0,dist:5.2,time:28}] },
  ]},
  { id: 7, name: 'Leg Day', date: '2026-05-09', duration: 50, exercises: [
    { exerciseId: 2, sets: [{w:105,r:8},{w:110,r:7},{w:110,r:6}] },
    { exerciseId: 7, sets: [{w:170,r:10},{w:180,r:10},{w:190,r:8}] },
  ]},
  { id: 8, name: 'Push Day', date: '2026-05-07', duration: 58, exercises: [
    { exerciseId: 1, sets: [{w:80,r:8},{w:82.5,r:8},{w:85,r:7},{w:85,r:6}] },
    { exerciseId: 4, sets: [{w:50,r:8},{w:52.5,r:7},{w:52.5,r:7}] },
  ]},
];

function calcVolume(workout) {
  return workout.exercises.reduce((sum, ex) =>
    sum + ex.sets.reduce((s, set) => s + (set.w * set.r), 0), 0);
}

const PERSONAL_RECORDS = [
  { exerciseId: 3, value: 145, unit: 'kg', date: '2026-05-17', label: 'Deadlift 1RM' },
  { exerciseId: 2, value: 115, unit: 'kg', date: '2026-05-16', label: 'Squat 1RM' },
  { exerciseId: 1, value: 87.5, unit: 'kg', date: '2026-05-19', label: 'Bench Press 1RM' },
  { exerciseId: 4, value: 55, unit: 'kg', date: '2026-05-19', label: 'OHP 1RM' },
];

const PLATEAU_ALERTS = [
  { exerciseId: 1, exercise: 'Bench Press', metric: 'Gewicht', weeks: 4, lastValue: '87.5 kg',
    detail: 'Seit 4 Wochen keine Steigerung beim Maximalgewicht.', severity: 'high' },
  { exerciseId: 4, exercise: 'Overhead Press', metric: 'Wiederholungen', weeks: 3, lastValue: '6-8 Reps',
    detail: 'Die Wiederholungszahlen bei 55 kg stagnieren seit 3 Wochen.', severity: 'medium' },
  { exerciseId: 2, exercise: 'Squat', metric: 'Volumen', weeks: 2, lastValue: '↓ 8%',
    detail: 'Das Trainingsvolumen ist in den letzten 2 Wochen leicht gesunken.', severity: 'low' },
  { exerciseId: 6, exercise: 'Pull-ups', metric: 'Variation', weeks: 5, lastValue: '3x7-8',
    detail: 'Identisches Set-Schema seit 5 Wochen ohne Variation.', severity: 'medium' },
];

const HIDDEN_GAINS = [
  { exerciseId: 1, exercise: 'Bench Press', type: 'volume',
    title: 'Volumen +14%', detail: 'Dein Bench Press Gesamtvolumen ist von 2.040 auf 2.325 kg pro Session gestiegen – trotz gleichem Maximalgewicht.',
    metric: '+285 kg Volumen', period: 'Letzte 4 Wochen', positive: true },
  { exerciseId: 5, exercise: 'Barbell Row', type: 'reps',
    title: '+2 Reps bei 70 kg', detail: 'Bei 70 kg schaffst du jetzt konstant 8 statt 6 Wiederholungen.',
    metric: '6 → 8 Reps', period: 'Letzte 3 Wochen', positive: true },
  { exerciseId: 2, exercise: 'Squat', type: 'frequency',
    title: '2x/Woche Beintraining', detail: 'Du trainierst Beine jetzt regelmäßig 2x pro Woche, vorher nur 1x.',
    metric: '1x → 2x / Woche', period: 'Letzte 4 Wochen', positive: true },
  { exerciseId: 8, exercise: 'Lat Pulldown', type: 'volume',
    title: 'Volumen +18%', detail: 'Mehr Sätze und höheres Gewicht beim Lat Pulldown – starke Steigerung.',
    metric: '+320 kg Volumen', period: 'Letzte 3 Wochen', positive: true },
];

const BODY_MEASUREMENTS = [
  { date: '2026-03-24', weight: 86.2, chest: 104, waist: 84, arm: 37.5, thigh: 59 },
  { date: '2026-04-01', weight: 85.8, chest: 104.5, waist: 83.5, arm: 37.5, thigh: 59.5 },
  { date: '2026-04-08', weight: 85.5, chest: 104.5, waist: 83, arm: 38, thigh: 59.5 },
  { date: '2026-04-15', weight: 85.1, chest: 105, waist: 82.5, arm: 38, thigh: 60 },
  { date: '2026-04-22', weight: 84.8, chest: 105, waist: 82, arm: 38.5, thigh: 60 },
  { date: '2026-04-29', weight: 84.6, chest: 105.5, waist: 81.5, arm: 38.5, thigh: 60.5 },
  { date: '2026-05-06', weight: 84.5, chest: 105.5, waist: 81, arm: 38.5, thigh: 60.5 },
  { date: '2026-05-13', weight: 84.3, chest: 106, waist: 80.5, arm: 39, thigh: 61 },
];

const SLEEP_DATA = [
  { date: '2026-05-13', hours: 7.5, quality: 82 },
  { date: '2026-05-14', hours: 6.8, quality: 68 },
  { date: '2026-05-15', hours: 8.1, quality: 90 },
  { date: '2026-05-16', hours: 7.2, quality: 75 },
  { date: '2026-05-17', hours: 7.8, quality: 85 },
  { date: '2026-05-18', hours: 8.5, quality: 92 },
  { date: '2026-05-19', hours: 7.0, quality: 72 },
];

const WEEK_SUMMARY = {
  workoutsThisWeek: 3,
  weeklyGoal: 4,
  totalVolume: 26800,
  volumeChange: +6.3,
  streak: 12,
  avgSleep: 7.6,
  sleepQuality: 81,
};

// ── Exercises API helper ─────────────────────────────────────────────────────

async function fetchExercises(apiBase, token) {
  const res = await fetch(`${apiBase}/api/gym/exercises`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? 'Laden fehlgeschlagen');
  return json.data;
}

// ── Templates API helpers ────────────────────────────────────────────────────

async function fetchTemplates(apiBase, token) {
  const res = await fetch(`${apiBase}/api/gym/templates`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? 'Laden fehlgeschlagen');
  return json.data;
}

async function fetchTemplate(apiBase, token, id) {
  const res = await fetch(`${apiBase}/api/gym/templates/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? 'Laden fehlgeschlagen');
  return json.data;
}

async function saveTemplate(apiBase, token, data) {
  const res = await fetch(`${apiBase}/api/gym/templates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? 'Erstellen fehlgeschlagen');
  return json.data;
}

async function updateTemplate(apiBase, token, id, data) {
  const res = await fetch(`${apiBase}/api/gym/templates/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? 'Aktualisieren fehlgeschlagen');
  return json.data;
}

async function deleteTemplate(apiBase, token, id) {
  const res = await fetch(`${apiBase}/api/gym/templates/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? 'Löschen fehlgeschlagen');
  return json.data;
}

// ── Measurements API helpers ─────────────────────────────────────────────────

async function fetchMeasurements(apiBase, token) {
  const res = await fetch(`${apiBase}/api/gym/measurements`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? 'Laden fehlgeschlagen');
  return json.data;
}

async function saveMeasurement(apiBase, token, data) {
  const res = await fetch(`${apiBase}/api/gym/measurements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? 'Speichern fehlgeschlagen');
  return json.data;
}

async function updateMeasurement(apiBase, token, id, data) {
  const res = await fetch(`${apiBase}/api/gym/measurements/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? 'Aktualisieren fehlgeschlagen');
  return json.data;
}

async function deleteMeasurement(apiBase, token, id) {
  const res = await fetch(`${apiBase}/api/gym/measurements/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? 'Löschen fehlgeschlagen');
  return json.data;
}

// ── Workouts API helpers ─────────────────────────────────────────────────────

async function fetchWorkouts(apiBase, token) {
  const res = await fetch(`${apiBase}/api/gym/workouts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? 'Laden fehlgeschlagen');
  return json.data;
}

async function saveWorkout(apiBase, token, data) {
  const res = await fetch(`${apiBase}/api/gym/workouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? 'Speichern fehlgeschlagen');
  return json.data;
}

function loadProfile() {
  try {
    const raw = localStorage.getItem('gym_profile_data');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveProfile(data) {
  try {
    localStorage.setItem('gym_profile_data', JSON.stringify(data));
  } catch { /* storage quota exceeded */ }
}

Object.assign(window, {
  MOCK_USER, EXERCISES, WEEK_LABELS, WEEKLY_VOLUME, WEEKLY_WORKOUTS_COUNT,
  BODY_WEIGHT_SERIES, MUSCLE_DISTRIBUTION, HEATMAP_DATA, RECENT_WORKOUTS,
  PERSONAL_RECORDS, PLATEAU_ALERTS, HIDDEN_GAINS, BODY_MEASUREMENTS,
  SLEEP_DATA, WEEK_SUMMARY, calcVolume, loadProfile, saveProfile,
  fetchMeasurements, saveMeasurement, updateMeasurement, deleteMeasurement,
  fetchExercises,
  fetchTemplates, fetchTemplate, saveTemplate, updateTemplate, deleteTemplate,
  fetchWorkouts, saveWorkout,
});
