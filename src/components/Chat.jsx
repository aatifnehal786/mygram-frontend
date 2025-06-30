// 📁 Chat.js
import React, { useState, useEffect, useRef } from 'react';
import ChatSidebar from './ChatSideBar';
import ChatWindow from './ChatWindow';
import io from 'socket.io-client';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './chat.css';

const Chat = () => {
  const [selectedUser, setSelectedUser] = useState(
    JSON.parse(localStorage.getItem('selected-chat-user')) || null
  );
  const [chatList, setChatList] = useState([]);
  const [messages, setMessages] = useState([]);
  const [view, setView] = useState(window.innerWidth < 768 ? 'sidebar' : 'full');
  const [loggedUser, setLoggedUser] = useState(
    JSON.parse(sessionStorage.getItem('token-auth'))
  );
  const [incomingCall, setIncomingCall] = useState(null);
  const [callType, setCallType] = useState(null);
  const [isCallActive, setIsCallActive] = useState(false);

  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setView('full');
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io('https://mygram-1-1nua.onrender.com');
    }
  }, []);

  useEffect(() => {
  if (!selectedUser || !loggedUser?.token) return;

  fetch(`https://mygram-1-1nua.onrender.com/chat/${selectedUser._id}`, {
    headers: { Authorization: `Bearer ${loggedUser.token}` },
  })
    .then(res => res.ok ? res.json() : [])
    .then(data => setMessages(data || []))
    .catch(err => console.error('Fetch chat error:', err));

  socketRef.current.emit('join', loggedUser.userid);

  const socket = socketRef.current;

  socket.on('receiveMessage', (msg) => {
    const isCurrentChat =
      (msg.sender === loggedUser.userid && msg.receiver === selectedUser._id) ||
      (msg.receiver === loggedUser.userid && msg.sender === selectedUser._id);
    if (isCurrentChat) setMessages(prev => [...prev, msg]);
  });




  socket.on('incoming-call', ({ from, offer, type }) => {
    console.log('📞 Incoming call received:', { from, type });
    setIncomingCall({ from, offer, type });
    setCallType(type);
  });

  socket.on('answer-call', ({ answer }) => {
  peerRef.current?.setRemoteDescription(new RTCSessionDescription(answer));
});


  socket.on('call-rejected', () => {
    endCall();
    setIncomingCall(null);
    toast.info('Call was rejected.');
  });

  socket.on('ice-candidate', ({ candidate }) => {
    peerRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
  });

  socket.on('call-ended', () => {
    endCall();
  });

  return () => {
    socket.off('receiveMessage');
    socket.off('incoming-call');
    socket.off('call-answered');
    socket.off('call-rejected'); // ✅ IMPORTANT
    socket.off('ice-candidate');
    socket.off('call-ended');
  };
}, [selectedUser, loggedUser?.token]); // ✅ ADD loggedUser as dependency


  const createPeer = async (isInitiator, remoteUserId, isVideo) => {
    peerRef.current = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    peerRef.current.onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current.emit('ice-candidate', {
          to: remoteUserId,
          candidate: e.candidate,
        });
      }
    };

    peerRef.current.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    localStreamRef.current = await navigator.mediaDevices.getUserMedia({
      video: isVideo,
      audio: true,
    });

    localStreamRef.current.getTracks().forEach((track) => {
      peerRef.current.addTrack(track, localStreamRef.current);
    });

    localVideoRef.current.srcObject = localStreamRef.current;

    if (isInitiator) {
      const offer = await peerRef.current.createOffer();
      await peerRef.current.setLocalDescription(offer);
      socketRef.current.emit('call-user', {
        from: loggedUser.userid,
        to: selectedUser._id,
        offer,
        type: isVideo ? 'video' : 'audio'
      });
    }
  };

  const startCall = (isVideo) => {
    createPeer(true, selectedUser._id, isVideo);
    setCallType(isVideo ? 'video' : 'audio');
    setIsCallActive(true);
  };

  const acceptCall = async () => {
    if (!incomingCall) return;

    const { from, offer, type } = incomingCall;
    const isVideo = type === 'video';

    await createPeer(false, from, isVideo);
    await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerRef.current.createAnswer();
    await peerRef.current.setLocalDescription(answer);
    socketRef.current.emit('call-answered', { to: from, answer });

    setIncomingCall(null);
    setCallType(type);
    setIsCallActive(true);
  };

  const rejectCall = () => {
    setIncomingCall(null);
    socketRef.current.emit('reject-call', { to: incomingCall?.from });
  };

  const endCall = () => {
    if (peerRef.current) peerRef.current.close();
    peerRef.current = null;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    localStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    setIsCallActive(false);
    setCallType(null);
    socketRef.current.emit('end-call', { to: selectedUser._id });
  };

  return (
    <div className="chat-layout">
      <div className="chat-grid">
        {(view === 'sidebar' || view === 'full') && (
          <ChatSidebar
            onSelectUser={(user) => {
              setSelectedUser(user);
              if (window.innerWidth < 768) setView('chat');
            }}
            selectedUserId={selectedUser?._id}
            loggedUser={loggedUser}
            setChatList={setChatList}
          />
        )}

        {(view === 'chat' || view === 'full') && selectedUser && (
          <div className="chat-main">
            <div className="chat-header">
              <div className="chat-header-left">
                {window.innerWidth < 768 && (
                  <button className="toggle-btn" onClick={() => setView('sidebar')}>
                    ← Back
                  </button>
                )}
                <h3>{selectedUser.username}</h3>
              </div>
              <div className="chat-header-right">
                <button className="call-btn" onClick={() => startCall(false)}>🎤</button>
                <button className="call-btn" onClick={() => startCall(true)}>🎥</button>
                {isCallActive && <button className="call-btn" onClick={endCall}>❌</button>}
              </div>
            </div>

            <ChatWindow
              selectedUser={selectedUser}
              chatList={chatList}
              messages={messages}
              setMessages={setMessages}
              socket={socketRef.current}
            />

            {isCallActive && (
              <div className="video-chat">
                <video ref={localVideoRef} autoPlay muted className="video-local" />
                <video ref={remoteVideoRef} autoPlay className="video-remote" />
              </div>
            )}
          </div>
        )}
      </div>

      {incomingCall && (
        <div className="incoming-call-popup">
          <p>Incoming {incomingCall.type} call...</p>
          <button onClick={acceptCall} className="accept-btn">✅ Accept</button>
          <button onClick={rejectCall} className="reject-btn">❌ Reject</button>
        </div>
      )}

      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
};

export default Chat;
