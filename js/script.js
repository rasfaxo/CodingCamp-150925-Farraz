class TodoApp {
  constructor() {
    this.tasks = JSON.parse(localStorage.getItem("todoTasks")) || [];
    this.currentFilter = { status: "all", category: "all", priority: "all" };
    this.currentSort = "date-desc";
    this.searchQuery = "";
    this.darkMode = JSON.parse(localStorage.getItem("darkMode")) || false;

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupDarkMode();
    this.renderTasks();
    this.updateStats();
    this.setupKeyboardShortcuts();
  }

  setupEventListeners() {
    // Form submission
    document.getElementById("taskForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.addTask();
    });

    // Edit form submission
    document.getElementById("editForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveEditTask();
    });

    // Search functionality
    document.getElementById("searchInput").addEventListener("input", (e) => {
      this.searchQuery = e.target.value.toLowerCase();
      this.renderTasks();
    });

    // Filter and sort buttons
    document.getElementById("filterBtn").addEventListener("click", () => {
      this.toggleFilterOptions();
    });

    document.getElementById("sortBtn").addEventListener("click", () => {
      this.toggleSortOptions();
    });

    // Filter options
    document.getElementById("statusFilter").addEventListener("change", (e) => {
      this.currentFilter.status = e.target.value;
      this.renderTasks();
    });

    document
      .getElementById("categoryFilter")
      .addEventListener("change", (e) => {
        this.currentFilter.category = e.target.value;
        this.renderTasks();
      });

    document
      .getElementById("priorityFilter")
      .addEventListener("change", (e) => {
        this.currentFilter.priority = e.target.value;
        this.renderTasks();
      });

    // Sort options
    document.querySelectorAll(".sort-option").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.currentSort = e.target.dataset.sort;
        this.renderTasks();
        this.updateSortButtons();
      });
    });

    // Delete all button
    document.getElementById("deleteAllBtn").addEventListener("click", () => {
      this.deleteAllCompleted();
    });

    // Dark mode toggle
    document.getElementById("darkModeToggle").addEventListener("click", () => {
      this.toggleDarkMode();
    });

    // Modal controls
    document.getElementById("cancelEdit").addEventListener("click", () => {
      this.closeEditModal();
    });

    // Close modal when clicking outside
    document.getElementById("editModal").addEventListener("click", (e) => {
      if (e.target.id === "editModal") {
        this.closeEditModal();
      }
    });
  }

  setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      // Ctrl+F for search
      if (e.ctrlKey && e.key === "f") {
        e.preventDefault();
        document.getElementById("searchInput").focus();
      }

      // Escape to close modal
      if (e.key === "Escape") {
        this.closeEditModal();
      }
    });
  }

  setupDarkMode() {
    if (this.darkMode) {
      document.documentElement.classList.add("dark");
    }
  }

  toggleDarkMode() {
    this.darkMode = !this.darkMode;
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("darkMode", JSON.stringify(this.darkMode));
  }

  addTask() {
    const taskInput = document.getElementById("taskInput");
    const taskDate = document.getElementById("taskDate");
    const taskCategory = document.getElementById("taskCategory");
    const taskPriority = document.getElementById("taskPriority");

    const task = {
      id: Date.now(),
      text: taskInput.value.trim(),
      date: taskDate.value || null,
      category: taskCategory.value,
      priority: taskPriority.value,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    this.tasks.push(task);
    this.saveTasks();
    this.renderTasks();
    this.updateStats();

    // Reset form
    taskInput.value = "";
    taskDate.value = "";
    taskCategory.value = "personal";
    taskPriority.value = "low";

    // Show success animation
    this.showNotification("Task added successfully!", "success");
  }

  editTask(id) {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return;

    document.getElementById("editTaskId").value = task.id;
    document.getElementById("editTaskText").value = task.text;
    document.getElementById("editTaskDate").value = task.date || "";
    document.getElementById("editTaskCategory").value = task.category;
    document.getElementById("editTaskPriority").value = task.priority;

    this.openEditModal();
  }

  saveEditTask() {
    const id = Number.parseInt(document.getElementById("editTaskId").value);
    const text = document.getElementById("editTaskText").value.trim();
    const date = document.getElementById("editTaskDate").value;
    const category = document.getElementById("editTaskCategory").value;
    const priority = document.getElementById("editTaskPriority").value;

    const taskIndex = this.tasks.findIndex((t) => t.id === id);
    if (taskIndex === -1) return;

    this.tasks[taskIndex] = {
      ...this.tasks[taskIndex],
      text,
      date: date || null,
      category,
      priority,
    };

    this.saveTasks();
    this.renderTasks();
    this.updateStats();
    this.closeEditModal();
    this.showNotification("Task updated successfully!", "success");
  }

  toggleTask(id) {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return;

    task.completed = !task.completed;
    this.saveTasks();
    this.renderTasks();
    this.updateStats();

    // Add completion animation
    const taskElement = document.querySelector(`[data-task-id="${id}"]`);
    if (taskElement) {
      taskElement.classList.add("task-completed");
      setTimeout(() => {
        taskElement.classList.remove("task-completed");
      }, 300);
    }

    const message = task.completed
      ? "Task completed!"
      : "Task marked as active!";
    this.showNotification(message, "success");
  }

  deleteTask(id) {
    if (confirm("Are you sure you want to delete this task?")) {
      this.tasks = this.tasks.filter((t) => t.id !== id);
      this.saveTasks();
      this.renderTasks();
      this.updateStats();
      this.showNotification("Task deleted successfully!", "success");
    }
  }

  deleteAllCompleted() {
    const completedTasks = this.tasks.filter((t) => t.completed);
    if (completedTasks.length === 0) {
      this.showNotification("No completed tasks to delete!", "warning");
      return;
    }

    if (
      confirm(
        `Are you sure you want to delete ${completedTasks.length} completed task(s)?`
      )
    ) {
      this.tasks = this.tasks.filter((t) => !t.completed);
      this.saveTasks();
      this.renderTasks();
      this.updateStats();
      this.showNotification(
        `${completedTasks.length} completed task(s) deleted!`,
        "success"
      );
    }
  }

  getFilteredTasks() {
    let filteredTasks = [...this.tasks];

    // Apply search filter
    if (this.searchQuery) {
      filteredTasks = filteredTasks.filter((task) =>
        task.text.toLowerCase().includes(this.searchQuery)
      );
    }

    // Apply status filter
    if (this.currentFilter.status !== "all") {
      filteredTasks = filteredTasks.filter((task) => {
        if (this.currentFilter.status === "completed") return task.completed;
        if (this.currentFilter.status === "active") return !task.completed;
        return true;
      });
    }

    // Apply category filter
    if (this.currentFilter.category !== "all") {
      filteredTasks = filteredTasks.filter(
        (task) => task.category === this.currentFilter.category
      );
    }

    // Apply priority filter
    if (this.currentFilter.priority !== "all") {
      filteredTasks = filteredTasks.filter(
        (task) => task.priority === this.currentFilter.priority
      );
    }

    // Apply sorting
    filteredTasks.sort((a, b) => {
      switch (this.currentSort) {
        case "date-asc":
          if (!a.date && !b.date) return 0;
          if (!a.date) return 1;
          if (!b.date) return -1;
          return new Date(a.date) - new Date(b.date);

        case "date-desc":
          if (!a.date && !b.date) return 0;
          if (!a.date) return 1;
          if (!b.date) return -1;
          return new Date(b.date) - new Date(a.date);

        case "priority":
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];

        case "category":
          return a.category.localeCompare(b.category);

        case "status":
          return a.completed - b.completed;

        default:
          return 0;
      }
    });

    return filteredTasks;
  }

  renderTasks() {
    const tasksList = document.getElementById("tasksList");
    const noTasks = document.getElementById("noTasks");
    const filteredTasks = this.getFilteredTasks();

    if (filteredTasks.length === 0) {
      if (noTasks) {
        noTasks.style.display = "block";
        tasksList.innerHTML = "";
        tasksList.appendChild(noTasks);
      } else {
        tasksList.innerHTML =
          '<div class="px-6 py-12 text-center text-gray-500 dark:text-gray-400">No tasks found</div>';
      }
      return;
    }

    if (noTasks) noTasks.style.display = "none";
    tasksList.innerHTML = "";

    filteredTasks.forEach((task) => {
      const taskElement = this.createTaskElement(task);
      tasksList.appendChild(taskElement);
    });
  }

  createTaskElement(task) {
    const taskDiv = document.createElement("div");
    taskDiv.className = `task-item px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors priority-${task.priority}`;
    taskDiv.setAttribute("data-task-id", task.id);

    const isOverdue =
      task.date && new Date(task.date) < new Date() && !task.completed;
    const dueDateClass = isOverdue
      ? "text-red-500"
      : "text-gray-600 dark:text-gray-400";

    taskDiv.innerHTML = `
            <div class="grid grid-cols-12 gap-4 items-center">
                <div class="col-span-5 flex items-center space-x-3">
                    <input 
                        type="checkbox" 
                        class="custom-checkbox" 
                        ${task.completed ? "checked" : ""} 
                        onchange="todoApp.toggleTask(${task.id})"
                    >
                    <div class="flex-1">
                        <p class="font-medium ${
                          task.completed
                            ? "line-through text-gray-500 dark:text-gray-400"
                            : "text-gray-900 dark:text-white"
                        }">
                            ${task.text}
                        </p>
                        <div class="flex items-center space-x-2 mt-1">
                            <span class="category-${
                              task.category
                            } text-white text-xs px-2 py-1 rounded-full font-medium">
                                ${
                                  task.category.charAt(0).toUpperCase() +
                                  task.category.slice(1)
                                }
                            </span>
                            <span class="text-xs px-2 py-1 rounded-full font-medium ${this.getPriorityClass(
                              task.priority
                            )}">
                                ${
                                  task.priority.charAt(0).toUpperCase() +
                                  task.priority.slice(1)
                                }
                            </span>
                        </div>
                    </div>
                </div>
                <div class="col-span-2">
                    <p class="text-sm ${dueDateClass}">
                        ${
                          task.date ? this.formatDate(task.date) : "No due date"
                        }
                        ${
                          isOverdue
                            ? '<br><span class="text-xs text-red-500 font-medium">Overdue</span>'
                            : ""
                        }
                    </p>
                </div>
                <div class="col-span-2">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      task.completed
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                    }">
                        <i class="fas ${
                          task.completed ? "fa-check-circle" : "fa-clock"
                        } mr-1"></i>
                        ${task.completed ? "Completed" : "Pending"}
                    </span>
                </div>
                <div class="col-span-3 flex items-center space-x-2">
                    <button 
                        onclick="todoApp.editTask(${task.id})" 
                        class="btn-hover p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors"
                        title="Edit task"
                    >
                        <i class="fas fa-edit"></i>
                    </button>
                    <button 
                        onclick="todoApp.deleteTask(${task.id})" 
                        class="btn-hover p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
                        title="Delete task"
                    >
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;

    return taskDiv;
  }

  getPriorityClass(priority) {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  }

  updateStats() {
    const total = this.tasks.length;
    const completed = this.tasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    document.getElementById("totalTasks").textContent = total;
    document.getElementById("completedTasks").textContent = completed;
    document.getElementById("pendingTasks").textContent = pending;
    document.getElementById("progressPercentage").textContent = `${progress}%`;
  }

  toggleFilterOptions() {
    const filterOptions = document.getElementById("filterOptions");
    const sortOptions = document.getElementById("sortOptions");

    filterOptions.classList.toggle("hidden");
    sortOptions.classList.add("hidden");
  }

  toggleSortOptions() {
    const filterOptions = document.getElementById("filterOptions");
    const sortOptions = document.getElementById("sortOptions");

    sortOptions.classList.toggle("hidden");
    filterOptions.classList.add("hidden");
  }

  updateSortButtons() {
    document.querySelectorAll(".sort-option").forEach((btn) => {
      btn.classList.remove("bg-primary", "text-white");
      btn.classList.add(
        "bg-white",
        "dark:bg-gray-800",
        "text-gray-700",
        "dark:text-gray-300"
      );
    });

    const activeBtn = document.querySelector(
      `[data-sort="${this.currentSort}"]`
    );
    if (activeBtn) {
      activeBtn.classList.remove(
        "bg-white",
        "dark:bg-gray-800",
        "text-gray-700",
        "dark:text-gray-300"
      );
      activeBtn.classList.add("bg-primary", "text-white");
    }
  }

  openEditModal() {
    const modal = document.getElementById("editModal");
    modal.classList.remove("hidden");
    modal.classList.add("flex", "modal-enter");
    document.body.style.overflow = "hidden";
  }

  closeEditModal() {
    const modal = document.getElementById("editModal");
    modal.classList.add("hidden");
    modal.classList.remove("flex", "modal-enter");
    document.body.style.overflow = "auto";
  }

  showNotification(message, type = "info") {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium transform translate-x-full transition-transform duration-300 ${this.getNotificationClass(
      type
    )}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => {
      notification.classList.remove("translate-x-full");
    }, 100);

    // Hide notification after 3 seconds
    setTimeout(() => {
      notification.classList.add("translate-x-full");
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  getNotificationClass(type) {
    switch (type) {
      case "success":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      case "warning":
        return "bg-yellow-500";
      default:
        return "bg-blue-500";
    }
  }

  saveTasks() {
    localStorage.setItem("todoTasks", JSON.stringify(this.tasks));
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.todoApp = new TodoApp();
});

// Export for global access
window.TodoApp = TodoApp;
