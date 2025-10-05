const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// --- MOCK DATA ---
const mockPlanData = {
  workout_plan: [
    { day: "Monday", focus: "Full Body HIIT", duration_min: 45, intensity: "High Intensity",
      exercises: [{ name: "Burpees", sets: 4, reps: "15", rest_s: 30, link_id: "8T4_KjS3YBc" }] },
    { day: "Wednesday", focus: "Cardio & Core", duration_min: 40, intensity: "High Intensity",
      exercises: [{ name: "Running", sets: 1, reps: "20 min", rest_s: 120, link_id: "x9L4S9x9k9U" }] },
    { day: "Friday", focus: "Circuit Training", duration_min: 45, intensity: "High Intensity",
      exercises: [{ name: "Jumping Jacks", sets: 4, reps: "30", rest_s: 20, link_id: "2E5YnEwQ-Y4" }] }
  ],
  nutrition_plan: {
    daily_target_calories: 1350,
    meals: [
      { name: "Breakfast", calories: 350, protein_g: 25, carbs_g: 35, fats_g: 12, items: ["Greek yogurt", "Almonds (10)"] },
      { name: "Lunch", calories: 450, protein_g: 35, carbs_g: 40, fats_g: 15, items: ["Grilled chicken salad", "Quinoa"] },
    ]
  },
  dashboard_data: {
    metrics: [{ label: "Current Weight", value: "70 kg", change: "-2.5 kg", icon: "target" }],
    charts: {
      weight_progress: [{ week: 1, weight: 76 }, { week: 6, weight: 72.5 }],
      calorie_intake: [{ day: "Mon", intake: 1950 }, { day: "Sun", intake: 2000 }]
    }
  }
};

// --- API ROUTE ---
app.post('/api/coach', (req, res) => {
  console.log('Received user data:', req.body);
  setTimeout(() => {
    res.json(mockPlanData);
  }, 1000);
});

// --- DEFAULT ROUTE ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
