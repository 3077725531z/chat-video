const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);

// 访问密钥（从环境变量读取，默认密钥为 'chat2024'）
const ACCESS_KEY = process.env.ACCESS_KEY || 'chat2024';

// Socket.io 配置
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Cookie解析（用于密钥验证，需要在静态文件之前）
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// JSON解析
app.use(express.json());

// 静态文件服务（在密钥验证之前，但cookie-parser已经在上面）
app.use(express.static(path.join(__dirname, 'public')));

// 密钥验证中间件（只对主页面进行验证）
app.use((req, res, next) => {
  // 排除静态资源、API端点和Socket.io
  // 只对根路径 '/' 进行验证，其他路径直接通过
  if (req.path !== '/') {
    return next();
  }
  
  // 检查密钥（从URL参数、请求头或Cookie中获取）
  const providedKey = req.query.key || req.headers['x-access-key'];
  
  // 如果URL中有密钥且正确，设置Cookie并允许访问
  if (providedKey === ACCESS_KEY) {
    // 设置Cookie（24小时有效）
    res.cookie('access_key', providedKey, { 
      httpOnly: false,  // 允许前端读取（如果需要）
      maxAge: 86400000, // 24小时
      sameSite: 'lax'
    });
    return next();
  }
  
  // 检查Cookie中的密钥
  const cookieKey = req.cookies ? req.cookies.access_key : null;
  if (cookieKey === ACCESS_KEY) {
    return next();
  }
  
  // 如果没有密钥，返回密钥输入页面
  res.status(401).send(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>访问验证</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .auth-container {
          background: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          text-align: center;
          max-width: 400px;
          width: 90%;
        }
        h1 { color: #333; margin-bottom: 20px; }
        input {
          width: 100%;
          padding: 12px;
          margin: 10px 0;
          border: 2px solid #ddd;
          border-radius: 5px;
          font-size: 16px;
          box-sizing: border-box;
        }
        button {
          width: 100%;
          padding: 12px;
          margin-top: 10px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 5px;
          font-size: 16px;
          cursor: pointer;
        }
        button:hover { background: #5568d3; }
        .error { color: red; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="auth-container">
        <h1>🔒 访问验证</h1>
        <p>请输入访问密钥</p>
        <input type="password" id="keyInput" placeholder="访问密钥" autofocus>
        <button onclick="verifyKey()">验证</button>
        <div id="error" class="error"></div>
      </div>
      <script>
        function verifyKey() {
          const key = document.getElementById('keyInput').value;
          if (key) {
            window.location.href = window.location.pathname + '?key=' + encodeURIComponent(key);
          } else {
            document.getElementById('error').textContent = '请输入密钥';
          }
        }
        document.getElementById('keyInput').addEventListener('keypress', function(e) {
          if (e.key === 'Enter') verifyKey();
        });
      </script>
    </body>
    </html>
  `);
});

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
  
  // 存储已验证的用户
  socket.authenticated = false;
  
  // 密钥验证
  socket.on('authenticate', (key) => {
    if (key === ACCESS_KEY) {
      socket.authenticated = true;
      socket.emit('authenticated', { success: true });
      console.log('用户验证成功:', socket.id);
    } else {
      socket.emit('authenticated', { success: false, message: '密钥错误' });
      console.log('用户验证失败:', socket.id);
      socket.disconnect();
    }
  });

  // 用户加入房间（需要先验证）
  socket.on('join-room', (data) => {
    // 检查是否已验证
    if (!socket.authenticated) {
      socket.emit('auth-required', { message: '请先验证访问密钥' });
      return;
    }
    
    const username = typeof data === 'string' ? data : data.username;
    users.set(socket.id, username);
    socket.username = username;
    
    // 不发送历史消息，刷新后聊天记录为空
    // 如果需要显示历史消息，取消下面的注释
    // socket.emit('history-messages', messages.slice(-50)); // 发送最近50条消息
    socket.emit('history-messages', []); // 发送空数组，不显示历史消息
    
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

  // 处理聊天消息（需要验证）
  socket.on('chat-message', (data) => {
    if (!socket.authenticated) {
      return;
    }
    
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

  // WebRTC 信令处理（需要验证）
  socket.on('offer', (data) => {
    if (!socket.authenticated) return;
    socket.to(data.target).emit('offer', {
      offer: data.offer,
      sender: socket.id
    });
  });

  socket.on('answer', (data) => {
    if (!socket.authenticated) return;
    socket.to(data.target).emit('answer', {
      answer: data.answer,
      sender: socket.id
    });
  });

  socket.on('ice-candidate', (data) => {
    if (!socket.authenticated) return;
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
  console.log(`访问密钥: ${ACCESS_KEY}`);
  console.log(`提示: 可通过环境变量 ACCESS_KEY 修改访问密钥`);
});

