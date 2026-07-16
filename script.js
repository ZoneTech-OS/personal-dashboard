// Local store of our application's data state
let appState = {
    tasks: [],
    notes: ""
};

// DOM Elements
const taskForm = document.getElementById('task-form');
const emojiInput = document.getElementById('task-emoji');
const descInput = document.getElementById('task-desc');
const timeInput = document.getElementById('task-time');
const tasksList = document.getElementById('tasks-list');
const notesArea = document.getElementById('notes-area');
const saveNotesBtn = document.getElementById('save-notes-btn');

// 1. Fetch data from Python backend on startup
async function loadData() {
    try {
        const response = await fetch('/api/data');
        const data = await response.json();
        appState.tasks = data.tasks || [];
        appState.notes = data.notes || "";
        
        // Populate inputs and UI
        notesArea.value = appState.notes;
        renderTasks();
    } catch (error) {
        console.error("Could not load data from local server:", error);
    }
}

// 2. Send current data state back to Flask to write to data.json
async function saveToServer() {
    try {
        const response = await fetch('/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appState)
        });
        const result = await response.json();
        console.log(result.message);
    } catch (error) {
        console.error("Error saving data to local server:", error);
    }
}

// 3. Render tasks to screen
function renderTasks() {
    tasksList.innerHTML = '';
    
    // Sort tasks chronologically by scheduled date/time
    const sortedTasks = [...appState.tasks].sort((a, b) => new Date(a.time) - new Date(b.time));

    sortedTasks.forEach((task) => {
        const taskEl = document.createElement('div');
        taskEl.className = 'task-item';
        
        // Format date and time beautifully
        const taskDate = new Date(task.time);
        const formattedTime = taskDate.toLocaleString([], { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        taskEl.innerHTML = `
            <div class="task-content">
                <span style="font-size: 1.5rem;">${task.emoji || '🎯'}</span>
                <div class="task-details">
                    <span>${task.description}</span>
                    <span class="task-time">⏰ ${formattedTime}</span>
                </div>
            </div>
            <button class="delete-btn" onclick="deleteTask('${task.id}')">✕</button>
        `;
        tasksList.appendChild(taskEl);
    });
}

// 4. Handle Task Addition
taskForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const newTask = {
        id: Date.now().toString(), // Quick unique ID generator
        emoji: emojiInput.value.trim() || "🎯",
        description: descInput.value.trim(),
        time: timeInput.value
    };

    appState.tasks.push(newTask);
    
    // Reset Form inputs except emoji back to default placeholder
    descInput.value = '';
    timeInput.value = '';
    emojiInput.value = '🎯';

    renderTasks();
    saveToServer();
});

// 5. Handle Task Deletion
window.deleteTask = function(taskId) {
    appState.tasks = appState.tasks.filter(task => task.id !== taskId);
    renderTasks();
    saveToServer();
};

// 6. Handle Notes Saving
saveNotesBtn.addEventListener('click', () => {
    appState.notes = notesArea.value;
    saveToServer();
    
    // Visual button feedback
    const originalText = saveNotesBtn.innerText;
    saveNotesBtn.innerText = "💾 Saved!";
    saveNotesBtn.style.backgroundColor = "#059669";
    setTimeout(() => {
        saveNotesBtn.innerText = originalText;
        saveNotesBtn.style.backgroundColor = "";
    }, 1500);
});

// Run load sequence on page startup
loadData();