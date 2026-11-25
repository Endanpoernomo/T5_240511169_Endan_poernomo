(() => {
  const STORAGE_KEY = "tugasku_todos_v1";
  const THEME_KEY = "tugasku_theme_v1";

  // State Aplikasi
  let todos = loadTodos();
  let filterStatus = "semua";
  let filterPriority = "semua";
  let sortBy = "terbaru";
  let searchQuery = "";
  let editingId = null;

  // Referensi Elemen DOM
  const todoForm = document.getElementById("todoForm");
  const todoInput = document.getElementById("todoInput");
  const priorityInput = document.getElementById("priorityInput");
  const dueDateInput = document.getElementById("dueDateInput");
  const searchInput = document.getElementById("searchInput");
  const tabButtons = document.querySelectorAll(".tab-btn");
  const priorityFilter = document.getElementById("priorityFilter");
  const sortSelect = document.getElementById("sortSelect");
  const todoList = document.getElementById("todoList");
  const emptyState = document.getElementById("emptyState");
  const emptyTitle = document.getElementById("emptyTitle");
  const emptyDesc = document.getElementById("emptyDesc");
  const loadSampleBtn = document.getElementById("loadSampleBtn");
  const totalCount = document.getElementById("totalCount");
  const activeCount = document.getElementById("activeCount");
  const completedCount = document.getElementById("completedCount");
  const clearCompletedBtn = document.getElementById("clearCompletedBtn");
  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = document.getElementById("themeIcon");

  // Inisialisasi Tema & Render Awal
  initTheme();
  render();

  // Event Listeners
  todoForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = todoInput.value.trim();
    if (!text) return;

    const newTodo = {
      id: Date.now().toString(),
      text,
      completed: false,
      priority: priorityInput.value,
      dueDate: dueDateInput.value || null,
      createdAt: Date.now(),
    };

    todos.unshift(newTodo);
    saveTodos();
    todoInput.value = "";
    dueDateInput.value = "";
    priorityInput.value = "sedang";
    todoInput.focus();
    render();
  });

  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    render();
  });

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      filterStatus = btn.dataset.filter;
      render();
    });
  });

  priorityFilter.addEventListener("change", (e) => {
    filterPriority = e.target.value;
    render();
  });

  sortSelect.addEventListener("change", (e) => {
    sortBy = e.target.value;
    render();
  });

  clearCompletedBtn.addEventListener("click", () => {
    todos = todos.filter((todo) => !todo.completed);
    saveTodos();
    render();
  });

  loadSampleBtn.addEventListener("click", () => {
    const today = new Date();
    const formatDateOffset = (days) => {
      const d = new Date(today);
      d.setDate(d.getDate() + days);
      return d.toISOString().split("T")[0];
    };

    todos = [
      {
        id: "sample-1",
        text: "Finalisasi presentasi proyek & cek demo aplikasi",
        completed: false,
        priority: "tinggi",
        dueDate: formatDateOffset(0),
        createdAt: Date.now() - 1000,
      },
      {
        id: "sample-2",
        text: "Revisi dokumentasi laporan Bab 4",
        completed: false,
        priority: "tinggi",
        dueDate: formatDateOffset(-1), // Contoh tenggat terlewat
        createdAt: Date.now() - 2000,
      },
      {
        id: "sample-3",
        text: "Rapikan struktur folder & push pembaruan ke GitHub",
        completed: false,
        priority: "sedang",
        dueDate: formatDateOffset(2),
        createdAt: Date.now() - 3000,
      },
      {
        id: "sample-4",
        text: "Backup database lokal dan catat kredensial pengujian",
        completed: true,
        priority: "rendah",
        dueDate: null,
        createdAt: Date.now() - 4000,
      },
    ];

    saveTodos();
    render();
  });

  themeToggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
  });

  // Fungsi Utama Render
  function render() {
    const filtered = getFilteredAndSortedTodos();
    todoList.innerHTML = "";

    // Update Statistik
    const total = todos.length;
    const completed = todos.filter((t) => t.completed).length;
    const active = total - completed;

    totalCount.textContent = total;
    activeCount.textContent = active;
    completedCount.textContent = completed;
    clearCompletedBtn.disabled = completed === 0;

    // Tangani Empty State
    if (filtered.length === 0) {
      emptyState.classList.remove("hidden");
      if (todos.length === 0) {
        emptyTitle.textContent = "Belum ada tugas";
        emptyDesc.textContent =
          "Tambahkan tugas pertamamu di atas atau muat contoh tugas untuk mencoba fitur.";
        loadSampleBtn.classList.remove("hidden");
      } else {
        emptyTitle.textContent = "Tidak ada tugas yang cocok";
        emptyDesc.textContent =
          "Coba ubah kata kunci pencarian atau filter status/prioritas.";
        loadSampleBtn.classList.add("hidden");
      }
      return;
    }

    emptyState.classList.add("hidden");

    // Render Item Tugas
    filtered.forEach((todo) => {
      const li = document.createElement("li");
      li.className = `todo-item${todo.completed ? " completed" : ""}`;
      li.dataset.id = todo.id;

      const leftDiv = document.createElement("div");
      leftDiv.className = "todo-left";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "todo-checkbox";
      checkbox.checked = todo.completed;
      checkbox.setAttribute("aria-label", `Tandai "${todo.text}" selesai`);
      checkbox.addEventListener("change", () => toggleTodo(todo.id));

      const contentDiv = document.createElement("div");
      contentDiv.className = "todo-content";

      if (editingId === todo.id) {
        const editInput = document.createElement("input");
        editInput.type = "text";
        editInput.className = "edit-input";
        editInput.value = todo.text;

        const saveEdit = () => {
          const updatedText = editInput.value.trim();
          if (updatedText) {
            todo.text = updatedText;
            saveTodos();
          }
          editingId = null;
          render();
        };

        editInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") saveEdit();
          if (e.key === "Escape") {
            editingId = null;
            render();
          }
        });
        editInput.addEventListener("blur", saveEdit);

        contentDiv.appendChild(editInput);
        setTimeout(() => editInput.focus(), 0);
      } else {
        const textSpan = document.createElement("span");
        textSpan.className = "todo-text";
        textSpan.textContent = todo.text;
        textSpan.title = "Klik ganda untuk mengedit";
        textSpan.addEventListener("dblclick", () => startEdit(todo.id));
        contentDiv.appendChild(textSpan);
      }

      // Badge Prioritas & Tenggat
      const badgesDiv = document.createElement("div");
      badgesDiv.className = "todo-badges";

      const prioBadge = document.createElement("span");
      prioBadge.className = `badge badge-${todo.priority}`;
      prioBadge.textContent = capitalize(todo.priority);
      badgesDiv.appendChild(prioBadge);

      if (todo.dueDate) {
        const dueSpan = document.createElement("span");
        const overdue = isOverdue(todo.dueDate) && !todo.completed;
        dueSpan.className = `due-date${overdue ? " overdue" : ""}`;
        dueSpan.textContent = `📅 ${formatDateID(todo.dueDate)}${overdue ? " (Terlewat)" : ""}`;
        badgesDiv.appendChild(dueSpan);
      }

      contentDiv.appendChild(badgesDiv);
      leftDiv.append(checkbox, contentDiv);

      // Tombol Aksi Edit & Hapus
      const actionsDiv = document.createElement("div");
      actionsDiv.className = "todo-actions";

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "action-btn";
      editBtn.title = "Edit tugas";
      editBtn.setAttribute("aria-label", "Edit tugas");
      editBtn.textContent = "✏️";
      editBtn.addEventListener("click", () => startEdit(todo.id));

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "action-btn delete";
      deleteBtn.title = "Hapus tugas";
      deleteBtn.setAttribute("aria-label", "Hapus tugas");
      deleteBtn.textContent = "🗑️";
      deleteBtn.addEventListener("click", () =>
        deleteTodoWithAnimation(todo.id, li),
      );

      actionsDiv.append(editBtn, deleteBtn);
      li.append(leftDiv, actionsDiv);
      todoList.appendChild(li);
    });
  }

  // Helper Logika Data
  function getFilteredAndSortedTodos() {
    const priorityWeight = { tinggi: 3, sedang: 2, rendah: 1 };

    return todos
      .filter((todo) => {
        if (filterStatus === "aktif" && todo.completed) return false;
        if (filterStatus === "selesai" && !todo.completed) return false;
        if (filterPriority !== "semua" && todo.priority !== filterPriority)
          return false;
        if (searchQuery && !todo.text.toLowerCase().includes(searchQuery))
          return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "prioritas") {
          return (
            priorityWeight[b.priority] - priorityWeight[a.priority] ||
            b.createdAt - a.createdAt
          );
        }
        if (sortBy === "tenggat") {
          if (!a.dueDate && !b.dueDate) return b.createdAt - a.createdAt;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.localeCompare(b.dueDate);
        }
        return b.createdAt - a.createdAt;
      });
  }

  function toggleTodo(id) {
    todos = todos.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t,
    );
    saveTodos();
    render();
  }

  function startEdit(id) {
    editingId = id;
    render();
  }

  function deleteTodoWithAnimation(id, element) {
    element.classList.add("removing");
    setTimeout(() => {
      todos = todos.filter((t) => t.id !== id);
      saveTodos();
      render();
    }, 220);
  }

  function isOverdue(dateStr) {
    const todayStr = new Date().toISOString().split("T")[0];
    return dateStr < todayStr;
  }

  function formatDateID(dateStr) {
    const [year, month, day] = dateStr.split("-");
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];
    return `${parseInt(day, 10)} ${months[parseInt(month, 10) - 1]} ${year}`;
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function loadTodos() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveTodos() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) {
      applyTheme(saved);
    } else if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      applyTheme("dark");
    }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    themeIcon.textContent = theme === "dark" ? "☀️" : "🌙";
  }
})();
