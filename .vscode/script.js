const taskForm = document.getElementById("taskForm");
const taskTitle = document.getElementById("taskTitle");
const taskDescription = document.getElementById("taskDescription");
const taskCategory = document.getElementById("taskCategory");
const taskPriority = document.getElementById("taskPriority");
const taskDate = document.getElementById("taskDate");
const editId = document.getElementById("editId");
const taskList = document.getElementById("taskList");

const submitBtn = document.getElementById("submitBtn");
const cancelEdit = document.getElementById("cancelEdit");
const formHeading = document.getElementById("formHeading");
const searchInput = document.getElementById("searchInput");
const emptyMessage = document.getElementById("emptyMessage");

const STORAGE_KEY = "taskflow.tasks.v1";

let tasks = loadTasks();
let currentFilter = "all";

// Load saved tasks from Local Storage
function loadTasks() {
    try {
        const savedTasks = JSON.parse(
            localStorage.getItem(STORAGE_KEY)
        );

        return Array.isArray(savedTasks)
            ? savedTasks.filter(task =>
                task &&
                typeof task.id === "string" &&
                typeof task.title === "string"
            )
            : [];
    } catch {
        return [];
    }
}

// Save tasks to Local Storage
function saveTasks() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(tasks)
    );
}

// Create a unique task ID
function createId() {
    if (window.crypto && window.crypto.randomUUID) {
        return window.crypto.randomUUID();
    }

    return Date.now().toString() +
        Math.random().toString(16).slice(2);
}

// Add or update a task
taskForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const title = taskTitle.value.trim();

    if (!title) {
        alert("Please enter a task title.");
        return;
    }

    const taskData = {
        title: title,
        description: taskDescription.value.trim(),
        category: taskCategory.value,
        priority: taskPriority.value,
        date: taskDate.value
    };

    if (editId.value) {
        tasks = tasks.map(task => {
            if (task.id === editId.value) {
                return {
                    ...task,
                    ...taskData
                };
            }

            return task;
        });
    } else {
        tasks.unshift({
            id: createId(),
            ...taskData,
            completed: false,
            createdAt: new Date().toISOString()
        });
    }

    saveTasks();
    resetForm();
    renderTasks();
});

// Edit task
function editTask(id) {
    const task = tasks.find(task => task.id === id);

    if (!task) return;

    taskTitle.value = task.title;
    taskDescription.value = task.description;
    taskCategory.value = task.category;
    taskPriority.value = task.priority;
    taskDate.value = task.date;

    editId.value = task.id;

    formHeading.textContent = "Edit Task";
    submitBtn.textContent = "Update Task";
    cancelEdit.hidden = false;

    document.querySelector(".task-form-section")
        .scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
}

// Reset form
function resetForm() {
    taskForm.reset();
    editId.value = "";

    formHeading.textContent = "Add New Task";
    submitBtn.textContent = "Add Task";
    cancelEdit.hidden = true;
}

cancelEdit.addEventListener("click", resetForm);

// Delete task
function deleteTask(id) {
    const confirmed = confirm(
        "Are you sure you want to delete this task?"
    );

    if (!confirmed) return;

    tasks = tasks.filter(task => task.id !== id);

    if (editId.value === id) {
        resetForm();
    }

    saveTasks();
    renderTasks();
}

// Mark task completed or pending
function toggleTask(id) {
    tasks = tasks.map(task => {
        if (task.id === id) {
            return {
                ...task,
                completed: !task.completed
            };
        }

        return task;
    });

    saveTasks();
    renderTasks();
}

// Filter tasks
document.querySelectorAll(".filter-btn")
    .forEach(button => {
        button.addEventListener("click", function() {
            currentFilter = this.dataset.filter;

            document.querySelectorAll(".filter-btn")
                .forEach(btn => btn.classList.remove("active"));

            this.classList.add("active");

            renderTasks();
        });
    });

// Search tasks
searchInput.addEventListener("input", renderTasks);

// Clear completed tasks
document.getElementById("clearCompleted")
    .addEventListener("click", function() {
        const completedCount = tasks.filter(
            task => task.completed
        ).length;

        if (completedCount === 0) {
            alert("There are no completed tasks.");
            return;
        }

        if (!confirm("Delete all completed tasks?")) {
            return;
        }

        tasks = tasks.filter(task => !task.completed);

        if (!tasks.some(task => task.id === editId.value)) {
            resetForm();
        }

        saveTasks();
        renderTasks();
    });

// Create a safe HTML element
function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text !== undefined) {
        element.textContent = text;
    }

    return element;
}

// Render tasks
function renderTasks() {
    taskList.replaceChildren();

    const searchText = searchInput.value.toLowerCase().trim();

    let filteredTasks = tasks.filter(task => {
        const matchesSearch =
            task.title.toLowerCase().includes(searchText) ||
            (task.description || "").toLowerCase().includes(searchText) ||
            (task.category || "").toLowerCase().includes(searchText);

        const matchesFilter =
            currentFilter === "all" ||
            (currentFilter === "completed" && task.completed) ||
            (currentFilter === "pending" && !task.completed);

        return matchesSearch && matchesFilter;
    });

    filteredTasks.forEach(task => {
        const card = createElement(
            "article",
            "task-card" + (task.completed ? " completed" : "")
        );

        const top = createElement("div", "task-top");

        const checkbox = createElement("input", "task-checkbox");
        checkbox.type = "checkbox";
        checkbox.checked = task.completed;
        checkbox.setAttribute("aria-label", "Mark task completed");
        checkbox.addEventListener("change", () => toggleTask(task.id));

        const content = createElement("div", "task-content");

        const title = createElement("div", "task-title", task.title);
        content.appendChild(title);

        if (task.description) {
            content.appendChild(
                createElement("p", "task-description", task.description)
            );
        }

        top.append(checkbox, content);
        card.appendChild(top);

        const meta = createElement("div", "task-meta");

        meta.appendChild(createElement("span", "tag", task.category));

        const priorityClass = {
            High: "priority-high",
            Medium: "priority-medium",
            Low: "priority-low"
        }[task.priority] || "priority-medium";

        meta.appendChild(
            createElement("span", "tag " + priorityClass,
                (task.priority || "Medium") + " Priority")
        );

        if (task.date) {
            meta.appendChild(
                createElement("span", "tag task-date", "Due: " + task.date)
            );
        }

        card.appendChild(meta);

        const actions = createElement("div", "task-actions");

        const editButton = createElement("button", "edit-btn", "Edit");
        editButton.type = "button";
        editButton.addEventListener("click", () => editTask(task.id));

        const deleteButton = createElement("button", "delete-btn", "Delete");
        deleteButton.type = "button";
        deleteButton.addEventListener("click", () => deleteTask(task.id));

        actions.append(editButton, deleteButton);
        card.appendChild(actions);

        taskList.appendChild(card);
    });

    emptyMessage.style.display =
        filteredTasks.length === 0 ? "block" : "none";

    updateStatistics();
}

// Update dashboard statistics
function updateStatistics() {
    const total = tasks.length;

    const completed = tasks.filter(
        task => task.completed
    ).length;

    const pending = total - completed;

    const percentage = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    document.getElementById("totalTasks").textContent = total;
    document.getElementById("completedTasks").textContent = completed;
    document.getElementById("pendingTasks").textContent = pending;

    document.getElementById("progressText").textContent =
        percentage + "%";

    document.getElementById("progressBar").style.width =
        percentage + "%";
}

// Initial display
renderTasks();