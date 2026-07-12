const STORAGE_KEY = "techTodoTasks";
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const addBtn = document.getElementById("addBtn");
const emptyState = document.getElementById("emptyState");
const emptyText = document.getElementById("emptyText");
const statTotal = document.getElementById("statTotal");
const statActive = document.getElementById("statActive");
const statDone = document.getElementById("statDone");
const subtitle = document.getElementById("subtitle");

let tasks = load();
let currentFilter = "all";
let currentPriority = "low";

function load(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch(e){ return []; }
}
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }

document.querySelectorAll(".priority-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".priority-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentPriority = btn.dataset.p;
  });
});

document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.f;
    render();
  });
});

function checkIcon(){
  return '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><path d="M4 12l5 5L20 6"/></svg>';
}

function render(){
  taskList.innerHTML = "";
  const filtered = tasks.filter(t => {
    if(currentFilter === "active") return !t.completed;
    if(currentFilter === "completed") return t.completed;
    return true;
  });

  if(filtered.length === 0){
    emptyState.style.display = "block";
    emptyText.textContent = tasks.length === 0 ? "// queue is empty" : "// no tasks in this view";
  } else {
    emptyState.style.display = "none";
  }

  filtered.forEach(task => {
    const li = document.createElement("li");
    li.className = "task";

    const checkbox = document.createElement("button");
    checkbox.className = "checkbox" + (task.completed ? " checked" : "");
    checkbox.innerHTML = checkIcon();
    checkbox.addEventListener("click", () => {
      task.completed = !task.completed;
      save(); render();
    });

    const tag = document.createElement("div");
    tag.className = "priority-tag " + task.priority;

    const span = document.createElement("span");
    span.className = "task-text" + (task.completed ? " completed" : "");
    span.textContent = task.text;
    span.addEventListener("dblclick", () => startEdit(li, task));

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "icon-btn";
    editBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>';
    editBtn.addEventListener("click", () => startEdit(li, task));

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "icon-btn danger";
    deleteBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/></svg>';
    deleteBtn.addEventListener("click", () => {
      tasks = tasks.filter(t => t.id !== task.id);
      save(); render();
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    li.appendChild(checkbox);
    li.appendChild(tag);
    li.appendChild(span);
    li.appendChild(actions);
    taskList.appendChild(li);
  });

  const doneCount = tasks.filter(t => t.completed).length;
  statTotal.textContent = tasks.length;
  statActive.textContent = tasks.length - doneCount;
  statDone.textContent = doneCount;
  subtitle.textContent = tasks.length
    ? `// ${tasks.length} task${tasks.length === 1 ? '' : 's'} — persisted`
    : "// local session — persisted";
}

function startEdit(li, task){
  li.innerHTML = "";
  const input = document.createElement("input");
  input.type = "text";
  input.className = "edit-input";
  input.value = task.text;
  input.maxLength = 200;
  li.appendChild(input);
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);

  function commit(){
    const val = input.value.trim();
    if(val) task.text = val;
    save(); render();
  }
  input.addEventListener("blur", commit);
  input.addEventListener("keydown", e => {
    if(e.key === "Enter") input.blur();
    if(e.key === "Escape") render();
  });
}

function addTask(){
  const text = taskInput.value.trim();
  if(!text) return;
  tasks.push({
    id: Date.now() + Math.random(),
    text,
    completed: false,
    priority: currentPriority
  });
  save(); render();
  taskInput.value = "";
  taskInput.focus();
}

addBtn.addEventListener("click", addTask);
taskInput.addEventListener("keypress", e => { if(e.key === "Enter") addTask(); });

render();
