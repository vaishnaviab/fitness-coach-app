const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = 3000;
const YOUTUBE_API_KEY = 'AIzaSyDMOZiT8X7BmlznyYREtP3QNEVSO9vj4HY'; // <-- Replace with your own key if needed

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Helper: fetch the top YouTube video ID for an exercise search term
async function fetchYouTubeVideoId(query) {
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}`;
  try {
    const res = await axios.get(url);
    if (
      res.data &&
      res.data.items &&
      res.data.items.length > 0 &&
      res.data.items[0].id.videoId
    ) {
      return res.data.items[0].id.videoId;
    }
  } catch (error) {
    console.error('YouTube fetch error for query:', query, error.message);
  }
  return "";
}

// Plan templates for each goal!
const planTemplates = {
  gain: [
    {
      day: "Monday",
      focus: "Upper Body Strength",
      duration_min: 50,
      intensity: "Moderate/Heavy",
      exercises: [
        { name: "Bench Press", sets: 4, reps: "8", rest_s: 90 },
        { name: "Pull Ups", sets: 4, reps: "10", rest_s: 60 }
      ]
    },
    {
      day: "Wednesday",
      focus: "Lower Body Mass",
      duration_min: 55,
      intensity: "Heavy",
      exercises: [
        { name: "Barbell Squats", sets: 5, reps: "6", rest_s: 120 },
        { name: "Lunges", sets: 3, reps: "12", rest_s: 60 }
      ]
    },
    {
      day: "Friday",
      focus: "Full Body Pump",
      duration_min: 45,
      intensity: "Moderate",
      exercises: [
        { name: "Deadlift", sets: 4, reps: "6", rest_s: 120 },
        { name: "Push Ups", sets: 4, reps: "15", rest_s: 60 }
      ]
    }
  ],
  lose: [
    {
      day: "Monday",
      focus: "HIIT & Cardio",
      duration_min: 40,
      intensity: "High",
      exercises: [
        { name: "Burpees", sets: 5, reps: "15", rest_s: 30 },
        { name: "Mountain Climbers", sets: 4, reps: "20", rest_s: 30 }
      ]
    },
    {
      day: "Wednesday",
      focus: "Circuit Training",
      duration_min: 45,
      intensity: "High",
      exercises: [
        { name: "Jumping Jacks", sets: 4, reps: "30", rest_s: 20 },
        { name: "Bodyweight Squats", sets: 4, reps: "20", rest_s: 20 }
      ]
    },
    {
      day: "Friday",
      focus: "Core & Cardio",
      duration_min: 38,
      intensity: "Moderate/High",
      exercises: [
        { name: "Running", sets: 1, reps: "20 min", rest_s: 0 },
        { name: "Plank", sets: 3, reps: "1 min", rest_s: 60 }
      ]
    }
  ],
  maintain: [
    {
      day: "Monday",
      focus: "Balanced Full Body",
      duration_min: 45,
      intensity: "Moderate",
      exercises: [
        { name: "Push Ups", sets: 3, reps: "15", rest_s: 60 },
        { name: "Squats", sets: 3, reps: "15", rest_s: 60 }
      ]
    },
    {
      day: "Wednesday",
      focus: "Mobility & Cardio",
      duration_min: 35,
      intensity: "Light/Moderate",
      exercises: [
        { name: "Jump Rope", sets: 3, reps: "3 min", rest_s: 60 },
        { name: "Walking Lunges", sets: 3, reps: "12", rest_s: 45 }
      ]
    },
    {
      day: "Friday",
      focus: "Active Recovery",
      duration_min: 40,
      intensity: "Light",
      exercises: [
        { name: "Yoga", sets: 1, reps: "40 min", rest_s: 0 },
        { name: "Stretching", sets: 3, reps: "5 min", rest_s: 0 }
      ]
    }
  ]
};

const nutritionPlans = {
  gain: {
    daily_target_calories: 2500,
    meals: [
      { name: "Breakfast", calories: 600, protein_g: 32, carbs_g: 80, fats_g: 18, items: ["Egg Omelette", "Whole Grain Toast", "Banana"] },
      { name: "Lunch", calories: 700, protein_g: 40, carbs_g: 90, fats_g: 22, items: ["Grilled Chicken", "Brown Rice", "Avocado"] }
    ]
  },
  lose: {
    daily_target_calories: 1500,
    meals: [
      { name: "Breakfast", calories: 300, protein_g: 20, carbs_g: 30, fats_g: 8, items: ["Greek Yogurt", "Berries"] },
      { name: "Lunch", calories: 400, protein_g: 30, carbs_g: 40, fats_g: 12, items: ["Salad with Tuna", "Quinoa"] }
    ]
  },
  maintain: {
    daily_target_calories: 2000,
    meals: [
      { name: "Breakfast", calories: 400, protein_g: 25, carbs_g: 45, fats_g: 10, items: ["Oatmeal", "Milk"] },
      { name: "Lunch", calories: 500, protein_g: 35, carbs_g: 55, fats_g: 16, items: ["Grilled Fish", "Sweet Potato", "Green Beans"] }
    ]
  }
};

// --- Dashboard Data Helper (dynamic by goal & weight) ---
function getDashboardData(goal, startingWeight) {
  let metrics, weightProgress;
  startingWeight = parseFloat(startingWeight) || 70;
  if (goal === 'gain') {
    metrics = [{ label: "Current Weight", value: `${startingWeight} kg`, change: "+1.5 kg", icon: "trending_up" }];
    weightProgress = [
      { week: 1, weight: startingWeight },
      { week: 6, weight: +(startingWeight + 1.5).toFixed(1) }
    ];
  } else if (goal === 'lose') {
    metrics = [{ label: "Current Weight", value: `${startingWeight} kg`, change: "-2 kg", icon: "trending_down" }];
    weightProgress = [
      { week: 1, weight: startingWeight },
      { week: 6, weight: +(startingWeight - 2).toFixed(1) }
    ];
  } else {
    metrics = [{ label: "Current Weight", value: `${startingWeight} kg`, change: "0 kg", icon: "target" }];
    weightProgress = [
      { week: 1, weight: startingWeight },
      { week: 6, weight: startingWeight }
    ];
  }
  return {
    metrics,
    charts: {
      weight_progress: weightProgress,
      calorie_intake: goal === 'gain'
        ? [{ day: "Mon", intake: 2500 }, { day: "Sun", intake: 2550 }]
        : goal === 'lose'
        ? [{ day: "Mon", intake: 1450 }, { day: "Sun", intake: 1550 }]
        : [{ day: "Mon", intake: 2000 }, { day: "Sun", intake: 2050 }]
    }
  };
}

app.post('/api/coach', async (req, res) => {
  const userGoal = (req.body.goal || '').toLowerCase();
  let planKey = 'maintain'; // fallback
  if (userGoal.includes('gain')) planKey = 'gain';
  else if (userGoal.includes('lose')) planKey = 'lose';

  // Deep clone so we don't mutate the template
  let workoutPlanTemplate = JSON.parse(JSON.stringify(planTemplates[planKey]));

  // For each exercise, fetch a relevant YouTube video ID
  for (const day of workoutPlanTemplate) {
    for (const ex of day.exercises) {
      const searchTerm = `${ex.name} exercise demo workout ${planKey}`;
      ex.link_id = (await fetchYouTubeVideoId(searchTerm)) || "";
    }
  }

  // Get user weight from input for dynamic dashboard
  const startingWeight = req.body.weight;
  const dashboard_data = getDashboardData(planKey, startingWeight);

  const mockPlanData = {
    workout_plan: workoutPlanTemplate,
    nutrition_plan: nutritionPlans[planKey],
    dashboard_data
  };

  res.json(mockPlanData);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});