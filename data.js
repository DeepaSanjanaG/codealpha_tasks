const DB = {
  users: [
    { id: 1, name: "Alice", email: "alice@email.com", password: "1234" },
    { id: 2, name: "Bob",   email: "bob@email.com",   password: "1234" },
  ],
  projects: [
    { id: 1, name: "Website Redesign", owner: 1, members: [1, 2] },
  ],
  tasks: [
    { id: 1, projectId: 1, title: "Design homepage",  status: "todo",        assignee: 2, createdBy: 1 },
    { id: 2, projectId: 1, title: "Write content",    status: "in-progress", assignee: 1, createdBy: 1 },
    { id: 3, projectId: 1, title: "Deploy site",      status: "done",        assignee: 1, createdBy: 2 },
  ],
  comments: [
    { id: 1, taskId: 1, userId: 2, text: "I'll start on the mockups today!", time: "10:30 AM" },
  ],
  notifications: [],
  nextId: { user: 3, project: 2, task: 4, comment: 2 },
};

function getUser(id) {
  return DB.users.find(u => u.id === id);
}

function notify(userId, message) {
  DB.notifications.push({ id: Date.now(), userId: userId, message: message, read: false });
}