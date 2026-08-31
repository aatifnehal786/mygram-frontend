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
                  src={displayInfo?.avatar || "/placeholder.svg?height=128&width=128"}
                  alt={displayInfo?.name || "Unknown"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "/placeholder.svg?height=128&width=128"
                  }}
                />
              </div>
              <h2 className={`text-2xl font-semibold mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                {displayInfo?.name || "Unknown"}
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
                      src={displayInfo?.avatar || "/placeholder.svg?height=128&width=128"}
                      alt={displayInfo?.name || "Unknown"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "/placeholder.svg?height=128&width=128"
                      }}
                    />
                  </div>
                  <p className="text-white text-xl">
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

