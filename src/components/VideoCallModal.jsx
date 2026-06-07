"use client"

import { useEffect, useRef, useMemo, useContext } from "react"
import { FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash, FaPhoneSlash, FaTimes } from "react-icons/fa"
import useVideoCallStore from "../store/VideoCallStore"
import {UserContext} from "../contexts/UserContext"
import {useTheme} from "../contexts/ThemeContext"

const VideoCallModal = ({ socket,selectedUser }) => {
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)

  const {
    currentCall,
    incomingCall,
    isCallActive,
    callType,
    localStream,
    remoteStream,
    isVideoEnabled,
    isAudioEnabled,
    callStatus,
    isCallModalOpen,
    toggleVideo,
    toggleAudio,
    endCall,
    setLocalStream,
    setCallStatus,
    setCallActive,
    clearIncomingCall,
    setCurrentCall,
    processQueuedIceCandidates,
  } = useVideoCallStore()

  const {loggedUser} = useContext(UserContext)
  const user = loggedUser || {}
  const {theme} = useTheme()
  const peerRef = useRef(null);

  // The rtcConfiguration object you posted is used to configure a WebRTC peer-to-peer connection. 
  // Specifically, it helps define how two browsers can discover and connect to each other, 
  // even when they're behind firewalls or NATs.
  const rtcConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
    ],
  }

  // Memoize display info to prevent unnecessary re-renders
  // const displayInfo = useMemo(() => {
  //   if (incomingCall && !isCallActive) {
  //     return {
  //       name: incomingCall.callerName,
  //       avatar: incomingCall.callerAvatar,
  //     }
  //   } else if (currentCall) {
  //     return {
  //       name: currentCall.participantName,
  //       avatar: currentCall.participantAvatar,
  //     }
  //   }
  //   return null
  // }, [incomingCall, currentCall, isCallActive])

  // Connection detection
// useEffect(() => {
//   if (!peerRef.current) return;

//   const handleStateChange = () => {
//     console.log("STATE:", peerRef.current.connectionState);

//     if (peerRef.current.connectionState === "connected") {
//       setCallStatus("connected");
//       setCallActive(true);
//     }

//     if (
//       peerRef.current.connectionState === "failed" ||
//       peerRef.current.connectionState === "disconnected"
//     ) {
//       setCallStatus("failed");
//     }
//   };

//   peerRef.current.addEventListener("connectionstatechange", handleStateChange);

//   return () => {
//     peerRef.current.removeEventListener("connectionstatechange", handleStateChange);
//   };
// }, [peerRef.current]);

  // Set up local video when localStream changes
 useEffect(() => {
  const video = localVideoRef.current;
  if (!video || !localStream) return;

  video.srcObject = localStream;
  video.muted = true;
  video.playsInline = true;
  video.autoplay = true;

  video.play().catch(() => {
    console.log("Local video play blocked (mobile safe)");
  });
}, [localStream]);

  // Set up remote video when remoteStream changes
useEffect(() => {
  const video = remoteVideoRef.current;
  if (!video || !remoteStream) return;

  video.srcObject = remoteStream;
  video.play().catch(() => {});
}, [remoteStream]);

  // Initialize media stream
 const initializeMedia = async (video = true) => {
  try {
    const constraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: video
        ? {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          }
        : false,
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    // 🔥 STOP OLD STREAM (VERY IMPORTANT)
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }

    setLocalStream(stream);

    console.log(
      "Media obtained:",
      stream.getTracks().map(t => `${t.kind}:${t.id.slice(0, 8)}`)
    );

    return stream;
  } catch (error) {
    console.error("Media error:", error);

    // 🔥 FALLBACK: audio-only retry (WhatsApp behavior)
    if (video) {
      console.log("Retrying with audio only...");

      return await initializeMedia(false);
    }

    throw error;
  }
};

  // Create peer connection
  const createPeerConnection = (stream) => {
  const pc = new RTCPeerConnection(rtcConfiguration);

  // STORE globally in ref-like way (IMPORTANT)

    peerRef.current = pc;
    // Add tracks
  stream.getTracks().forEach(track => {
    pc.addTrack(track, stream);
  });

  // ICE candidate
  pc.onicecandidate = (event) => {
    if (event.candidate && socket) {
      const id = currentCall?.participantId || incomingCall?.callerId;
      const callId = currentCall?.callId || incomingCall?.callId;

      socket.emit("webrtc_ice_candidate", {
        candidate: event.candidate,
        receiverId: id,
        callId
      });
    }
  };

  // ✅ CLEAN ONTRACK (WhatsApp style)
  pc.ontrack = (event) => {
    console.log("ONTRACK RECEIVED");

    if (remoteVideoRef.current && event.streams[0]) {
      remoteVideoRef.current.srcObject = event.streams[0];

      remoteVideoRef.current.play().catch(() => {});
    }
  };

  pc.onconnectionstatechange = () => {
    console.log("STATE:", pc.connectionState);

    if (pc.connectionState === "connected") {
      setCallStatus("connected");
      setCallActive(true);
    }

    if (pc.connectionState === "failed") {
      setCallStatus("failed");
    }
  };

    
    return pc;
};

  // CALLER: Initialize call after acceptance
  const callStartedRef = useRef(false);

const initializeCallerCall = async () => {
  try {
    if (callStartedRef.current) return;
    callStartedRef.current = true;

    setCallStatus("connecting");

    const stream = await initializeMedia(callType === "video");

    const pc = createPeerConnection(stream, "CALLER");

    const receiverId = currentCall?.participantId || incomingCall?.callerId;
    const callId = currentCall?.callId || incomingCall?.callId;

    console.log("CALLER: Creating offer...");

    const offer = await pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: callType === "video",
    });

    await pc.setLocalDescription(offer);

    socket.emit("webrtc_offer", {
      offer,
      receiverId,
      callId,
    });

  } catch (error) {
    console.error("CALLER error:", error);
    setCallStatus("failed");
    callStartedRef.current = false;
    setTimeout(handleEndCall, 2000);
  }
};

  // RECEIVER: Answer call
const handleAnswerCall = async () => {
  try {
    setCallStatus("connecting");

    const stream = await initializeMedia(callType === "video");

    setCurrentCall({
      callId: incomingCall.callId,
      participantId: incomingCall.callerId,
      participantName: incomingCall.callerName,
      participantAvatar: incomingCall.callerAvatar,
    });

    clearIncomingCall();

    const pc = createPeerConnection(stream, "RECEIVER");

    socket.emit("accept_call", {
      callerId: incomingCall.callerId,
      callId: incomingCall.callId,
      receiverInfo: {
        username: user.username,
        profilePicture: user.profilePicture,
      },
    });

  } catch (err) {
    console.error(err);
    handleEndCall();
  }
};
  // Handle reject call
 const handleRejectCall = () => {
  try {
    const callerId = incomingCall?.callerId;
    const callId = incomingCall?.callId;

    if (callerId && callId) {
      socket.emit("reject_call", {
        callerId,
        callId,
      });
    }

    endCall();
  } catch (err) {
    console.error(err);
  }
};

  // Handle end call
 const handleEndCall = () => {
  try {
    const participantId =
      currentCall?.participantId || incomingCall?.callerId;

    const callId =
      currentCall?.callId || incomingCall?.callId;

    // 1. Notify backend
    if (participantId && callId) {
      socket.emit("end_call", {
        callId,
        participantId,
      });
    }

    // 2. reset call flag
    callStartedRef.current = false;

    // 3. END CALL (UI + streams)
    endCall();

    // 4. IMPORTANT: close peer manually (if not inside store)
    if (peerRef?.current) {
      peerRef.current.getSenders?.().forEach(sender => {
        try {
          sender.track?.stop();
        } catch(err) {console.log(err)}
      });

      peerRef.current.close();
      peerRef.current = null;
    }

    // 5. cleanup video tags (safe fallback)
    if (localVideoRef?.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef?.current) remoteVideoRef.current.srcObject = null;

  } catch (err) {
    console.error("End call error:", err);
  }
};

  // Socket event listeners - FIXED
  useEffect(() => {
    if (!socket) return


    // Call accepted - start caller flow
    const handleCallAccepted = ({ receiverName }) => {
      console.log("CALL ACCEPTED BY:", receiverName);

      if (!peerRef.current) return;

      setTimeout(() => {
        initializeCallerCall();
      }, 800); // important for mobile stability
    };

    // Call rejected
    const handleCallRejected = () => {
      console.log("CALL REJECTED");

      setCallStatus("rejected");

      setTimeout(() => {
        endCall();
      }, 2000);
    };
    // Call ended
    const handleCallEnded = () => {
      console.log("CALL ENDED");

      callStartedRef.current = false;
      endCall();
    };

    // Receive offer (RECEIVER)
   const handleWebRTCOffer = async ({ offer, senderId, callId }) => {
  try {
    if (!peerRef.current) return;

    await peerRef.current.setRemoteDescription(
      new RTCSessionDescription(offer)
    );

    await processQueuedIceCandidates();

    const answer = await peerRef.current.createAnswer();
    await peerRef.current.setLocalDescription(answer);

    socket.emit("webrtc_answer", {
      answer,
      receiverId: senderId,
      callId,
    });

  } catch (err) {
    console.error("Offer error", err);
  }
};
    // Receive answer (CALLER) - CRITICAL FIX
   const handleWebRTCAnswer = async ({ answer }) => {
  try {
   await peerRef.current.setRemoteDescription(
  new RTCSessionDescription(answer)
);
    await processQueuedIceCandidates();

    console.log("CALL CONNECTING...");
  } catch (err) {
    console.error(err);
  }
};

    // Receive ICE candidate
 const handleWebRTCIceCandidate = async ({ candidate }) => {
  try {
    if (!peerRef.current) return;

    await peerRef.current.addIceCandidate(
      new RTCIceCandidate(candidate)
    );

  } catch (err) {
    console.error("ICE error", err);
  }
};

    // Register all event listeners
    socket.on("call_accepted", handleCallAccepted)
    socket.on("call_rejected", handleCallRejected)
    socket.on("call_ended", handleCallEnded)
    socket.on("webrtc_offer", handleWebRTCOffer)
    socket.on("webrtc_answer", handleWebRTCAnswer)
    socket.on("webrtc_ice_candidate", handleWebRTCIceCandidate)

    console.log("Socket listeners registered")

    return () => {
      console.log("🔌 Cleaning up socket listeners...")
      socket.off("call_accepted", handleCallAccepted)
      socket.off("call_rejected", handleCallRejected)
      socket.off("call_ended", handleCallEnded)
      socket.off("webrtc_offer", handleWebRTCOffer)
      socket.off("webrtc_answer", handleWebRTCAnswer)
      socket.off("webrtc_ice_candidate", handleWebRTCIceCandidate)
    }
  }, [socket, peerRef.current, currentCall, incomingCall, user.username, user.profilePicture])

  // Don't render if modal should not be open
  if (!isCallModalOpen && !incomingCall) {
    return null
  }

  console.log("🎬 Render:", {
    status: callStatus,
    active: isCallActive,
    local: !!localStream,
    remote: !!remoteStream,
  })

  const shouldShowActiveCall = isCallActive || callStatus === "calling" || callStatus === "connecting"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div
        className={`relative w-full h-full max-w-4xl max-h-3xl rounded-lg overflow-hidden ${
          theme === "dark" ? "bg-gray-900" : "bg-white"
        }`}
      >
        {/* Incoming Call UI */}
        {incomingCall && !isCallActive && (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="text-center mb-8">
              <div className="w-32 h-32 rounded-full bg-gray-300 mx-auto mb-4 overflow-hidden">
                <img
                  src={selectedUser?.profilePicture || "/placeholder.svg?height=128&width=128"}
                  alt={selectedUser?.username || "Unknown"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "/placeholder.svg?height=128&width=128"
                  }}
                />
              </div>
              <h2 className={`text-2xl font-semibold mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                {selectedUser?.username || "Unknown"}
              </h2>
              <p className={`text-lg ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                Incoming {callType} call...
              </p>
            </div>

            <div className="flex space-x-6">
              <button
                onClick={handleRejectCall}
                className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <FaPhoneSlash className="w-6 h-6" />
              </button>
              <button
                onClick={handleAnswerCall}
                className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <FaVideo className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {/* Active Call UI */}
        {shouldShowActiveCall && (
          <div className="relative w-full h-full">
            {/* Remote Video */}
            {callType === "video" && (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover bg-gray-800 ${remoteStream ? "block" : "hidden"}`}
              />
            )}

            {/* Avatar/Status Display */}
            {(!remoteStream || callType !== "video") && (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 rounded-full bg-gray-600 mx-auto mb-4 overflow-hidden">
                    <img
                      src={user?.profilePicture || "/placeholder.svg?height=128&width=128"}
                      alt={user?.username || "Unknown"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "/placeholder.svg?height=128&width=128"
                      }}
                    />
                  </div>
                  <p className="text-white text-xl">
                    {callStatus === "calling"
                      ? `Calling ${user?.username || "User"}...`
                      : callStatus === "connecting"
                        ? "Connecting..."
                        : callStatus === "connected"
                          ? user?.username || "Connected"
                          : callStatus === "failed"
                            ? "Connection failed"
                            : user?.username || "Unknown"}
                  </p>
                </div>
              </div>
            )}

            {/* Local Video (Picture-in-Picture) */}
            {callType === "video" && localStream && (
              <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white">
                <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              </div>
            )}

            {/* Call Status */}
            <div className="absolute top-4 left-4">
              <div className={`px-4 py-2 rounded-full ${theme === "dark" ? "bg-gray-800" : "bg-white"} bg-opacity-75`}>
                <p className={`text-sm ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                  {callStatus === "connected" ? "Connected" : callStatus}
                </p>
              </div>
            </div>

            {/* Call Controls */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
              <div className="flex space-x-4">
                {callType === "video" && (
                  <button
                    onClick={toggleVideo}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      isVideoEnabled
                        ? "bg-gray-600 hover:bg-gray-700 text-white"
                        : "bg-red-500 hover:bg-red-600 text-white"
                    }`}
                  >
                    {isVideoEnabled ? <FaVideo className="w-5 h-5" /> : <FaVideoSlash className="w-5 h-5" />}
                  </button>
                )}

                <button
                  onClick={toggleAudio}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    isAudioEnabled
                      ? "bg-gray-600 hover:bg-gray-700 text-white"
                      : "bg-red-500 hover:bg-red-600 text-white"
                  }`}
                >
                  {isAudioEnabled ? <FaMicrophone className="w-5 h-5" /> : <FaMicrophoneSlash className="w-5 h-5" />}
                </button>

                <button
                  onClick={handleEndCall}
                  className="w-12 h-12 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  <FaPhoneSlash className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Close button for calling state */}
        {callStatus === "calling" && (
          <button
            onClick={handleEndCall}
            className="absolute top-4 right-4 w-8 h-8 bg-gray-600 hover:bg-gray-700 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

export default VideoCallModal
