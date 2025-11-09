// Socket.io 连接
const socket = io();
let localStream = null;
let remoteStream = null;
let peerConnections = new Map(); // 存储多个PeerConnection
let isVideoEnabled = false;
let isAudioEnabled = false;
let currentUsername = '';
let isJoined = false;
let currentUserId = null;
let onlineUsers = [];

// 获取DOM元素
const usernameInput = document.getElementById('usernameInput');
const joinBtn = document.getElementById('joinBtn');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const chatMessages = document.getElementById('chatMessages');
const usersList = document.getElementById('usersList');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const startVideoBtn = document.getElementById('startVideoBtn');
const stopVideoBtn = document.getElementById('stopVideoBtn');
const startAudioBtn = document.getElementById('startAudioBtn');
const stopAudioBtn = document.getElementById('stopAudioBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const remoteVideoWrapper = document.querySelector('.remote-video-wrapper');

// WebRTC 配置
const rtcConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
    ]
};

// 加入聊天
joinBtn.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    if (username) {
        currentUsername = username;
        isJoined = true;
        
        socket.emit('join-room', username);
        
        usernameInput.disabled = true;
        joinBtn.disabled = true;
        messageInput.disabled = false;
        sendBtn.disabled = false;
        startVideoBtn.disabled = false;
        startAudioBtn.disabled = false;
        
        addMessage('系统', '你已加入聊天室', true);
    }
});

// Socket连接成功后设置用户ID
socket.on('connect', () => {
    currentUserId = socket.id;
    console.log('Socket连接成功, ID:', socket.id);
});

// 全屏功能
if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
        toggleFullscreen();
    });
}

function toggleFullscreen() {
    if (!remoteVideoWrapper) return;
    
    if (!document.fullscreenElement && !remoteVideoWrapper.classList.contains('fullscreen')) {
        // 进入全屏
        if (remoteVideoWrapper.requestFullscreen) {
            remoteVideoWrapper.requestFullscreen().catch(err => {
                console.log('全屏请求失败:', err);
                // 使用CSS全屏作为备选方案
                remoteVideoWrapper.classList.add('fullscreen');
            });
        } else if (remoteVideoWrapper.webkitRequestFullscreen) {
            remoteVideoWrapper.webkitRequestFullscreen();
        } else if (remoteVideoWrapper.mozRequestFullScreen) {
            remoteVideoWrapper.mozRequestFullScreen();
        } else if (remoteVideoWrapper.msRequestFullscreen) {
            remoteVideoWrapper.msRequestFullscreen();
        } else {
            remoteVideoWrapper.classList.add('fullscreen');
        }
    } else {
        // 退出全屏
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        remoteVideoWrapper.classList.remove('fullscreen');
    }
}

// 监听全屏状态变化
document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
        remoteVideoWrapper?.classList.remove('fullscreen');
    }
});

document.addEventListener('webkitfullscreenchange', () => {
    if (!document.webkitFullscreenElement) {
        remoteVideoWrapper?.classList.remove('fullscreen');
    }
});

// 移动端优化：防止页面缩放
document.addEventListener('touchstart', function(event) {
    if (event.touches.length > 1) {
        event.preventDefault();
    }
});

let lastTouchEnd = 0;
document.addEventListener('touchend', function(event) {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// 优化按钮状态显示
function updateButtonStates() {
    if (isVideoEnabled) {
        startVideoBtn.classList.add('active');
        stopVideoBtn.classList.add('active');
    } else {
        startVideoBtn.classList.remove('active');
        stopVideoBtn.classList.remove('active');
    }
    
    if (isAudioEnabled) {
        startAudioBtn.classList.add('active');
        stopAudioBtn.classList.add('active');
    } else {
        startAudioBtn.classList.remove('active');
        stopAudioBtn.classList.remove('active');
    }
}

// 发送消息
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

function sendMessage() {
    const message = messageInput.value.trim();
    if (message && isJoined) {
        socket.emit('chat-message', { message });
        messageInput.value = '';
    }
}

// 接收历史消息
socket.on('history-messages', (messages) => {
    messages.forEach(msg => {
        const isOwn = msg.username === currentUsername;
        addMessage(msg.username, msg.message, isOwn, msg.timestamp);
    });
});

// 接收聊天消息
socket.on('chat-message', (data) => {
    const isOwn = data.username === currentUsername;
    addMessage(data.username, data.message, isOwn, data.timestamp);
});

// 添加消息到聊天窗口
function addMessage(username, message, isOwn, timestamp = '') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isOwn ? 'message-own' : ''}`;
    
    const header = document.createElement('div');
    header.className = 'message-header';
    header.textContent = `${username} ${timestamp ? `(${timestamp})` : ''}`;
    
    const content = document.createElement('div');
    content.className = 'message-content';
    content.textContent = message;
    
    messageDiv.appendChild(header);
    messageDiv.appendChild(content);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 更新用户列表
socket.on('user-list', (users) => {
    usersList.innerHTML = '';
    onlineUsers = users;
    
    // 更新当前用户ID（如果还没设置）
    const currentUser = users.find(u => u.username === currentUsername);
    if (currentUser) {
        currentUserId = currentUser.id;
    }
    
    users.forEach(user => {
        const li = document.createElement('li');
        li.textContent = user.username;
        usersList.appendChild(li);
    });
    
    // 如果已经有其他用户在线且已开启视频，等待接收他们的offer
    console.log('在线用户列表已更新:', users);
});

socket.on('user-joined', (data) => {
    addMessage('系统', `${data.username} 加入了聊天室`, false);
    // 如果已经开启了视频或音频，与新用户建立连接
    if ((isVideoEnabled || isAudioEnabled) && localStream) {
        setTimeout(() => {
            if (!peerConnections.has(data.id)) {
                console.log('与新用户建立连接:', data.id);
                createPeerConnection(data.id, true);
            }
        }, 500);
    }
});

socket.on('user-left', (data) => {
    addMessage('系统', `${data.username} 离开了聊天室`, false);
    // 关闭与该用户的连接
    const pc = peerConnections.get(data.id);
    if (pc) {
        pc.close();
        peerConnections.delete(data.id);
    }
});

// 视频控制
startVideoBtn.addEventListener('click', async () => {
    try {
        // 移动端优化：使用适合移动设备的视频参数
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const constraints = {
            video: isMobile ? {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'user'
            } : {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user'
            },
            audio: isAudioEnabled
        };
        
        localStream = await navigator.mediaDevices.getUserMedia(constraints);
        localVideo.srcObject = localStream;
        isVideoEnabled = true;
        
        startVideoBtn.disabled = true;
        stopVideoBtn.disabled = false;
        updateButtonStates();
        
        console.log('视频已开启，本地流轨道数:', localStream.getTracks().length);
        
        // 与所有其他用户建立连接
        setTimeout(() => {
            establishConnectionsWithOthers();
        }, 500);
    } catch (error) {
        console.error('无法获取视频流:', error);
        alert('无法访问摄像头，请检查权限设置');
    }
});

stopVideoBtn.addEventListener('click', () => {
    if (localStream) {
        localStream.getTracks().forEach(track => {
            if (track.kind === 'video') {
                track.stop();
            }
        });
        localVideo.srcObject = null;
        isVideoEnabled = false;
        
        // 关闭所有PeerConnection
        peerConnections.forEach((pc, userId) => {
            pc.close();
            peerConnections.delete(userId);
        });
        remoteVideo.srcObject = null;
        
        startVideoBtn.disabled = false;
        stopVideoBtn.disabled = true;
        updateButtonStates();
    }
});

// 音频控制
startAudioBtn.addEventListener('click', async () => {
    try {
        if (!localStream) {
            localStream = await navigator.mediaDevices.getUserMedia({ 
                video: isVideoEnabled, 
                audio: true 
            });
            if (isVideoEnabled) {
                localVideo.srcObject = localStream;
            }
        } else {
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioStream.getAudioTracks().forEach(track => {
                localStream.addTrack(track);
                // 将音频轨道添加到所有现有的PeerConnection
                peerConnections.forEach((pc) => {
                    pc.addTrack(track, localStream);
                });
            });
        }
        isAudioEnabled = true;
        
        startAudioBtn.disabled = true;
        stopAudioBtn.disabled = false;
        updateButtonStates();
        
        // 如果还没有连接，建立连接（音频或视频都可以建立连接）
        if (peerConnections.size === 0) {
            establishConnectionsWithOthers();
        }
    } catch (error) {
        console.error('无法获取音频流:', error);
        alert('无法访问麦克风，请检查权限设置');
    }
});

stopAudioBtn.addEventListener('click', () => {
    if (localStream) {
        localStream.getAudioTracks().forEach(track => {
            track.stop();
            localStream.removeTrack(track);
            // 从所有PeerConnection中移除音频轨道
            peerConnections.forEach((pc) => {
                const sender = pc.getSenders().find(s => s.track === track);
                if (sender) {
                    pc.removeTrack(sender);
                }
            });
        });
        isAudioEnabled = false;
        
        startAudioBtn.disabled = false;
        stopAudioBtn.disabled = true;
        updateButtonStates();
    }
});

// 与其他用户建立连接
function establishConnectionsWithOthers() {
    console.log('建立与其他用户的连接，在线用户:', onlineUsers);
    onlineUsers.forEach(user => {
        if (user.id !== currentUserId && !peerConnections.has(user.id)) {
            console.log('创建与用户', user.id, '的连接');
            createPeerConnection(user.id, true);
        }
    });
}

// 创建 PeerConnection
function createPeerConnection(targetUserId, isInitiator = true) {
    // 如果已经存在连接，先关闭
    if (peerConnections.has(targetUserId)) {
        const oldPc = peerConnections.get(targetUserId);
        oldPc.close();
    }
    
    const peerConnection = new RTCPeerConnection(rtcConfiguration);
    peerConnections.set(targetUserId, peerConnection);
    
    // 添加本地流
    if (localStream) {
        localStream.getTracks().forEach(track => {
            if (track.readyState === 'live') {
                peerConnection.addTrack(track, localStream);
            }
        });
    }
    
    // 接收远程流 - 重要：使用addTransceiver确保能接收
    peerConnection.ontrack = (event) => {
        console.log('收到远程流:', event.track.kind, 'from', targetUserId);
        const stream = event.streams[0];
        
        // 为每个用户创建独立的视频元素或合并流
        if (!remoteVideo.srcObject) {
            remoteVideo.srcObject = new MediaStream();
        }
        
        // 添加所有轨道
        event.streams.forEach(stream => {
            stream.getTracks().forEach(track => {
                const existingTrack = remoteVideo.srcObject.getTracks().find(t => 
                    t.id === track.id || (t.kind === track.kind && t.readyState === 'live')
                );
                if (!existingTrack) {
                    remoteVideo.srcObject.addTrack(track);
                    console.log('添加远程轨道:', track.kind);
                }
            });
        });
        
        // 显示全屏按钮
        if (fullscreenBtn && remoteVideo.srcObject.getVideoTracks().length > 0) {
            fullscreenBtn.style.display = 'block';
        }
    };
    
    // ICE 候选
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice-candidate', {
                candidate: event.candidate,
                target: targetUserId
            });
        } else {
            console.log('ICE 候选收集完成');
        }
    };
    
    // ICE 连接状态
    peerConnection.oniceconnectionstatechange = () => {
        console.log(`ICE 连接状态 (${targetUserId}):`, peerConnection.iceConnectionState);
        if (peerConnection.iceConnectionState === 'failed') {
            // 尝试重新连接
            peerConnection.restartIce();
        }
    };
    
    // 连接状态变化
    peerConnection.onconnectionstatechange = () => {
        console.log(`连接状态 (${targetUserId}):`, peerConnection.connectionState);
        if (peerConnection.connectionState === 'failed' || 
            peerConnection.connectionState === 'disconnected') {
            // 尝试重新连接
            setTimeout(() => {
                if (peerConnection.connectionState === 'failed') {
                    peerConnections.delete(targetUserId);
                    if (localStream && isVideoEnabled) {
                        createPeerConnection(targetUserId, true);
                    }
                }
            }, 1000);
        } else if (peerConnection.connectionState === 'closed') {
            peerConnections.delete(targetUserId);
        }
    };
    
    // 如果是发起方，创建 offer
    if (isInitiator && localStream) {
        // 添加 transceiver 以确保能接收对方的流
        peerConnection.addTransceiver('video', { direction: 'recvonly' });
        peerConnection.addTransceiver('audio', { direction: 'recvonly' });
        
        peerConnection.createOffer({ offerToReceiveVideo: true, offerToReceiveAudio: true })
            .then(offer => {
                return peerConnection.setLocalDescription(offer);
            })
            .then(() => {
                console.log('发送 offer 给', targetUserId);
                socket.emit('offer', {
                    offer: peerConnection.localDescription,
                    target: targetUserId
                });
            })
            .catch(error => {
                console.error('创建 offer 失败:', error);
            });
    }
    
    return peerConnection;
}

// 处理 offer
socket.on('offer', async (data) => {
    console.log('收到 offer from', data.sender);
    let peerConnection = peerConnections.get(data.sender);
    
    // 创建或获取 PeerConnection（即使没有本地流也能接收远程流）
    if (!peerConnection) {
        // 创建一个新的连接用于接收
        peerConnection = new RTCPeerConnection(rtcConfiguration);
        peerConnections.set(data.sender, peerConnection);
        
        // 设置远程流接收处理
        peerConnection.ontrack = (event) => {
            console.log('收到远程流:', event.track.kind, 'from', data.sender);
            if (!remoteVideo.srcObject) {
                remoteVideo.srcObject = new MediaStream();
            }
            event.streams.forEach(stream => {
                stream.getTracks().forEach(track => {
                    const existingTrack = remoteVideo.srcObject.getTracks().find(t => t.id === track.id);
                    if (!existingTrack) {
                        remoteVideo.srcObject.addTrack(track);
                        console.log('添加远程轨道:', track.kind, track.id);
                    }
                });
            });
            
            // 显示全屏按钮
            if (fullscreenBtn && remoteVideo.srcObject.getVideoTracks().length > 0) {
                fullscreenBtn.style.display = 'block';
            }
        };
        
        // ICE 候选处理
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('ice-candidate', {
                    candidate: event.candidate,
                    target: data.sender
                });
            }
        };
        
        // 连接状态监控
        peerConnection.onconnectionstatechange = () => {
            console.log(`连接状态 (${data.sender}):`, peerConnection.connectionState);
        };
        
        // 如果有本地流，添加进去
        if (localStream) {
            localStream.getTracks().forEach(track => {
                if (track.readyState === 'live') {
                    peerConnection.addTrack(track, localStream);
                }
            });
        }
    }
    
    try {
        // 设置远程描述
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        
        // 创建 answer
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        console.log('发送 answer 给', data.sender);
        socket.emit('answer', {
            answer: peerConnection.localDescription,
            target: data.sender
        });
    } catch (error) {
        console.error('处理 offer 失败:', error);
    }
});

// 处理 answer
socket.on('answer', async (data) => {
    console.log('收到 answer from', data.sender);
    const peerConnection = peerConnections.get(data.sender);
    if (peerConnection) {
        try {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
            console.log('成功设置远程描述');
        } catch (error) {
            console.error('处理 answer 失败:', error);
        }
    } else {
        console.error('没有找到对应的 PeerConnection');
    }
});

// 处理 ICE candidate
socket.on('ice-candidate', async (data) => {
    const peerConnection = peerConnections.get(data.sender);
    if (peerConnection && data.candidate) {
        try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
            console.log('成功添加 ICE candidate from', data.sender);
        } catch (error) {
            console.error('处理 ICE candidate 失败:', error);
        }
    }
});

// 页面关闭时清理
window.addEventListener('beforeunload', () => {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    peerConnections.forEach((pc) => {
        pc.close();
    });
    peerConnections.clear();
    socket.disconnect();
});

