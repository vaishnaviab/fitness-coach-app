// script.js
const form = document.getElementById('user-input-form');
const generateButton = document.querySelector('.primary-btn');
const onboardingScreen = document.getElementById('onboarding-screen');
const resultsScreen = document.getElementById('results-screen');
const workoutPlanContainer = document.getElementById('workout-plan-container');
const nutritionPlanContainer = document.getElementById('nutrition-plan-container');
const trackingCardsContainer = document.getElementById('tracking-cards-container');
const backBtn = document.getElementById('back-btn');
const regenerateBtn = document.getElementById('regenerate-btn');

let weightChartInstance = null;
let lastUserData = null;

// Utility: switch views
function switchScreen(showId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  document.getElementById(showId).classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Submit handler
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const userData = {
    height: document.getElementById('height').value,
    weight: document.getElementById('weight').value,
    goal: document.getElementById('goal').value
  };
  lastUserData = userData;
  await requestPlan(userData);
});

// Regenerate button (calls same API again)
regenerateBtn.addEventListener('click', async () => {
  if (!lastUserData) return alert('No previous data found. Please generate the plan first.');
  await requestPlan(lastUserData);
});

// Back button
backBtn.addEventListener('click', () => {
  switchScreen('onboarding-screen');
});

// Request plan from server
async function requestPlan(userData) {
  try {
    generateButton.textContent = 'Generating...';
    generateButton.disabled = true;
    switchScreen('results-screen'); // show results area while loading
    // option: show a temporary "loading" text
    workoutPlanContainer.innerHTML = '<div class="plan-card">Loading plan…</div>';

    const res = await fetch('/api/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    if (!res.ok) throw new Error('Server returned ' + res.status);

    const plan = await res.json();
    renderWorkoutPlan(plan.workout_plan);
    renderNutritionPlan(plan.nutrition_plan);
    renderDashboard(plan.dashboard_data);
  } catch (err) {
    console.error('Could not generate plan:', err);
    alert('Could not generate plan. Please check the server console.');
    switchScreen('onboarding-screen');
  } finally {
    generateButton.textContent = 'Generate My Plan';
    generateButton.disabled = false;
  }
}

// Rendering
function renderWorkoutPlan(plan) {
  if (!workoutPlanContainer) return;
  workoutPlanContainer.innerHTML = plan.map(day => `
    <div class="plan-card">
      <h3>${day.day} — ${day.focus} (${day.duration_min} min)</h3>
      ${day.exercises.map(ex => `
        <div class="exercise-item">
          <strong>${ex.name}</strong>
          <div>${ex.sets} sets • ${ex.reps} • Rest ${ex.rest_s}s</div>
          <div><a href="https://www.youtube.com/watch?v=${ex.link_id}" target="_blank" rel="noopener">Watch demo</a></div>
        </div>
      `).join('')}
    </div>
  `).join('');
}

function renderNutritionPlan(nutrition) {
  if (!nutritionPlanContainer) return;
  let html = `<div class="plan-card"><p><strong>Target Calories:</strong> ${nutrition.daily_target_calories} kcal/day</p>`;
  html += nutrition.meals.map(m => `
    <div style="margin-top:8px;">
      <strong>${m.name}</strong> — ${m.calories} kcal
      <div>Protein: ${m.protein_g}g • Carbs: ${m.carbs_g}g • Fats: ${m.fats_g}g</div>
      <ul>${m.items.map(i => `<li>${i}</li>`).join('')}</ul>
    </div>
  `).join('');
  html += `</div>`;
  nutritionPlanContainer.innerHTML = html;
}

function renderDashboard(data) {
  if (!trackingCardsContainer) return;
  trackingCardsContainer.innerHTML = data.metrics.map(m => `
    <div class="metric-card">
      <div>${m.label}</div>
      <div style="font-weight:700;font-size:1.4rem">${m.value}</div>
      <div style="color:#666">${m.change}</div>
    </div>
  `).join('');
  drawWeightChart(data.charts.weight_progress);
}

function drawWeightChart(data) {
  const canvas = document.getElementById('weight-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const labels = data.map(d => `Week ${d.week}`);
  const values = data.map(d => d.weight);

  if (weightChartInstance) weightChartInstance.destroy();
  weightChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Weight (kg)',
        data: values,
        borderColor: '#FF6F00',
        backgroundColor: 'rgba(255,111,0,0.12)',
        tension: 0.35,
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } }
    }
  });
}