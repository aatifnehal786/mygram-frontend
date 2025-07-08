// ✅ Chat.js
import React, { useState, useEffect, useRef } from 'react';
import ChatSidebar from './ChatSideBar';
import ChatWindow from './ChatWindow';
import io from 'socket.io-client';
import { ToastContainer } from 'react-toastify';
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
  const [isForwarding, setIsForwarding] = useState(false);
  const [messageToForward, setMessageToForward] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
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

    socketRef.current.on('receiveMessage', (msg) => {
      const isCurrentChat =
        (msg.sender === loggedUser.userid && msg.receiver === selectedUser._id) ||
        (msg.receiver === loggedUser.userid && msg.sender === selectedUser._id);
      if (isCurrentChat) setMessages(prev => [...prev, msg]);
    });

    socketRef.current.on('incoming-call', async ({ from, offer }) => {
      setIncomingCall({ from, offer });
    });

    socketRef.current.on('call-answered', ({ answer }) => {
      peerRef.current?.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socketRef.current.on('ice-candidate', ({ candidate }) => {
      peerRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
    });

    socketRef.current.on('call-ended', () => {
      endCall();
    });

    return () => {
      socketRef.current.off('receiveMessage');
      socketRef.current.off('incoming-call');
      socketRef.current.off('call-answered');
      socketRef.current.off('ice-candidate');
      socketRef.current.off('call-ended');
    };
  }, [selectedUser]);

  const triggerForwardMode = (msg) => {
    setIsForwarding(true);
    setMessageToForward(msg);
    setView('sidebar');
  };

  const forwardMessageToUser = async (msg, receiverId) => {
    try {
      const res = await fetch("https://mygram-1-1nua.onrender.com/chat/forward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: loggedUser.userid,
          receiverId,
          message: msg.message || '',
          fileUrl: msg.fileUrl || null,
          fileType: msg.fileType || null,
          isForwarded: true
        })
      });

      const newMsg = await res.json();

      if (socketRef.current) {
        socketRef.current.emit("sendMessage", newMsg);
      }

      if (selectedUser?._id === receiverId) {
        setMessages(prev => [...prev, newMsg]);
      }

      setIsForwarding(false);
      setMessageToForward(null);
      setSelectedUser(user => user && user._id === receiverId ? user : user);
      setView('chat');
    } catch (err) {
      console.error("Forward failed:", err);
    }
  };

 const startCall = async () => {
  peerRef.current = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  });

  peerRef.current.onicecandidate = (e) => {
    if (e.candidate) {
      socketRef.current.emit('ice-candidate', {
        to: selectedUser._id,
        candidate: e.candidate,
      });
    }
  };

  peerRef.current.ontrack = (event) => {
    const remoteStream = event.streams[0];
    // Delay assignment to ensure video element is rendered
    setTimeout(() => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    }, 0);
  };

  try {
    localStreamRef.current = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    localStreamRef.current.getTracks().forEach((track) => {
      peerRef.current.addTrack(track, localStreamRef.current);
    });

    // Delay assignment if ref not ready
    setTimeout(() => {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }, 0);

    const offer = await peerRef.current.createOffer();
    await peerRef.current.setLocalDescription(offer);

    socketRef.current.emit('call-user', {
      from: loggedUser.userid,
      to: selectedUser._id,
      offer,
    });

    setIsCallActive(true);
  } catch (err) {
    console.error("Failed to start call:", err);
  }
};


  const acceptCall = async () => {
  const { from, offer } = incomingCall;

  peerRef.current = new RTCPeerConnection({
    iceServers: [{
                'url': 'stun:stun.l.google.com:19302'
            }],
  });

  peerRef.current.onicecandidate = (e) => {
    if (e.candidate) {
      socketRef.current.emit('ice-candidate', {
        to: from,
        candidate: e.candidate,
      });
    }
  };

  peerRef.current.ontrack = (event) => {
    const remoteStream = event.streams[0];
    setTimeout(() => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    }, 0);
  };

  try {
    localStreamRef.current = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    localStreamRef.current.getTracks().forEach((track) => {
      peerRef.current.addTrack(track, localStreamRef.current);
    });

    setTimeout(() => {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }, 0);

    await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerRef.current.createAnswer();
    await peerRef.current.setLocalDescription(answer);

    socketRef.current.emit('answer-call', { to: from, answer });

    setIncomingCall(null);
    setIsCallActive(true);
  } catch (err) {
    console.error("Failed to accept call:", err);
  }
};

const endCall = () => {
  // ✅ 1. Close the peer connection
  if (peerRef.current) {
    peerRef.current.ontrack = null;
    peerRef.current.onicecandidate = null;
    peerRef.current.close();
    peerRef.current = null;
  }

  // ✅ 2. Stop local media stream
  if (localStreamRef.current) {
    localStreamRef.current.getTracks().forEach((track) => {
      track.stop();
    });
    localStreamRef.current = null;
  }

  // ✅ 3. Clear video elements
  if (localVideoRef.current) {
    localVideoRef.current.srcObject = null;
  }
  if (remoteVideoRef.current) {
    remoteVideoRef.current.srcObject = null;
  }

  // ✅ 4. Notify the other peer
  if (socketRef.current && selectedUser?._id) {
    socketRef.current.emit('end-call', { to: selectedUser._id });
  }

  // ✅ 5. Update UI state
  setIsCallActive(false);
};



  return (
    <div className="chat-layout">
      <div className="chat-grid">
        {(view === 'sidebar' || view === 'full') && (
          <ChatSidebar
            onSelectUser={(user) => {
              if (!isForwarding) {
                setSelectedUser(user);
                if (window.innerWidth < 768) setView('chat');
              }
            }}
            selectedUserId={selectedUser?._id}
            isForwarding={isForwarding}
            onSelectForwardUser={(user) => forwardMessageToUser(messageToForward, user._id)}
          />
        )}

        {(view === 'chat' || view === 'full') && selectedUser && (
          <div className="chat-main">
            <div className="chat-header">
              <h3>{selectedUser.username}</h3>
              <button onClick={startCall}>📞 Video Call</button>
            </div>

            <ChatWindow
              selectedUser={selectedUser}
              chatList={chatList}
              messages={messages}
              setMessages={setMessages}
              socket={socketRef.current}
              triggerForwardMode={triggerForwardMode}
            />

            {isCallActive && (
              <div className="video-chat">
                <video ref={localVideoRef} autoPlay muted className="video-local" />
                <video ref={remoteVideoRef} playsInline autoPlay className="video-remote" />
                <button className='end-call-btn' onClick={endCall}>End Call</button>
              </div>
            )}
          </div>
        )}
      </div>

      {incomingCall && (
        <div className="incoming-call-popup">
          <p>Incoming Video Call...</p>
          <button className='accept-btn' onClick={acceptCall}>Accept</button>
          <button className='reject-btn' onClick={() => setIncomingCall(null)}>Reject</button>
        </div>
      )}

      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
};

export default Chat;
