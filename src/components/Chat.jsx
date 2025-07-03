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
  const remoteStreamRef = useRef(new MediaStream());

  const [chatList, setChatList] = useState([]);
  const [messages, setMessages] = useState([]);
  const [view, setView] = useState(window.innerWidth < 768 ? 'sidebar' : 'full');
  const [loggedUser, setLoggedUser] = useState(
    JSON.parse(sessionStorage.getItem('token-auth'))
  );
  const [incomingCall, setIncomingCall] = useState(null);

  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState('00:00');

  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const intervalRef = useRef(null);
  const callStartTime = useRef(null);
  const iceCandidateQueueRef = useRef([]);
 


  // Handle window resize for mobile/desktop view
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setView('full');
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize socket connection
  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io('https://mygram-1-1nua.onrender.com');
    }
  }, []);





  // Set up socket listeners and fetch chat messages
  useEffect(() => {
    if (!selectedUser || !loggedUser?.token) return;

    fetch(`https://mygram-1-1nua.onrender.com/chat/${selectedUser._id}`, {
      headers: { Authorization: `Bearer ${loggedUser.token}` },
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => setMessages(data || []))
      .catch(err => console.error('Fetch chat error:', err));

    const socket = socketRef.current;
    socket.emit('join', loggedUser.userid);

    socket.on('receiveMessage', (msg) => {
      const isCurrentChat =
        (msg.sender === loggedUser.userid && msg.receiver === selectedUser._id) ||
        (msg.receiver === loggedUser.userid && msg.sender === selectedUser._id);
      if (isCurrentChat) setMessages(prev => [...prev, msg]);
    });

    socket.on('incoming-call', ({ from, offer, type }) => {
      setIncomingCall({ from, offer, type }); // ✅ Include type
    });

    socket.on('call-answered', ({ answer }) => {
      console.log('📥 Received answer');
      peerRef.current?.setRemoteDescription(new RTCSessionDescription(answer));
    });


    socket.on('call-rejected', () => {
      endCall();
      setIncomingCall(null);
      toast.info('Call was rejected.');
    });

  socket.on('ice-candidate', ({ candidate }) => {
  const peer = peerRef.current;
  if (peer && peer.remoteDescription?.type) {
    peer.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
    console.log("📡 ICE candidate added");
  } else {
    iceCandidateQueueRef.current.push(candidate);
    console.log("⏳ ICE candidate queued");
  }
});


    socket.on('call-ended', () => {
      endCall();
    });

    return () => {
      socket.off('receiveMessage');
      socket.off('incoming-call');
      socket.off('call-answered');
      socket.off('call-rejected');
      socket.off('ice-candidate');
      socket.off('call-ended');
    };
  }, [selectedUser, loggedUser?.token]);

  // Handle call timer and video stream attachment
  useEffect(() => {
    if (isCallActive) {
      // Attach local stream
      if (localStreamRef.current && localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }

      // Attach remote stream if available
      if (remoteStreamRef.current && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
        console.log("✅ Attached remote stream inside useEffect");
      }

      // Start call timer
      callStartTime.current = Date.now();
      intervalRef.current = setInterval(() => {
        const diff = Math.floor((Date.now() - callStartTime.current) / 1000);
        const minutes = String(Math.floor(diff / 60)).padStart(2, '0');
        const seconds = String(diff % 60).padStart(2, '0');
        setCallDuration(`${minutes}:${seconds}`);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
      setCallDuration('00:00');
    }
  }, [isCallActive]);


  // Create WebRTC peer connection
  const createPeer = async (isInitiator, remoteUserId, isVideo) => {
  remoteStreamRef.current = new MediaStream(); // 💡 Always reset before each call

  peerRef.current = new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
    ],
  });

  // 🧊 Handle ICE candidates
  peerRef.current.onicecandidate = (e) => {
    if (e.candidate) {
      socketRef.current.emit('ice-candidate', {
        to: remoteUserId,
        candidate: e.candidate,
      });
    }
  };

  // 🎥 Handle incoming media tracks
peerRef.current.ontrack = (event) => {
  console.log('✅ Remote track received:', event.track.kind);

  remoteStreamRef.current.addTrack(event.track);

  const tryAttachRemoteStream = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
      console.log("📺 Attached remote stream");
    } else {
      // Try again after 100ms
      setTimeout(tryAttachRemoteStream, 100);
    }
  };

  tryAttachRemoteStream(); // Attempt now or retry if needed
};


  try {
    // 🎙️ Get local media
    localStreamRef.current = await navigator.mediaDevices.getUserMedia({
      video: isVideo,
      audio: true,
    });

    localStreamRef.current.getTracks().forEach(track => {
      peerRef.current.addTrack(track, localStreamRef.current);
    });

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }

    // 🎯 Initiator creates offer
    if (isInitiator) {
      const offer = await peerRef.current.createOffer();
      await peerRef.current.setLocalDescription(offer);
      socketRef.current.emit('call-user', {
        from: loggedUser.userid,
        to: selectedUser._id,
        offer,
        type: 'video',
      });
    }
  } catch (err) {
    console.error('Error accessing media devices:', err);
    toast.error('Media access denied');
  }
};


  // Start a call
const startCall = (isVideo) => {
  createPeer(true, selectedUser._id, isVideo);
  setIsCallActive(true);
};



  // Accept an incoming call
  const acceptCall = async () => {
  if (!incomingCall) return;

  const { from, offer, type } = incomingCall;
  const isVideo = type === 'video' || !type;

  console.log("📞 Accepting", type, "call from", from);

  await createPeer(false, from, isVideo);

  // 🔁 Set remote offer
  await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));

  // ❄️ Add queued ICE candidates
  iceCandidateQueueRef.current.forEach(candidate => {
    peerRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
  });
  iceCandidateQueueRef.current = [];

  // 📡 Send answer back
  const answer = await peerRef.current.createAnswer();
  await peerRef.current.setLocalDescription(answer);
  socketRef.current.emit('call-answered', { to: from, answer });

  setIncomingCall(null);
  setIsCallActive(true);
};




  // Reject an incoming call
  const rejectCall = () => {
    setIncomingCall(null);
    socketRef.current.emit('reject-call', { to: incomingCall?.from });
  };

  // End the call
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

    socketRef.current.emit('end-call', { to: selectedUser._id });
  };
console.log("🎥 local stream tracks:", localStreamRef.current?.getTracks());
console.log("📺 remote stream tracks:", remoteStreamRef.current?.getTracks());

  console.log("remoteVideoRef.current.srcObject:", remoteVideoRef.current?.srcObject);
  console.log(
  "Remote stream tracks:",
  remoteStreamRef.current.getTracks().map(t => `${t.kind} - enabled: ${t.enabled}`)
);



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
                <div>
                  <h3>{selectedUser.username}</h3>
                  {selectedUser.isOnline ? (
                    <p className="status online">🟢 Online</p>
                  ) : (
                    <p className="status offline">
                      🕒 Last seen {new Date(selectedUser.lastSeen).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              <div className="chat-header-right">

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
    <video
      ref={localVideoRef}
      autoPlay
      muted
      playsInline
      className="video-local"
    />
    <video
      ref={remoteVideoRef}
      autoPlay
      playsInline
      className="video-remote"
    />
    <p className="call-timer">⏱️ {callDuration}</p>
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
