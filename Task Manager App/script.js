 const input = document.getElementById('task-input');
        const addButton = document.getElementById('add-task');
        const taskList = document.getElementById('task-list');
        const taskDate = document.getElementById('task-date');
        const taskPriority = document.getElementById('task-priority');
        const sortTasksSelect = document.getElementById('sort-tasks');
        const filterButtons = document.querySelectorAll('.filter-btn');
        const themeToggle = document.getElementById('theme-toggle');
        const sunIcon = document.getElementById('sun-icon');
        const moonIcon = document.getElementById('moon-icon');

        let tasks = [];
        let currentFilter = 'all';
        let editingIndex = null;

        // Theme toggle functionality
        function toggleTheme() {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');

            sunIcon.style.display = isDark ? 'none' : 'block';
            moonIcon.style.display = isDark ? 'block' : 'none';

            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        }

        // Load saved theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        }

        themeToggle.addEventListener('click', toggleTheme);

        function updateStats() {
            const total = tasks.length;
            const completed = tasks.filter(t => t.completed).length;
            const pending = total - completed;

            document.getElementById('total-count').textContent = total;
            document.getElementById('pending-count').textContent = pending;
            document.getElementById('completed-count').textContent = completed;
        }

        function renderTasks() {
            taskList.innerHTML = '';
            let displayTasks = tasks;

            if (currentFilter === 'completed') displayTasks = tasks.filter(t => t.completed);
            if (currentFilter === 'pending') displayTasks = tasks.filter(t => !t.completed);

            const sortValue = sortTasksSelect.value;
            if (sortValue === 'date') {
                displayTasks.sort((a, b) => {
                    if (!a.date) return 1;
                    if (!b.date) return -1;
                    return new Date(a.date) - new Date(b.date);
                });
            }
            if (sortValue === 'priority') {
                const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
                displayTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
            }
            if (sortValue === 'status') displayTasks.sort((a, b) => a.completed - b.completed);

            if (displayTasks.length === 0) {
                taskList.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M9 11l3 3L22 4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <h3>${currentFilter === 'completed' ? 'No completed tasks yet' : currentFilter === 'pending' ? 'No pending tasks' : 'No tasks yet'}</h3>
                    <p>${currentFilter === 'all' ? 'Add your first task to get started' : ''}</p>
                </div>
            `;
                return;
            }

            displayTasks.forEach((task, index) => {
                const actualIndex = tasks.indexOf(task);
                const li = document.createElement('li');
                li.className = `task-item ${task.completed ? 'completed' : ''} priority-${task.priority.toLowerCase()}`;
                li.draggable = true;
                li.dataset.index = actualIndex;

                li.innerHTML = `
                <div class="checkbox-wrapper" onclick="toggleComplete(${actualIndex})">
                    <div class="checkbox">
                        <svg viewBox="0 0 24 24">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                </div>
                <div class="task-content">
                    <div class="task-text">${task.text}</div>
                    <div class="task-meta">
                        ${task.date ? `
                        <span class="task-badge">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            ${formatDate(task.date)}
                        </span>` : ''}
                        <span class="task-badge priority-badge ${task.priority.toLowerCase()}">${task.priority}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="icon-btn edit" onclick="editTask(${actualIndex})" title="Edit">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="icon-btn delete" onclick="deleteTask(${actualIndex})" title="Delete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                        </svg>
                    </button>
                </div>
            `;
                taskList.appendChild(li);
            });

            updateStats();
        }

        function formatDate(dateStr) {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            if (date.toDateString() === today.toDateString()) return 'Today';
            if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

            const options = { month: 'short', day: 'numeric' };
            return date.toLocaleDateString('en-US', options);
        }

        function addTask() {
            const text = input.value.trim();
            if (text === '') {
                input.focus();
                return;
            }

            if (editingIndex !== null) {
                tasks[editingIndex].text = text;
                tasks[editingIndex].date = taskDate.value;
                tasks[editingIndex].priority = taskPriority.value;
                editingIndex = null;
                addButton.innerHTML = '<span>➕</span><span>Add Task</span>';
            } else {
                tasks.push({
                    text,
                    date: taskDate.value,
                    priority: taskPriority.value,
                    completed: false
                });
            }

            input.value = '';
            taskDate.value = '';
            taskPriority.value = 'Low';
            renderTasks();
        }

        function toggleComplete(index) {
            tasks[index].completed = !tasks[index].completed;
            renderTasks();
        }

        function deleteTask(index) {
            tasks.splice(index, 1);
            renderTasks();
        }

        function editTask(index) {
            input.value = tasks[index].text;
            taskDate.value = tasks[index].date;
            taskPriority.value = tasks[index].priority;
            editingIndex = index;
            addButton.innerHTML = '<span>✓</span><span>Update Task</span>';
            input.focus();
        }

        addButton.addEventListener('click', addTask);
        input.addEventListener('keypress', e => { if (e.key === 'Enter') addTask(); });
        sortTasksSelect.addEventListener('change', renderTasks);

        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.dataset.filter;
                renderTasks();
            });
        });

        let draggedIndex = null;
        taskList.addEventListener('dragstart', e => {
            const li = e.target.closest('.task-item');
            if (li) draggedIndex = parseInt(li.dataset.index);
        });

        taskList.addEventListener('dragover', e => {
            e.preventDefault();
            const li = e.target.closest('.task-item');
            if (li) li.style.borderColor = 'var(--primary)';
        });

        taskList.addEventListener('dragleave', e => {
            const li = e.target.closest('.task-item');
            if (li) li.style.borderColor = '';
        });

        taskList.addEventListener('drop', e => {
            e.preventDefault();
            const li = e.target.closest('.task-item');
            if (li) {
                li.style.borderColor = '';
                const targetIndex = parseInt(li.dataset.index);
                if (draggedIndex !== null && draggedIndex !== targetIndex) {
                    const [movedTask] = tasks.splice(draggedIndex, 1);
                    tasks.splice(targetIndex, 0, movedTask);
                    renderTasks();
                }
            }
        });

        renderTasks();