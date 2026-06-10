let currentUser = null;
let currentProject = null;
let currentTaskId = null;

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  document.getElementById(pageId).classList.remove("hidden");
}

function login() {
  const email    = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const user     = DB.users.find(u => u.email === email && u.password === password);
  if (!user) { document.getElementById("loginError").textContent = "Wrong email or password."; return; }
  currentUser = user;
  document.getElementById("navUser").textContent  = "👤 " + user.name;
  document.getElementById("navUser2").textContent = "👤 " + user.name;
  showPage("projectsPage");
  renderProjects();
  startNotifPolling();
}

function logout() {
  currentUser = null; currentProject = null;
  stopNotifPolling();
  showPage("loginPage");
}

function renderProjects() {
  const list = document.getElementById("projectList");
  list.innerHTML = "";
  const myProjects = DB.projects.filter(p => p.members.includes(currentUser.id));
  if (myProjects.length === 0) { list.innerHTML = "<p style='color:#888;margin-top:12px'>No projects yet!</p>"; return; }
  myProjects.forEach(p => {
    const taskCount = DB.tasks.filter(t => t.projectId === p.id).length;
    const card = document.createElement("div");
    card.className = "project-card";
    card.innerHTML = `<span style="font-size:28px">📋</span><div><h3>${p.name}</h3><p>${p.members.length} members · ${taskCount} tasks</p></div>`;
    card.onclick = () => openBoard(p);
    list.appendChild(card);
  });
}

function showProjectForm() { document.getElementById("newProjectForm").classList.remove("hidden"); }
function hideProjectForm() { document.getElementById("newProjectForm").classList.add("hidden"); document.getElementById("newProjectName").value = ""; }

function createProject() {
  const name = document.getElementById("newProjectName").value.trim();
  if (!name) return;
  DB.projects.push({ id: DB.nextId.project++, name: name, owner: currentUser.id, members: [currentUser.id] });
  hideProjectForm();
  renderProjects();
}

function goToProjects() { currentProject = null; showPage("projectsPage"); renderProjects(); }

function openBoard(project) {
  currentProject = project;
  document.getElementById("boardProjectName").textContent = "📋 " + project.name;
  showPage("boardPage");
  renderBoard();
}

function renderBoard() {
  const statuses = ["todo", "in-progress", "done"];
  const members  = DB.users.filter(u => currentProject.members.includes(u.id));
  document.getElementById("membersList").textContent = "👥 " + members.map(m => m.name).join(", ");
  statuses.forEach(status => {
    const select = document.getElementById("assign-" + status);
    select.innerHTML = '<option value="">Assign to...</option>';
    members.forEach(m => { const opt = document.createElement("option"); opt.value = m.id; opt.textContent = m.name; select.appendChild(opt); });
    const tasks = DB.tasks.filter(t => t.projectId === currentProject.id && t.status === status);
    document.getElementById("count-" + status).textContent = "(" + tasks.length + ")";
    const list = document.getElementById("tasks-" + status);
    list.innerHTML = "";
    tasks.forEach(task => {
      const commentCount = DB.comments.filter(c => c.taskId === task.id).length;
      const card = document.createElement("div");
      card.className = "task-card";
      card.innerHTML = `<h4>${task.title}</h4><p>👤 ${getUser(task.assignee)?.name || "Unassigned"}</p><p>💬 ${commentCount} comment${commentCount !== 1 ? "s" : ""}</p>`;
      card.onclick = () => openTaskModal(task.id);
      list.appendChild(card);
    });
  });
}

function showAddTask(status) { document.getElementById("form-" + status).classList.remove("hidden"); }
function hideAddTask(status) { document.getElementById("form-" + status).classList.add("hidden"); document.getElementById("title-" + status).value = ""; }

function addTask(status) {
  const title      = document.getElementById("title-" + status).value.trim();
  const assigneeId = parseInt(document.getElementById("assign-" + status).value) || currentUser.id;
  if (!title) return;
  DB.tasks.push({ id: DB.nextId.task++, projectId: currentProject.id, title: title, status: status, assignee: assigneeId, createdBy: currentUser.id });
  if (assigneeId !== currentUser.id) notify(assigneeId, `📌 You were assigned "${title}" in ${currentProject.name}`);
  hideAddTask(status);
  renderBoard();
}

function toggleInvite() { document.getElementById("inviteForm").classList.toggle("hidden"); }

function inviteMember() {
  const email = document.getElementById("inviteEmail").value.trim();
  const msg   = document.getElementById("inviteMsg");
  const user  = DB.users.find(u => u.email === email);
  if (!user) { msg.textContent = "❌ User not found"; return; }
  if (currentProject.members.includes(user.id)) { msg.textContent = "Already a member"; return; }
  currentProject.members.push(user.id);
  notify(user.id, `🎉 You were added to "${currentProject.name}"`);
  document.getElementById("inviteEmail").value = "";
  msg.textContent = "✅ Added!";
  renderBoard();
}

function openTaskModal(taskId) {
  currentTaskId = taskId;
  const task = DB.tasks.find(t => t.id === taskId);
  document.getElementById("modalTitle").textContent    = task.title;
  document.getElementById("modalAssignee").textContent = getUser(task.assignee)?.name || "Unassigned";
  document.getElementById("modalStatus").textContent   = task.status;
  const moveDiv  = document.getElementById("moveButtons");
  const colors   = { "todo": "#ee00aa", "in-progress": "#ff9900", "done": "#22cc77" };
  moveDiv.innerHTML = "";
  ["todo", "in-progress", "done"].filter(s => s !== task.status).forEach(s => {
    const btn = document.createElement("button");
    btn.className = "move-btn";
    btn.textContent = s;
    btn.style.background = colors[s] + "33";
    btn.style.color = colors[s];
    btn.onclick = () => moveTask(taskId, s);
    moveDiv.appendChild(btn);
  });
  renderComments(taskId);
  document.getElementById("taskModal").classList.remove("hidden");
}

function closeModal() { document.getElementById("taskModal").classList.add("hidden"); document.getElementById("commentText").value = ""; currentTaskId = null; renderBoard(); }

function moveTask(taskId, newStatus) {
  const task = DB.tasks.find(t => t.id === taskId);
  task.status = newStatus;
  notify(task.assignee, `🔄 "${task.title}" moved to ${newStatus}`);
  openTaskModal(taskId);
}

function renderComments(taskId) {
  const list = document.getElementById("commentList");
  const comments = DB.comments.filter(c => c.taskId === taskId);
  list.innerHTML = "";
  if (comments.length === 0) { list.innerHTML = "<p style='color:#aaa;font-size:13px'>No comments yet.</p>"; return; }
  comments.forEach(c => {
    const box = document.createElement("div");
    box.className = "comment-box";
    box.innerHTML = `<div class="comment-header"><strong>${getUser(c.userId)?.name}</strong><span style="color:#aaa">${c.time}</span></div><p>${c.text}</p>`;
    list.appendChild(box);
  });
}

function postComment() {
  const text = document.getElementById("commentText").value.trim();
  if (!text || !currentTaskId) return;
  const now  = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const task = DB.tasks.find(t => t.id === currentTaskId);
  DB.comments.push({ id: DB.nextId.comment++, taskId: currentTaskId, userId: currentUser.id, text: text, time: now });
  if (task.assignee !== currentUser.id) notify(task.assignee, `💬 ${currentUser.name} commented on "${task.title}"`);
  document.getElementById("commentText").value = "";
  renderComments(currentTaskId);
}

let notifInterval = null;
function startNotifPolling() { notifInterval = setInterval(updateNotifBadge, 2000); }
function stopNotifPolling()  { clearInterval(notifInterval); }

function updateNotifBadge() {
  if (!currentUser) return;
  const unread = DB.notifications.filter(n => n.userId === currentUser.id && !n.read).length;
  document.getElementById("notifCount").textContent  = unread > 0 ? "(" + unread + ")" : "";
  document.getElementById("notifCount2").textContent = unread > 0 ? "(" + unread + ")" : "";
}

function toggleNotifs() {
  DB.notifications.forEach(n => { if (n.userId === currentUser.id) n.read = true; });
  updateNotifBadge();
  const box1 = document.getElementById("notifBox");
  const box2 = document.getElementById("notifBox2");
  const box  = box1.closest(".page").classList.contains("hidden") ? box2 : box1;
  box.classList.toggle("hidden");
  const myNotifs = DB.notifications.filter(n => n.userId === currentUser.id).reverse();
  box.innerHTML = myNotifs.length === 0 ? "<p style='font-size:13px;color:#888'>No notifications</p>" : myNotifs.map(n => `<div class="notif-item">${n.message}</div>`).join("");
}