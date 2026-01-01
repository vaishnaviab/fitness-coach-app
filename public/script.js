const form = document.getElementById('user-input-form');
const workoutPlanContainer = document.getElementById('workout-plan-container');
const nutritionPlanContainer = document.getElementById('nutrition-plan-container');
const trackingCardsContainer = document.getElementById('tracking-cards-container');
const bmiInfoCard = document.getElementById('bmi-info-card');

const backBtn = document.getElementById('back-btn');
const regenerateBtn = document.getElementById('regenerate-btn');
const themeToggle = document.getElementById('theme-toggle');

const heightInput = document.getElementById('height');
const weightInput = document.getElementById('weight');
const goalInput = document.getElementById('goal');

const heightError = document.getElementById('height-error');
const weightError = document.getElementById('weight-error');
const goalError = document.getElementById('goal-error');

let lastUserData = null;
let chartInstance = null;

/* THEME */
themeToggle.onclick = () => {
    document.body.classList.toggle('dark');
    themeToggle.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
};

/* VALIDATION */
function validate() {
    let ok = true;
    heightError.textContent = '';
    weightError.textContent = '';
    goalError.textContent = '';

    if (heightInput.value < 120 || heightInput.value > 230) {
        heightError.textContent = 'Height must be 120–230 cm';
        ok = false;
    }
    if (weightInput.value < 30 || weightInput.value > 250) {
        weightError.textContent = 'Weight must be 30–250 kg';
        ok = false;
    }
    if (!goalInput.value) {
        goalError.textContent = 'Select a goal';
        ok = false;
    }
    return ok;
}

/* FORM */
form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validate()) return;

    lastUserData = {
        height: heightInput.value,
        weight: weightInput.value,
        goal: goalInput.value
    };

    switchScreen('results-screen');
    await loadPlan(lastUserData);
});

backBtn.onclick = () => switchScreen('onboarding-screen');
regenerateBtn.onclick = async () => loadPlan(lastUserData);

function switchScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    window.scrollTo(0,0);
}

/* FETCH */
async function loadPlan(data) {
    const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    const plan = await res.json();

    bmiInfoCard.textContent = plan.info_message;
    bmiInfoCard.classList.remove('hidden');

    renderWorkout(plan.workout_plan);
    renderNutrition(plan.nutrition_plan);
    renderDashboard(plan.dashboard_data);
}

/* WORKOUT */
function renderWorkout(days) {
    workoutPlanContainer.innerHTML = days.map(d => `
        <div class="day-card">
            <div class="card-header">
                <strong>${d.day}</strong>
                <span class="duration-badge">⏱ ${d.duration_min} min</span>
            </div>
            <div class="card-details hidden">
                ${d.exercises.map(e => `
                    <div style="display:flex;justify-content:space-between;padding:6px 0">
                        <span>${e.name} (${e.sets}×${e.reps})</span>
                        <a target="_blank" href="https://youtube.com/watch?v=${e.link_id}">▶ Demo</a>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
    toggleCards('.day-card');
}

/* NUTRITION */
function renderNutrition(n) {
    nutritionPlanContainer.innerHTML = `
        <p style="color:var(--text-sub);margin-bottom:10px">
            Daily Target: ${n.daily_target_calories} kcal • ${n.protein_target_g}g protein
        </p>
        <div class="nutrition-row">
            ${n.meals.map(m => `
                <div class="nutrition-card day-card">
                    <div class="card-header">
                        <strong>${m.name}</strong>
                        <span class="duration-badge">${m.calories} kcal</span>
                    </div>
                    <div class="card-details hidden">
                        <p>Protein: ${m.protein_g}g</p>
                        <ul>${m.items.map(i => `<li>${i}</li>`).join('')}</ul>
                        <p style="font-size:0.85rem;color:var(--text-sub)">${m.explanation}</p>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    toggleCards('.nutrition-card');
}

/* DASHBOARD */
function renderDashboard(d) {
    trackingCardsContainer.innerHTML = d.metrics.map(m => `
        <div class="metric-card">
            <div class="metric-label">${m.label}</div>
            <div class="metric-value">${m.value}</div>
            <div class="metric-note">${m.change}</div>
        </div>
    `).join('');
    drawChart(d.charts.weight_progress);
}

/* CHART */
function drawChart(data) {
    const ctx = document.getElementById('weight-chart');
    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => `Week ${d.week}`),
            datasets: [{
                data: data.map(d => d.weight),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59,130,246,0.2)',
                fill: true,
                tension: 0.4
            }]
        },
        options: { plugins: { legend: { display: false } } }
    });
}

/* TOGGLE */
function toggleCards(selector) {
    document.querySelectorAll(selector).forEach(c => {
        c.onclick = () => c.querySelector('.card-details').classList.toggle('hidden');
    });
}
