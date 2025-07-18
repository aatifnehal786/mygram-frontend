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

    socketRef.current.on('incoming-call', ({ from, offer }) => {
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

  useEffect(() => {
    if (isCallActive && localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
      localVideoRef.current.onloadedmetadata = () => {
        localVideoRef.current.play();
      };
    }
  }, [isCallActive]);

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
      socketRef.current?.emit("sendMessage", newMsg);

      if (selectedUser?._id === receiverId) {
        setMessages(prev => [...prev, newMsg]);
      }

      setIsForwarding(false);
      setMessageToForward(null);
      setView('chat');
    } catch (err) {
      console.error("Forward failed:", err);
    }
  };

const startCall = async () => {
 const iceServers =  [
  {
    
    urls: 'stun:global.stun.twilio.com:3478'
  },
  {
    credential: 'D0wr65tyEs/9i+Io5WxMyXTC+fInhgSwLRr1sztoDz0=',
    urls: 'turn:global.turn.twilio.com:3478?transport=udp',
    username: '57becd92f0e2b3b4ee2e8cbd61ed472f6f8d81d111e7b6a2612313d44d68ad16'
  },
  {
    credential: 'D0wr65tyEs/9i+Io5WxMyXTC+fInhgSwLRr1sztoDz0=',
    urls: 'turn:global.turn.twilio.com:3478?transport=tcp',
    username: '57becd92f0e2b3b4ee2e8cbd61ed472f6f8d81d111e7b6a2612313d44d68ad16'
  },
  {
    credential: 'D0wr65tyEs/9i+Io5WxMyXTC+fInhgSwLRr1sztoDz0=',
    urls: 'turn:global.turn.twilio.com:443?transport=tcp',
    username: '57becd92f0e2b3b4ee2e8cbd61ed472f6f8d81d111e7b6a2612313d44d68ad16'
  }
]


  peerRef.current = new RTCPeerConnection({ iceServers });

  peerRef.current.oniceconnectionstatechange = () => {
  console.log("📡 ICE Connection State:", peerRef.current.iceConnectionState);
};


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
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
     
    }
  };

  try {

      setIsCallActive(true);

    // ⏳ Wait 1 tick to ensure video DOM elements are mounted
    

    localStreamRef.current = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    // ✅ Show local video
    localVideoRef.current.srcObject = localStreamRef.current;
    localVideoRef.current.onloadedmetadata = () => {
      localVideoRef.current.play();
    };

    localStreamRef.current.getTracks().forEach((track) => {
      peerRef.current.addTrack(track, localStreamRef.current);
    });

    const offer = await peerRef.current.createOffer();
    await peerRef.current.setLocalDescription(offer);

    socketRef.current.emit('call-user', {
      from: loggedUser.userid,
      to: selectedUser._id,
      offer,
    });

    
  } catch (err) {
    console.error("Failed to start call:", err);
  }
};


 const acceptCall = async () => {
  const { from, offer } = incomingCall;

 

  const iceServers =  [
  {
    
    urls: 'stun:global.stun.twilio.com:3478'
  },
  {
    credential: 'D0wr65tyEs/9i+Io5WxMyXTC+fInhgSwLRr1sztoDz0=',
    urls: 'turn:global.turn.twilio.com:3478?transport=udp',
    username: '57becd92f0e2b3b4ee2e8cbd61ed472f6f8d81d111e7b6a2612313d44d68ad16'
  },
  {
    credential: 'D0wr65tyEs/9i+Io5WxMyXTC+fInhgSwLRr1sztoDz0=',
    urls: 'turn:global.turn.twilio.com:3478?transport=tcp',
    username: '57becd92f0e2b3b4ee2e8cbd61ed472f6f8d81d111e7b6a2612313d44d68ad16'
  },
  {
    credential: 'D0wr65tyEs/9i+Io5WxMyXTC+fInhgSwLRr1sztoDz0=',
    urls: 'turn:global.turn.twilio.com:443?transport=tcp',
    username: '57becd92f0e2b3b4ee2e8cbd61ed472f6f8d81d111e7b6a2612313d44d68ad16'
  }
]


  peerRef.current = new RTCPeerConnection({ iceServers });

  // ICE candidate handler
  peerRef.current.onicecandidate = (e) => {
    if (e.candidate) {
      socketRef.current.emit('ice-candidate', {
        to: from,
        candidate: e.candidate,
      });
    }
  };

  // 📥 Handle remote tracks
  peerRef.current.ontrack = (event) => {
    const remoteStream = event.streams[0];
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;

      // 🚫 Don't auto-play here on mobile
      console.log("📥 Remote stream set — ready to play on user gesture");
    }
  };

  try {
    setIsCallActive(true);
      // important so UI updates
    // 🎤🎥 Get local stream
    localStreamRef.current = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    // 🎬 Show local stream
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
      localVideoRef.current.play().catch(console.warn); // optional
    }

    // Add tracks to peer
    localStreamRef.current.getTracks().forEach((track) => {
      peerRef.current.addTrack(track, localStreamRef.current);
    });

    // Set remote offer
    await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));

    // Create and send answer
    const answer = await peerRef.current.createAnswer();
    await peerRef.current.setLocalDescription(answer);

    socketRef.current.emit('answer-call', { to: from, answer });

    setIncomingCall(null);
   

  } catch (err) {
    console.error("❌ Failed to accept call:", err);
  }
};



  const endCall = () => {
    peerRef.current?.close();
    peerRef.current = null;

    localStreamRef.current?.getTracks().forEach(track => track.stop());
    localStreamRef.current = null;

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    if (socketRef.current && selectedUser?._id) {
      socketRef.current.emit('end-call', { to: selectedUser._id });
    }

    setIsCallActive(false);
  };

const tryPlayRemoteVideo = () => {
  let attempts = 0;

  const playInterval = setInterval(() => {
    const video = remoteVideoRef.current;

    if (video && video.srcObject) {
      video.muted = false;
      video
        .play()
        .then(() => {
          console.log("✅ Remote video is playing");
          clearInterval(playInterval);
        })
        .catch((err) => {
          console.warn("❌ Play failed, retrying...", err);
        });

      attempts++;
      if (attempts > 10) clearInterval(playInterval); // avoid infinite loop
    } else {
      console.log("⏳ Waiting for remote video to mount...");
    }
  }, 300); // check every 300ms
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
                <video ref={localVideoRef} playsInline muted autoPlay  className="video-local" />
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

    <button
  className="accept-btn"
  onClick={async () => {
    await acceptCall(); // setup connection
    tryPlayRemoteVideo(); // play only when ready
  }}
>
  Accept
</button>

    

    <button className="reject-btn" onClick={() => setIncomingCall(null)}>
      Reject
    </button>
  </div>
)}


      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
};

export default Chat;