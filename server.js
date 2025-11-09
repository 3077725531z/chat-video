const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
// Socket.io 配置
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// 存储在线用户
const users = new Map();

// 消息存储文件
const MESSAGES_FILE = path.join(__dirname, 'messages.json');

// 读取历史消息
function loadMessages() {
  try {
    if (fs.existsSync(MESSAGES_FILE)) {
      const data = fs.readFileSync(MESSAGES_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('读取消息失败:', error);
  }
  return [];
}

// 保存消息
function saveMessage(message) {
  try {
    const messages = loadMessages();
    messages.push(message);
    // 只保留最近1000条消息
    if (messages.length > 1000) {
      messages.shift();
    }
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2), 'utf8');
  } catch (error) {
    console.error('保存消息失败:', error);
  }
}

// 初始化消息数组
let messages = loadMessages();

// Socket.io 连接处理
io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);

  // 用户加入房间
  socket.on('join-room', (username) => {
    users.set(socket.id, username);
    socket.username = username;
    
    // 发送历史消息给新用户
    socket.emit('history-messages', messages.slice(-50)); // 发送最近50条消息
    
    // 通知其他用户
    socket.broadcast.emit('user-joined', {
      id: socket.id,
      username: username
    });

    // 发送当前在线用户列表
    const userList = Array.from(users.entries()).map(([id, name]) => ({
      id,
      username: name
    }));
    io.emit('user-list', userList);
  });

  // 处理聊天消息
  socket.on('chat-message', (data) => {
    const messageData = {
      username: socket.username || '匿名',
      message: data.message,
      timestamp: new Date().toLocaleTimeString(),
      date: new Date().toISOString()
    };
    
    // 保存消息
    saveMessage(messageData);
    messages.push(messageData);
    if (messages.length > 1000) {
      messages.shift();
    }
    
    // 广播消息
    io.emit('chat-message', messageData);
  });

  // WebRTC 信令处理
  socket.on('offer', (data) => {
    socket.to(data.target).emit('offer', {
      offer: data.offer,
      sender: socket.id
    });
  });

  socket.on('answer', (data) => {
    socket.to(data.target).emit('answer', {
      answer: data.answer,
      sender: socket.id
    });
  });

  socket.on('ice-candidate', (data) => {
    socket.to(data.target).emit('ice-candidate', {
      candidate: data.candidate,
      sender: socket.id
    });
  });

  // 用户断开连接
  socket.on('disconnect', () => {
    console.log('用户断开:', socket.id);
    users.delete(socket.id);
    
    socket.broadcast.emit('user-left', {
      id: socket.id,
      username: socket.username
    });

    const userList = Array.from(users.entries()).map(([id, name]) => ({
      id,
      username: name
    }));
    io.emit('user-list', userList);
  });
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    users: users.size 
  });
});

// 处理所有路由，返回index.html（用于SPA）
app.get('*', (req, res) => {
  // 排除API路由和静态文件
  if (req.path.startsWith('/socket.io') || req.path.startsWith('/health')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`服务器运行在 http://${HOST}:${PORT}`);
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
});

