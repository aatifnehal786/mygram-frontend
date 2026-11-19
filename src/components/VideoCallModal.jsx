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
  const callStartTime = useRef(null)

  const {
    currentCall, incomingCall, isCallActive, callType, localStream, remoteStream,
    isVideoEnabled, isAudioEnabled, peerConnection, callStatus, isCallModalOpen,
    toggleVideo, toggleAudio, endCall, setLocalStream, setRemoteStream,
    setPeerConnection, setCallStatus, setCallActive, clearIncomingCall,
    setCurrentCall, addIceCandidate, processQueuedIceCandidates,
  } = useVideoCallStore()

  const loggedUser = useUserStore((state) => state.loggedUser);

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
  }), []);

  const displayInfo = useMemo(() => {
    if (incomingCall &&!isCallActive) {
      return {
        name: incomingCall.callerName || "Unknown",
        avatar: incomingCall.callerAvatar || incomingCall.callerPic || "/placeholder.svg",
      };
    }
    if (currentCall) {
      return {
        name: currentCall.participantName || "Unknown",
        avatar: currentCall.participantAvatar || "/placeholder.svg",
      };
    }
    return { name: "Unknown", avatar: "/placeholder.svg" };
  }, [incomingCall, currentCall, isCallActive]);

  useEffect(() => {
    if (peerConnection && remoteStream) {
      setCallStatus("connected")
      setCallActive(true)
      if (!callStartTime.current) callStartTime.current = Date.now();
    }
  }, [peerConnection, remoteStream])

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      const video = remoteVideoRef.current
      video.srcObject = remoteStream
      video.onloadedmetadata = () => {
        video.play().catch(e => console.log("autoplay blocked", e))
      }
    }
  }, [remoteStream])

  const initializeMedia = async (video = true) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: video? { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" } : false,
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    })
    setLocalStream(stream)
    return stream
  }

  const createPeerConnection = (stream) => {
    const pc = new RTCPeerConnection(rtcConfiguration)
    stream.getTracks().forEach(track => pc.addTrack(track, stream))

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        const participantId = currentCall?.participantId || incomingCall?.callerId
        const callId = currentCall?.callId || incomingCall?.callId
        if (participantId && callId) {
          socket.emit("webrtc_ice_candidate", { candidate: event.candidate, receiverId: participantId, callId })
        }
      }
    }

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0])
      } else {
        const ms = new MediaStream([event.track])
        setRemoteStream(ms)
      }
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed") pc.restartIce()
    }

    setPeerConnection(pc)
    return pc
  }

  const initializeCallerCall = async () => {
    try {
      setCallStatus("connecting")
      const stream = await initializeMedia(callType === "video")
      const pc = createPeerConnection(stream)
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: callType === "video" })
      await pc.setLocalDescription(offer)
      socket.emit("webrtc_offer", { offer, receiverId: currentCall?.participantId, callId: currentCall?.callId })
    } catch (error) {
      setCallStatus("failed")
      setTimeout(() => endCall(), 2000)
    }
  }

  const handleAnswerCall = async () => {
    try {
      setCallStatus("connecting")
      const stream = await initializeMedia(callType === "video")
      createPeerConnection(stream)
      socket.emit("accept_call", {
        callerId: incomingCall.callerId,
        callId: incomingCall.callId,
        receiverInfo: { username: loggedUser?.username, profilePicture: loggedUser?.profilePicture || loggedUser?.profilePic },
      })
      setCurrentCall({
        callId: incomingCall?.callId,
        participantId: incomingCall?.callerId,
        participantName: incomingCall?.callerName,
        participantAvatar: incomingCall?.callerAvatar,
      })
      clearIncomingCall()
      callStartTime.current = Date.now()
    } catch (error) {
      handleEndCall()
    }
  }

  // ✅ FIXED REJECT - sends receiverId for call log
  const handleRejectCall = () => {
    const myId = loggedUser?.userid || loggedUser?._id || loggedUser?.id;
    if (incomingCall) {
      socket.emit("reject_call", {
        callerId: incomingCall.callerId,
        receiverId: myId,
        callId: incomingCall.callId
      })
    }
    endCall()
  }

  // ✅ FIXED END - sends duration for call log
  const handleEndCall = () => {
    const participantId = currentCall?.participantId || incomingCall?.callerId
    const callId = currentCall?.callId || incomingCall?.callId
    let duration = 0
    if (callStartTime.current) {
      duration = Math.floor((Date.now() - callStartTime.current) / 1000)
    }
    if (participantId && callId) {
      socket.emit("end_call", { callId, participantId, duration })
    }
    callStartTime.current = null
    endCall()
  }

  useEffect(() => {
    if (!socket) return
    const handleCallAccepted = () => {
      callStartTime.current = Date.now()
      setTimeout(() => initializeCallerCall(), 300)
    }
    const handleCallRejected = () => { setCallStatus("rejected"); setTimeout(endCall, 1500) }
    const handleCallEnded = () => {
      callStartTime.current = null
      endCall()
    }

    const handleWebRTCOffer = async ({ offer, senderId, callId }) => {
      if (!peerConnection) return
      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
        await processQueuedIceCandidates()
        const answer = await peerConnection.createAnswer()
        await peerConnection.setLocalDescription(answer)
        socket.emit("webrtc_answer", { answer, receiverId: senderId, callId })
      } catch (e) { console.error(e) }
    }

    const handleWebRTCAnswer = async ({ answer }) => {
      if (!peerConnection || peerConnection.signalingState === "closed") return
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
      await processQueuedIceCandidates()
    }

    const handleWebRTCIceCandidate = async ({ candidate }) => {
      if (peerConnection?.remoteDescription) {
        try { await peerConnection.addIceCandidate(new RTCIceCandidate(candidate)) } catch {}
      } else {
        addIceCandidate(candidate)
      }
    }

    socket.on("call_accepted", handleCallAccepted)
    socket.on("call_rejected", handleCallRejected)
    socket.on("call_ended", handleCallEnded)
    socket.on("webrtc_offer", handleWebRTCOffer)
    socket.on("webrtc_answer", handleWebRTCAnswer)
    socket.on("webrtc_ice_candidate", handleWebRTCIceCandidate)

    return () => {
      socket.off("call_accepted", handleCallAccepted)
      socket.off("call_rejected", handleCallRejected)
      socket.off("call_ended", handleCallEnded)
      socket.off("webrtc_offer", handleWebRTCOffer)
      socket.off("webrtc_answer", handleWebRTCAnswer)
      socket.off("webrtc_ice_candidate", handleWebRTCIceCandidate)
    }
  }, [socket, peerConnection, currentCall, incomingCall])

  if (!isCallModalOpen &&!incomingCall) return null
  const shouldShowActiveCall = isCallActive || callStatus === "calling" || callStatus === "connecting" || callStatus === "connected"
   

  return (
   <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4">
  <div
    className={`relative w-full h-full md:max-w- md:max-h- md:rounded-2xl overflow-hidden shadow-2xl ${theme === "dark" ? "bg-[#0B141A]" : "bg-[#111B21]"}`}
  >
    {/* Incoming Call UI - WhatsApp Style */}
    {incomingCall && !isCallActive && (
      <div className="flex flex-col items-center justify-center h-full p-8 bg-[#111B21]">
        <div className="text-center mb-8">
          <div className="relative mx-auto mb-5 w-fit">
            <div className="w-32 h-32 rounded-full bg-[#25D366] p- animate-pulse">
              <div className="w-full h-full rounded-full overflow-hidden bg-[#202C33]">
                <img
                  src={displayInfo?.avatar || "/placeholder.svg?height=128&width=128"}
                  alt={displayInfo?.name || "Unknown"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "/placeholder.svg?height=128&width=128"
                  }}
                />
              </div>
            </div>
            <span className="absolute bottom-1 right-1 w-5 h-5 bg-[#25D366] border- border-[#111B21] rounded-full"></span>
          </div>
          <h2 className="text- font-semibold mb-1 text-white">
            {displayInfo?.name || "Unknown"}
          </h2>
          <p className="text- text-[#25D366] font-medium flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 bg-[#25D366] rounded-full animate-ping"></span>
            Incoming {callType} call...
          </p>
          <p className="text-xs text-[#8696A0] mt-2">MyGram Video Call • End-to-end encrypted</p>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={handleRejectCall}
              className="w- h- bg-[#EA0038] hover:bg-[#C9002F] rounded-full flex items-center justify-center text-white transition shadow-lg hover:scale-105 active:scale-95"
            >
              <FaPhoneSlash className="w-6 h-6" />
            </button>
            <span className="text-xs text-[#8696A0]">Decline</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={handleAnswerCall}
              className="w- h- bg-[#25D366] hover:bg-[#1EBE5A] rounded-full flex items-center justify-center text-white transition shadow-lg shadow-[#25D366]/30 hover:scale-105 active:scale-95"
            >
              <FaVideo className="w-6 h-6" />
            </button>
            <span className="text-xs text-white">Accept</span>
          </div>
        </div>

        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
          <span className="text- text-[#8696A0] bg-white/5 px-3 py-1.5 rounded-full">💬 Message &nbsp;•&nbsp; 🔇 Mute &nbsp;•&nbsp; 📹 Video</span>
        </div>
      </div>
    )}

    {/* Active Call UI */}
    {shouldShowActiveCall && (
      <div className="relative w-full h-full bg-[#0B141A]">
        {/* Remote Video */}
        {callType === "video" && (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-cover bg-[#0B141A] ${remoteStream ? "block" : "hidden"}`}
          />
        )}

        {/* Avatar/Status Display */}
        {(!remoteStream || callType !== "video") && (
          <div className="w-full h-full bg-[#111B21] flex items-center justify-center">
            <div className="text-center px-6">
              <div className="w-32 h-32 rounded-full bg-[#25D366] p- mx-auto mb-4">
                <div className="w-full h-full rounded-full overflow-hidden bg-[#202C33]">
                  <img
                    src={displayInfo?.avatar || "/placeholder.svg?height=128&width=128"}
                    alt={displayInfo?.name || "Unknown"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "/placeholder.svg?height=128&width=128"
                    }}
                  />
                </div>
              </div>
              <p className="text-white text- font-semibold">
                {callStatus === "calling"
                  ? `Calling ${displayInfo?.name || "User"}...`
                  : callStatus === "connecting"
                    ? "Connecting..."
                    : callStatus === "connected"
                      ? displayInfo?.name || "Connected"
                      : callStatus === "failed"
                        ? "Connection failed"
                        : displayInfo?.name || "Unknown"}
              </p>
              <p className="text-[#8696A0] text-sm mt-1">
                {callStatus === "calling" ? "Ringing..." : callStatus === "connecting" ? "Please wait..." : callStatus === "connected" ? "● 00:00 • Encrypted" : ""}
              </p>
              {callStatus === "calling" && (
                <div className="flex justify-center gap-1.5 mt-4">
                  <span className="w-2 h-2 bg-[#25D366] rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-[#25D366] rounded-full animate-bounce delay-100"></span>
                  <span className="w-2 h-2 bg-[#25D366] rounded-full animate-bounce delay-200"></span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Local Video (Picture-in-Picture) - WhatsApp Style */}
        {callType === "video" && localStream && (
          <div className="absolute top-4 right-4 w-32 md:w-48 h-44 md:h-36 bg-[#202C33] rounded-xl overflow-hidden border-2 border-white/20 shadow-xl">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <span className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text- px-2 py-0.5 rounded-full backdrop-blur">You</span>
          </div>
        )}

        {/* Call Status - Top Left */}
        <div className="absolute top-4 left-4">
          <div className="px-3.5 py-1.5 rounded-full bg-black/50 backdrop-blur flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${callStatus === "connected" ? "bg-[#25D366]" : "bg-yellow-400 animate-pulse"}`}></span>
            <p className="text- text-white font-medium capitalize">
              {callStatus === "connected" ? "Connected • Encrypted" : callStatus}
            </p>
          </div>
        </div>

        {/* Name Top Center - WhatsApp Style */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 hidden md:block">
          <div className="bg-black/50 backdrop-blur px-4 py-1.5 rounded-full">
            <p className="text- text-white font-medium">{displayInfo?.name || "Unknown"}</p>
          </div>
        </div>

        {/* Call Controls - WhatsApp Style */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
          <div className="flex items-end gap-3 bg-black/40 backdrop-blur px-4 py-3 rounded-full">
            {callType === "video" && (
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={toggleVideo}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition active:scale-95 ${isVideoEnabled
                    ? "bg-white/20 hover:bg-white/30 text-white"
                    : "bg-white text-black"
                    }`}
                >
                  {isVideoEnabled ? <FaVideo className="w-5 h-5" /> : <FaVideoSlash className="w-5 h-5" />}
                </button>
                <span className="text- text-white/70">Video</span>
              </div>
            )}

            <div className="flex flex-col items-center gap-1">
              <button
                onClick={toggleAudio}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition active:scale-95 ${isAudioEnabled
                  ? "bg-white/20 hover:bg-white/30 text-white"
                  : "bg-white text-black"
                  }`}
              >
                {isAudioEnabled ? <FaMicrophone className="w-5 h-5" /> : <FaMicrophoneSlash className="w-5 h-5" />}
              </button>
              <span className="text- text-white/70">Mute</span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <button
                onClick={handleEndCall}
                className="w- h- bg-[#EA0038] hover:bg-[#C9002F] rounded-full flex items-center justify-center text-white transition shadow-lg hover:scale-105 active:scale-95"
              >
                <FaPhoneSlash className="w-5 h-5" />
              </button>
              <span className="text- text-white/70">End</span>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Close button for calling state */}
    {callStatus === "calling" && (
      <button
        onClick={handleEndCall}
        className="absolute top-4 right-4 w-9 h-9 bg-white/20 hover:bg-white/30 backdrop-blur rounded-full flex items-center justify-center text-white transition"
      >
        <FaTimes className="w-4 h-4" />
      </button>
    )}
  </div>
</div>
  )
 
}
export default VideoCallModal

