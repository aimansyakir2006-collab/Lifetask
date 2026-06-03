document.addEventListener('DOMContentLoaded', () => {
    // Core Elements
    const taskInput = document.getElementById('taskInput');
    const taskPriority = document.getElementById('taskPriority');
    const taskCategory = document.getElementById('taskCategory');
    const taskDueDate = document.getElementById('taskDueDate');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    
    // Stats & Progress Elements
    const totalTasksSpan = document.getElementById('totalTasks');
    const completedTasksSpan = document.getElementById('completedTasks');
    const progressPercentage = document.getElementById('progressPercentage');
    const progressBar = document.getElementById('progressBar');
    
    // Search & Filters Elements
    const searchInput = document.getElementById('searchInput');
    const filterTabs = document.querySelectorAll('.filter-tab');
    const clearCompletedBtn = document.getElementById('clearCompletedBtn');

    // State
    let tasks = JSON.parse(localStorage.getItem('lifetasks')) || [];
    let currentFilter = 'all'; // 'all', 'active', 'completed'
    let searchQuery = '';

    // Initialize app
    renderTasks();

    // Event Listeners
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });

    // Search input event
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderTasks();
    });

    // Filter tabs events
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.getAttribute('data-filter');
            renderTasks();
        });
    });

    // Clear completed event
    clearCompletedBtn.addEventListener('click', () => {
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        renderTasks();
    });

    function addTask() {
        const text = taskInput.value.trim();
        if (text === '') return;

        const priority = taskPriority.value;
        const category = taskCategory.value;
        const dueDate = taskDueDate.value || null;

        const newTask = {
            id: Date.now(),
            text: text,
            completed: false,
            priority: priority,
            category: category,
            dueDate: dueDate,
            isEditing: false
        };

        tasks.push(newTask);
        saveTasks();
        renderTasks();
        
        // Reset Inputs
        taskInput.value = '';
        taskPriority.value = 'medium';
        taskCategory.value = 'general';
        taskDueDate.value = '';
    }

    function toggleTask(id) {
        tasks = tasks.map(task => 
            task.id === id ? { ...task, completed: !task.completed } : task
        );
        saveTasks();
        renderTasks();
    }

    function deleteTask(id) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
    }

    function enableEditMode(id) {
        tasks = tasks.map(task => 
            task.id === id ? { ...task, isEditing: true } : { ...task, isEditing: false }
        );
        renderTasks();
    }

    function cancelEditMode(id) {
        tasks = tasks.map(task => 
            task.id === id ? { ...task, isEditing: false } : task
        );
        renderTasks();
    }

    function saveEdit(id, newText, newPriority, newCategory, newDueDate) {
        if (newText.trim() === '') return;
        tasks = tasks.map(task => 
            task.id === id ? { 
                ...task, 
                text: newText.trim(), 
                priority: newPriority, 
                category: newCategory, 
                dueDate: newDueDate, 
                isEditing: false 
            } : task
        );
        saveTasks();
        renderTasks();
    }

    function saveTasks() {
        localStorage.setItem('lifetasks', JSON.stringify(tasks));
    }

    function updateStatsAndProgress() {
        const total = tasks.length;
        const completed = tasks.filter(task => task.completed).length;
        
        totalTasksSpan.textContent = total;
        completedTasksSpan.textContent = completed;

        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        progressPercentage.textContent = `${percentage}%`;
        progressBar.style.width = `${percentage}%`;
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return new Date(dateStr).toLocaleDateString('en-US', options);
    }

    function isOverdue(dateStr) {
        if (!dateStr) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(dateStr);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today;
    }

    function renderTasks() {
        // Clear current list
        taskList.innerHTML = '';

        // 1. Filter tasks
        let filteredTasks = tasks.filter(task => {
            if (currentFilter === 'active') return !task.completed;
            if (currentFilter === 'completed') return task.completed;
            return true;
        });

        // 2. Search filter
        if (searchQuery) {
            filteredTasks = filteredTasks.filter(task => 
                task.text.toLowerCase().includes(searchQuery)
            );
        }

        // 3. Render items
        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            if (task.completed) {
                li.classList.add('completed');
            }

            if (task.isEditing) {
                // Editing layout
                li.classList.add('editing-item');

                const editForm = document.createElement('div');
                editForm.classList.add('edit-form-container');

                // Row 1: Text input
                const textRow = document.createElement('div');
                textRow.classList.add('edit-form-row');
                
                const editInput = document.createElement('input');
                editInput.type = 'text';
                editInput.value = task.text;
                editInput.classList.add('edit-input');
                textRow.appendChild(editInput);
                editForm.appendChild(textRow);

                // Row 2: Options inputs
                const optionsRow = document.createElement('div');
                optionsRow.classList.add('edit-options-row');

                // Priority Select
                const priorityField = document.createElement('div');
                priorityField.classList.add('edit-field');
                const priorityLabel = document.createElement('label');
                priorityLabel.textContent = 'Priority';
                
                const editPriority = document.createElement('select');
                ['low', 'medium', 'high'].forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p;
                    opt.textContent = p.charAt(0).toUpperCase() + p.slice(1);
                    if (p === task.priority) opt.selected = true;
                    editPriority.appendChild(opt);
                });
                priorityField.appendChild(priorityLabel);
                priorityField.appendChild(editPriority);
                optionsRow.appendChild(priorityField);

                // Category Select
                const categoryField = document.createElement('div');
                categoryField.classList.add('edit-field');
                const categoryLabel = document.createElement('label');
                categoryLabel.textContent = 'Category';
                
                const editCategory = document.createElement('select');
                const categories = [
                    { value: 'general', text: 'General' },
                    { value: 'study', text: '🎓 Study' },
                    { value: 'work', text: '💼 Work' },
                    { value: 'personal', text: '🏠 Personal' },
                    { value: 'health', text: '🏃‍♂️ Health' }
                ];
                categories.forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c.value;
                    opt.textContent = c.text;
                    if (c.value === task.category) opt.selected = true;
                    editCategory.appendChild(opt);
                });
                categoryField.appendChild(categoryLabel);
                categoryField.appendChild(editCategory);
                optionsRow.appendChild(categoryField);

                // Due Date Datepicker
                const dateField = document.createElement('div');
                dateField.classList.add('edit-field');
                const dateLabel = document.createElement('label');
                dateLabel.textContent = 'Due Date';
                
                const editDueDate = document.createElement('input');
                editDueDate.type = 'date';
                editDueDate.value = task.dueDate || '';
                
                dateField.appendChild(dateLabel);
                dateField.appendChild(editDueDate);
                optionsRow.appendChild(dateField);

                editForm.appendChild(optionsRow);

                // Row 3: Action Buttons
                const actionsRow = document.createElement('div');
                actionsRow.classList.add('edit-actions-row');

                const saveBtn = document.createElement('button');
                saveBtn.classList.add('save-btn');
                saveBtn.textContent = 'Save';
                saveBtn.onclick = () => saveEdit(task.id, editInput.value, editPriority.value, editCategory.value, editDueDate.value || null);

                const cancelBtn = document.createElement('button');
                cancelBtn.classList.add('cancel-btn');
                cancelBtn.textContent = 'Cancel';
                cancelBtn.onclick = () => cancelEditMode(task.id);

                actionsRow.appendChild(saveBtn);
                actionsRow.appendChild(cancelBtn);
                editForm.appendChild(actionsRow);

                // Save on Enter inside text input
                editInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        saveEdit(task.id, editInput.value, editPriority.value, editCategory.value, editDueDate.value || null);
                    }
                });

                li.appendChild(editForm);
            } else {
                // Regular task display layout
                
                // Task Content Wrapper
                const taskContent = document.createElement('div');
                taskContent.classList.add('task-content');
                taskContent.onclick = () => toggleTask(task.id);

                // Checkbox visual
                const checkbox = document.createElement('div');
                checkbox.classList.add('checkbox');

                // Text & Meta Container
                const textContainer = document.createElement('div');
                textContainer.classList.add('task-text-container');

                // Task Text
                const span = document.createElement('span');
                span.classList.add('task-text');
                span.textContent = task.text;
                textContainer.appendChild(span);

                // Meta Info Row (Badges)
                const metaRow = document.createElement('div');
                metaRow.classList.add('task-meta-row');

                // Priority Badge
                const priorityBadge = document.createElement('span');
                priorityBadge.classList.add('badge', `badge-priority-${task.priority}`);
                priorityBadge.textContent = task.priority;
                metaRow.appendChild(priorityBadge);

                // Category Badge
                if (task.category && task.category !== 'general') {
                    const categoryBadge = document.createElement('span');
                    categoryBadge.classList.add('badge', 'badge-category');
                    
                    let catName = task.category;
                    if (catName === 'study') catName = '🎓 Study';
                    else if (catName === 'work') catName = '💼 Work';
                    else if (catName === 'personal') catName = '🏠 Personal';
                    else if (catName === 'health') catName = '🏃‍♂️ Health';
                    
                    categoryBadge.textContent = catName;
                    metaRow.appendChild(categoryBadge);
                }

                // Due Date Badge
                if (task.dueDate) {
                    const dateBadge = document.createElement('span');
                    dateBadge.classList.add('badge', 'badge-date');
                    
                    const overdue = isOverdue(task.dueDate) && !task.completed;
                    if (overdue) {
                        dateBadge.classList.add('overdue');
                        dateBadge.textContent = `⚠️ Overdue: ${formatDate(task.dueDate)}`;
                    } else {
                        dateBadge.textContent = `📅 Due: ${formatDate(task.dueDate)}`;
                    }
                    metaRow.appendChild(dateBadge);
                }

                textContainer.appendChild(metaRow);

                taskContent.appendChild(checkbox);
                taskContent.appendChild(textContainer);

                // Task Actions (Edit / Delete)
                const actionsDiv = document.createElement('div');
                actionsDiv.classList.add('task-actions');

                // Edit Button
                const editBtn = document.createElement('button');
                editBtn.classList.add('edit-btn');
                editBtn.textContent = 'Edit';
                editBtn.onclick = (e) => {
                    e.stopPropagation();
                    enableEditMode(task.id);
                };

                // Delete Button
                const deleteBtn = document.createElement('button');
                deleteBtn.classList.add('delete-btn');
                deleteBtn.textContent = 'Delete';
                deleteBtn.onclick = (e) => {
                    e.stopPropagation(); // Prevent triggering toggleTask
                    deleteTask(task.id);
                };

                actionsDiv.appendChild(editBtn);
                actionsDiv.appendChild(deleteBtn);

                li.appendChild(taskContent);
                li.appendChild(actionsDiv);
            }

            taskList.appendChild(li);
        });

        updateStatsAndProgress();
    }
});
