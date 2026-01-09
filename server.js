const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

/* 🔴 Your YouTube API key */
const YOUTUBE_API_KEY = 'AIzaSyDMOZiT8X7BmlznyYREtP3QNEVSO9vj4HY';

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

/* ---------------- YOUTUBE HELPER ---------------- */
async function fetchYouTubeVideoId(query) {
    try {
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&q=${encodeURIComponent(
            query
        )}&key=${YOUTUBE_API_KEY}`;
        const res = await axios.get(url);
        return res.data.items[0]?.id?.videoId || '';
    } catch (e) {
        return '';
    }
}

/* ---------------- WORKOUT PLANS ---------------- */
const planTemplates = {
    gain: [
        { day: 'Monday', duration_min: 25, exercises: [
            { name: 'Push Ups', sets: 3, reps: '10–12' },
            { name: 'Shoulder Press', sets: 3, reps: '10' }
        ]},
        { day: 'Tuesday', duration_min: 25, exercises: [
            { name: 'Goblet Squats', sets: 3, reps: '12' },
            { name: 'Glute Bridges', sets: 3, reps: '12' }
        ]},
        { day: 'Wednesday', duration_min: 20, exercises: [
            { name: 'Bent Over Rows', sets: 3, reps: '10' },
            { name: 'Plank', sets: 3, reps: '30 sec' }
        ]},
        { day: 'Thursday', duration_min: 15, exercises: [
            { name: 'Brisk Walking', sets: 1, reps: '15 min' }
        ]},
        { day: 'Friday', duration_min: 25, exercises: [
            { name: 'Deadlift', sets: 3, reps: '8–10' },
            { name: 'Incline Push Ups', sets: 3, reps: '10' }
        ]},
        { day: 'Saturday', duration_min: 20, exercises: [
            { name: 'Bicep Curls', sets: 3, reps: '12' },
            { name: 'Lateral Raises', sets: 3, reps: '12' }
        ]},
        { day: 'Sunday', duration_min: 15, exercises: [
            { name: 'Yoga', sets: 1, reps: '20 min' }
        ]}
    ],

    lose: [
        { day: 'Monday', duration_min: 20, exercises: [
            { name: 'Jumping Jacks', sets: 4, reps: '30 sec' },
            { name: 'High Knees', sets: 4, reps: '30 sec' }
        ]},
        { day: 'Tuesday', duration_min: 25, exercises: [
            { name: 'Brisk Walking', sets: 1, reps: '25 min' },
            { name: 'Crunches', sets: 3, reps: '15' }
        ]},
        { day: 'Wednesday', duration_min: 20, exercises: [
            { name: 'Bodyweight Squats', sets: 3, reps: '15' },
            { name: 'Mountain Climbers', sets: 3, reps: '20' }
        ]},
        { day: 'Thursday', duration_min: 20, exercises: [
            { name: 'Step Ups', sets: 3, reps: '12 each leg' }
        ]},
        { day: 'Friday', duration_min: 20, exercises: [
            { name: 'Glute Bridges', sets: 3, reps: '15' },
            { name: 'Side Plank', sets: 3, reps: '20 sec' }
        ]},
        { day: 'Saturday', duration_min: 25, exercises: [
            { name: 'Jogging', sets: 1, reps: '25 min' }
        ]},
        { day: 'Sunday', duration_min: 15, exercises: [
            { name: 'Stretching', sets: 1, reps: '15 min' }
        ]}
    ],

    maintain: [
        { day: 'Monday', duration_min: 20, exercises: [
            { name: 'Bodyweight Squats', sets: 3, reps: '12' },
            { name: 'Push Ups', sets: 3, reps: '10' }
        ]},
        { day: 'Tuesday', duration_min: 20, exercises: [
            { name: 'Walking', sets: 1, reps: '20 min' }
        ]},
        { day: 'Wednesday', duration_min: 20, exercises: [
            { name: 'Rows', sets: 3, reps: '10' },
            { name: 'Glute Bridges', sets: 3, reps: '12' }
        ]},
        { day: 'Thursday', duration_min: 15, exercises: [
            { name: 'Plank', sets: 3, reps: '30 sec' }
        ]},
        { day: 'Friday', duration_min: 20, exercises: [
            { name: 'Jump Rope', sets: 3, reps: '1 min' }
        ]},
        { day: 'Saturday', duration_min: 25, exercises: [
            { name: 'Sports / Dance', sets: 1, reps: '25 min' }
        ]},
        { day: 'Sunday', duration_min: 20, exercises: [
            { name: 'Yoga', sets: 1, reps: '20 min' }
        ]}
    ]
};

/* ---------------- DASHBOARD LOGIC (FIXED) ---------------- */
function getDashboardData(activeMode, weight, height) {
    const h = height / 100;
    const bmi = +(weight / (h * h)).toFixed(1);

    let guidanceValue = '';
    let guidanceNote = '';

    const target = +(22 * h * h).toFixed(1);
    const diff = +(target - weight).toFixed(1);

    if (bmi >= 18.5 && bmi <= 24.9) {
        guidanceValue = 'Maintain current weight';
        guidanceNote = 'You are already in a healthy range';
    } else if (diff > 0) {
        guidanceValue = `Gain ${diff} kg`;
        guidanceNote = 'Slow, healthy weight gain recommended';
    } else {
        guidanceValue = `Lose ${Math.abs(diff)} kg`;
        guidanceNote = 'Gradual fat loss recommended';
    }

    const weekly =
        activeMode === 'gain' ? 0.3 :
        activeMode === 'lose' ? -0.4 : 0;

    const progress = [];
    for (let i = 0; i < 8; i++) {
        progress.push({
            week: i + 1,
            weight: +(weight + weekly * i).toFixed(1)
        });
    }

    return {
        metrics: [
            { label: 'Current Weight', value: `${weight} kg`, change: `Weekly ${weekly} kg` },
            { label: 'BMI', value: bmi, change: 'Healthy range: 18.5–24.9' },
            { label: 'Weight guidance', value: guidanceValue, change: guidanceNote }
        ],
        charts: { weight_progress: progress }
    };
}

/* ---------------- API ---------------- */
app.post('/api/coach', async (req, res) => {
    const weight = Number(req.body.weight);
    const height = Number(req.body.height);
    const goal = req.body.goal;

    const bmi = +(weight / ((height / 100) ** 2)).toFixed(1);

    let activeMode = goal;
    let infoMessage = '';

    if (bmi < 18.5) {
        activeMode = 'gain';
        infoMessage = 'You are underweight. Healthy weight gain is recommended.';
    } else if (bmi <= 24.9) {
        activeMode = goal === 'lose' || goal === 'gain' ? 'maintain' : goal;
        infoMessage = 'Your weight is healthy. Maintaining is best.';
    } else {
        activeMode = 'lose';
        infoMessage = 'Gradual fat loss is recommended for better health.';
    }

    const workout = JSON.parse(JSON.stringify(planTemplates[activeMode]));
    for (const day of workout) {
        for (const ex of day.exercises) {
            ex.link_id = await fetchYouTubeVideoId(`${ex.name} exercise`);
        }
    }

  /* 3️⃣ CORRECT NUTRITION LOGIC (FIX) */
    const h = height / 100;
    const idealWeight = +(22 * h * h).toFixed(1);

    let calories = idealWeight * 33; // maintenance

    if (activeMode === 'gain') calories += 300;
    if (activeMode === 'lose') calories -= 400;

    calories = Math.round(calories);

    const protein = Math.round(idealWeight * 1.2);

    res.json({
        info_message: infoMessage,
        workout_plan: workout,
        nutrition_plan: {
            daily_target_calories: calories,
            protein_target_g: protein,
            meals: [
                {
                    name: 'Breakfast',
                    calories: Math.round(calories * 0.3),
                    protein_g: Math.round(protein * 0.3),
                    items: ['Eggs', 'Oats'],
                    explanation: 'Energy to start the day.'
                },
                {
                    name: 'Lunch',
                    calories: Math.round(calories * 0.4),
                    protein_g: Math.round(protein * 0.4),
                    items: ['Rice', 'Protein'],
                    explanation: 'Main recovery meal.'
                },
                {
                    name: 'Dinner',
                    calories: Math.round(calories * 0.3),
                    protein_g: Math.round(protein * 0.3),
                    items: ['Paneer', 'Vegetables'],
                    explanation: 'Light and protein-rich.'
                }
            ]
        },
        dashboard_data: getDashboardData(activeMode, weight, height)
    });
});

/* ---------------- START SERVER ---------------- */
app.listen(PORT, () =>
    console.log(`✅ Server running at http://localhost:${PORT}`)
);

