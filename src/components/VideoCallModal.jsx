"use client"
import { useEffect, useRef, useMemo } from "react"
import { FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash, FaPhoneSlash, FaTimes } from "react-icons/fa"
import useVideoCallStore from "../store/VideoCallStore"
import { useTheme } from "../contexts/ThemeContext"
import { getSocket } from "../contexts/SocketContext";
import useUserStore from "../store/useUserStore"

const VideoCallModal = () => {
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const socket = getSocket()
  const { theme } = useTheme()

  const {
    currentCall, incomingCall, isCallActive, callType,
    localStream, remoteStream, isVideoEnabled, isAudioEnabled,
    peerConnection, callStatus, isCallModalOpen,
    toggleVideo, toggleAudio, endCall, setLocalStream,
    setRemoteStream, setPeerConnection, setCallStatus,
    setCallActive, clearIncomingCall, setCurrentCall,
    addIceCandidate, processQueuedIceCandidates,
  } = useVideoCallStore()

  const loggedUser = useUserStore((state) => state.loggedUser);

  // FIX 1: This must be a PLAIN OBJECT, not a RTCPeerConnection
  const rtcConfiguration = useMemo(() => ({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun.relay.metered.ca:80" },
      {
        urls: "turn:global.relay.metered.ca:80",
        username: "5478a7ec3c7f0e7920acf1ae",
        credential: "V7y9tTE4lsW9tpKo",
      },
      {
        urls: "turn:global.relay.metered.ca:80?transport=tcp",
        username: "5478a7ec3c7f0e7920acf1ae",
        credential: "V7y9tTE4lsW9tpKo",
      },
      {
        urls: "turn:global.relay.metered.ca:443",
        username: "5478a7ec3c7f0e7920acf1ae",
        credential: "V7y9tTE4lsW9tpKo",
      },
      {
        urls: "turns:global.relay.metered.ca:443?transport=tcp",
        username: "5478a7ec3c7f0e7920acf1ae",
        credential: "V7y9tTE4lsW9tpKo",
      },
    ],
    iceTransportPolicy: "all",
    bundlePolicy: "max-bundle",
    rtcpMuxPolicy: "require"
  }), []);

  const displayInfo = useMemo(() => {
    if (incomingCall &&!isCallActive) {
      return { name: incomingCall.callerName, avatar: incomingCall.callerAvatar };
    }
    if (currentCall) {
      return { name: currentCall.participantName, avatar: currentCall.participantAvatar };
    }
    return null;
  }, [incomingCall, currentCall, isCallActive]);

  // FIX 2: Remote video must be explicitly played on mobile Chrome
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      const video = remoteVideoRef.current;
      video.srcObject = remoteStream;
      video.onloadedmetadata = async () => {
        try { await video.play(); }
        catch (e) { console.warn("Remote autoplay blocked", e) }
      };
    }
  }, [remoteStream]);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (peerConnection && remoteStream) {
      setCallStatus("connected");
      setCallActive(true);
    }
  }, [peerConnection, remoteStream]);

  const initializeMedia = async (video = true) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: video? { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" } : false,
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    setLocalStream(stream);
    return stream;
  };

  const createPeerConnection = (stream, role) => {
    const pc = new RTCPeerConnection(rtcConfiguration);

    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        const participantId = currentCall?.participantId || incomingCall?.callerId;
        const callId = currentCall?.callId || incomingCall?.callId;
        if (participantId && callId) {
          socket.emit("webrtc_ice_candidate", {
            candidate: event.candidate,
            receiverId: participantId,
            callId,
          });
        }
      }
    };

    // FIX 3: Proper ontrack handling
    pc.ontrack = (event) => {
      console.log(`${role}: ontrack received`, event.track.kind);
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      } else {
        const newStream = new MediaStream();
        newStream.addTrack(event.track);
        setRemoteStream(newStream);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed") {
        pc.restartIce();
      }
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        setCallStatus("failed");
      }
    };

    setPeerConnection(pc);
    return pc;
  };

  const initializeCallerCall = async () => {
    try {
      setCallStatus("connecting");
      const stream = await initializeMedia(callType === "video");
      const pc = createPeerConnection(stream, "CALLER");
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);
      socket.emit("webrtc_offer", {
        offer,
        receiverId: currentCall?.participantId,
        callId: currentCall?.callId,
      });
    } catch (error) {
      console.error("CALLER error:", error);
      setCallStatus("failed");
      setTimeout(() => endCall(), 2000);
    }
  };

  const handleAnswerCall = async () => {
    try {
      setCallStatus("connecting");
      const stream = await initializeMedia(callType === "video");
      createPeerConnection(stream, "RECEIVER");
      socket.emit("accept_call", {
        callerId: incomingCall.callerId,
        callId: incomingCall.callId,
        receiverInfo: {
          username: loggedUser?.username,
          profilePicture: loggedUser?.profilePicture,
        },
      });
      setCurrentCall({
        callId: incomingCall?.callId,
        participantId: incomingCall?.callerId,
        participantName: incomingCall?.callerName,
        participantAvatar: incomingCall?.callerAvatar,
      });
      clearIncomingCall();
    } catch (error) {
      console.error("RECEIVER error:", error);
      handleEndCall();
    }
  };

  const handleRejectCall = () => {
    if (incomingCall) {
      socket.emit("reject_call", { callerId: incomingCall?.callerId, callId: incomingCall?.callId });
    }
    endCall();
  };

  const handleEndCall = () => {
    const participantId = currentCall?.participantId || incomingCall?.callerId;
    const callId = currentCall?.callId || incomingCall?.callId;
    if (participantId && callId) {
      socket.emit("end_call", { callId, participantId });
    }
    endCall();
  };

  useEffect(() => {
    if (!socket) return;
    const handleCallAccepted = () => { setTimeout(() => initializeCallerCall(), 300); };
    const handleCallRejected = () => { setCallStatus("rejected"); setTimeout(endCall, 1500); };
    const handleCallEnded = () => endCall();

    const handleWebRTCOffer = async ({ offer }) => {
      if (!peerConnection) return;
      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        await processQueuedIceCandidates();
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit("webrtc_answer", { answer, receiverId: offer.senderId || incomingCall?.callerId || currentCall?.participantId, callId: currentCall?.callId || incomingCall?.callId });
      } catch (e) { console.error(e); }
    };

    const handleWebRTCAnswer = async ({ answer }) => {
      if (!peerConnection || peerConnection.signalingState === "closed") return;
      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        await processQueuedIceCandidates();
      } catch (e) { console.error(e); }
    };

    const handleWebRTCIceCandidate = async ({ candidate }) => {
      if (peerConnection && peerConnection.remoteDescription) {
        try { await peerConnection.addIceCandidate(new RTCIceCandidate(candidate)); }
        catch (e) { console.error("ICE add error", e); }
      } else {
        addIceCandidate(candidate);
      }
    };

    socket.on("call_accepted", handleCallAccepted);
    socket.on("call_rejected", handleCallRejected);
    socket.on("call_ended", handleCallEnded);
    socket.on("webrtc_offer", handleWebRTCOffer);
    socket.on("webrtc_answer", handleWebRTCAnswer);
    socket.on("webrtc_ice_candidate", handleWebRTCIceCandidate);

    return () => {
      socket.off("call_accepted", handleCallAccepted);
      socket.off("call_rejected", handleCallRejected);
      socket.off("call_ended", handleCallEnded);
      socket.off("webrtc_offer", handleWebRTCOffer);
      socket.off("webrtc_answer", handleWebRTCAnswer);
      socket.off("webrtc_ice_candidate", handleWebRTCIceCandidate);
    };
  }, [socket, peerConnection, currentCall, incomingCall]);

  if (!isCallModalOpen &&!incomingCall) return null;

  const shouldShowActiveCall = isCallActive || callStatus === "calling" || callStatus === "connecting" || callStatus === "connected";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      {/*... keep your JSX same, but change video tags to this: */}
      <div className={`relative w-full h-full max-w-4xl max-h-3xl rounded-lg overflow-hidden ${theme === "dark"? "bg-gray-900" : "bg-white"}`}>
        {shouldShowActiveCall && (
          <div className="relative w-full h-full">
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover bg-gray-800" />
            {callType === "video" && localStream && (
              <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white">
                <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror" />
              </div>
            )}
            {/* controls... */}
             <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-4">
                <button onClick={toggleVideo} className={`w-12 h-12 rounded-full flex items-center justify-center ${isVideoEnabled? "bg-gray-600" : "bg-red-500"} text-white`}><FaVideo /></button>
                <button onClick={toggleAudio} className={`w-12 h-12 rounded-full flex items-center justify-center ${isAudioEnabled? "bg-gray-600" : "bg-red-500"} text-white`}><FaMicrophone /></button>
                <button onClick={handleEndCall} className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white"><FaPhoneSlash /></button>
             </div>
          </div>
        )}
        {/* Incoming UI same as yours */}
      </div>
    </div>
  )
}
export default VideoCallModal