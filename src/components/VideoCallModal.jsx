"use client"

import { useEffect, useRef, useMemo } from "react"
import { FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash, FaPhoneSlash, FaTimes } from "react-icons/fa"
import useVideoCallStore from "../store/VideoCallStore"
import { useTheme } from "../contexts/ThemeContext"
import { getSocket } from "../contexts/SocketContext"
import useUserStore from "../store/useUserStore"

const VideoCallModal = () => {
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)

  // --- FIX 2: Always-current ref for peerConnection to avoid stale closure in socket handlers ---
  const peerConnectionRef = useRef(null)

  const socket = getSocket()
  const { theme } = useTheme()

  const {
    currentCall,
    incomingCall,
    isCallActive,
    callType,
    localStream,
    remoteStream,
    isVideoEnabled,
    isAudioEnabled,
    peerConnection,
    callStatus,
    isCallModalOpen,
    toggleVideo,
    toggleAudio,
    endCall,
    setLocalStream,
    setRemoteStream,
    setPeerConnection,
    setCallStatus,
    setCallActive,
    clearIncomingCall,
    setCurrentCall,
    addIceCandidate,
    processQueuedIceCandidates,
  } = useVideoCallStore()

  const loggedUser = useUserStore((state) => state.loggedUser)

  // --- FIX 2: Keep ref in sync with React state so socket handlers always see latest pc ---
  useEffect(() => {
    peerConnectionRef.current = peerConnection
  }, [peerConnection])

  // --- FIX 1: Added TURN server so mobile (symmetric NAT) connections can relay traffic ---
  // Replace the turn: credentials below with your own from Metered.ca (free tier) or Twilio.
  
  const rtcConfiguration = new RTCPeerConnection({
  iceServers: [
      {
        urls: "stun:stun.relay.metered.ca:80",
      },
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
});

  // Memoize display info to prevent unnecessary re-renders
  const displayInfo = useMemo(() => {
    if (incomingCall && !isCallActive) {
      return {
        name: incomingCall.callerName,
        avatar: incomingCall.callerAvatar,
      }
    }
    if (currentCall) {
      return {
        name: currentCall.participantName,
        avatar: currentCall.participantAvatar,
      }
    }
    return null
  }, [incomingCall, currentCall, isCallActive])

  // --- REMOVED: the premature "connected" useEffect that fired on remoteStream arrival.
  //     Connection status is now set correctly inside oniceconnectionstatechange (see FIX 3 below). ---

  // Set up local video when localStream changes
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  // Set up remote video when remoteStream changes
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  // Initialize media stream
  const initializeMedia = async (video = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: 640, height: 480 } : false,
        audio: true,
      })
      console.log(
        "Media obtained:",
        stream.getTracks().map((t) => `${t.kind}:${t.id.slice(0, 8)}`),
      )
      setLocalStream(stream)
      return stream
    } catch (error) {
      console.error("Media error:", error)
      throw error
    }
  }

  // Create peer connection
  // --- FIX 4: Store pc immediately in peerConnectionRef so it's available
  //     before React flushes the setPeerConnection state update. ---
  const createPeerConnection = (stream, role, callInfo) => {
    const pc = new RTCPeerConnection(rtcConfiguration)

    // Store in ref immediately — don't wait for React state
    peerConnectionRef.current = pc

    // Add local tracks
    if (stream) {
      stream.getTracks().forEach((track) => {
        console.log(`${role}: Adding ${track.kind} track:`, track.id.slice(0, 8))
        pc.addTrack(track, stream)
      })
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        const participantId = callInfo?.participantId || callInfo?.callerId
        const callId = callInfo?.callId

        if (participantId && callId) {
          console.log(`${role}: Sending ICE candidate`)
          socket.emit("webrtc_ice_candidate", {
            candidate: event.candidate,
            receiverId: participantId,
            callId: callId,
          })
        }
      }
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log(`${role}: ontrack fired`, event.streams?.length)
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0])
      } else {
        const remoteMediaStream = new MediaStream([event.track])
        setRemoteStream(remoteMediaStream)
      }
    }

    // --- FIX 3: Set callStatus based on actual ICE connection state, not just remoteStream arrival ---
    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState
      console.log(`${role}: ICE state:`, state)

      if (state === "connected" || state === "completed") {
        setCallStatus("connected")
        setCallActive(true)
      } else if (state === "failed") {
        console.error(`${role}: ICE connection failed`)
        setCallStatus("failed")
        setTimeout(handleEndCall, 2000)
      } else if (state === "disconnected") {
        console.warn(`${role}: ICE disconnected — may recover`)
      }
    }

    // Overall connection state (redundant safety net)
    pc.onconnectionstatechange = () => {
      console.log(`${role}: Connection state:`, pc.connectionState)
      if (pc.connectionState === "failed") {
        setCallStatus("failed")
        setTimeout(handleEndCall, 2000)
      }
    }

    pc.onsignalingstatechange = () => {
      console.log(`${role}: Signaling state:`, pc.signalingState)
    }

    setPeerConnection(pc)
    return pc
  }

  // CALLER: Initialize call after receiver accepts
  const initializeCallerCall = async (callInfo) => {
    try {
      setCallStatus("connecting")

      // 1. Get media
      const stream = await initializeMedia(callType === "video")

      // 2. Create peer connection — pass callInfo directly to avoid stale closure
      const pc = createPeerConnection(stream, "CALLER", callInfo)

      // 3. Create and send offer
      console.log("CALLER: Creating offer...")
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === "video",
      })

      await pc.setLocalDescription(offer)

      socket.emit("webrtc_offer", {
        offer,
        receiverId: callInfo?.participantId,
        callId: callInfo?.callId,
      })

      console.log("CALLER: Offer sent")
    } catch (error) {
      console.error("CALLER error:", error)
      setCallStatus("failed")
      setTimeout(handleEndCall, 2000)
    }
  }

  // RECEIVER: Answer call
  const handleAnswerCall = async () => {
    try {
      setCallStatus("connecting")

      const callInfo = {
        callerId: incomingCall?.callerId,
        callId: incomingCall?.callId,
      }

      // 1. Get media
      const stream = await initializeMedia(callType === "video")

      // 2. Create peer connection immediately — ref is set synchronously inside createPeerConnection
      createPeerConnection(stream, "RECEIVER", callInfo)

      // 3. Send accept signal
      socket.emit("accept_call", {
        callerId: incomingCall.callerId,
        callId: incomingCall.callId,
        receiverInfo: {
          username: loggedUser?.username,
          profilePicture: loggedUser?.profilePicture,
        },
      })

      // 4. Move to current call state
      setCurrentCall({
        callId: incomingCall?.callId,
        participantId: incomingCall?.callerId,
        participantName: incomingCall?.callerName,
        participantAvatar: incomingCall?.callerAvatar,
      })

      clearIncomingCall()
      console.log("RECEIVER: Ready for offer")
    } catch (error) {
      console.error("RECEIVER error:", error)
      handleEndCall()
    }
  }

  // Handle reject call
  const handleRejectCall = () => {
    if (incomingCall) {
      socket.emit("reject_call", {
        callerId: incomingCall?.callerId,
        callId: incomingCall?.callId,
      })
    }
    endCall()
  }

  // Handle end call
  const handleEndCall = () => {
    const participantId = currentCall?.participantId || incomingCall?.callerId
    const callId = currentCall?.callId || incomingCall?.callId

    if (participantId && callId) {
      socket.emit("end_call", {
        callId: callId,
        participantId: participantId,
      })
    }
    endCall()
  }

  // Socket event listeners
  useEffect(() => {
    if (!socket) return

    // Call accepted — start caller flow
    // --- FIX 2 & 4: Pass currentCall snapshot into initializeCallerCall so it doesn't rely
    //     on stale closure values from when the effect first registered. ---
    const handleCallAccepted = ({ receiverName }) => {
      console.log("CALLER: Call accepted by", receiverName)
      // Capture currentCall from store directly at the time of event
      const latestCurrentCall = useVideoCallStore.getState().currentCall
      if (latestCurrentCall) {
        setTimeout(() => {
          initializeCallerCall(latestCurrentCall)
        }, 500)
      }
    }

    // Call rejected
    const handleCallRejected = () => {
      console.log("Call rejected")
      setCallStatus("rejected")
      setTimeout(endCall, 2000)
    }

    // Call ended
    const handleCallEnded = () => {
      console.log("Call ended by remote")
      endCall()
    }

    // Receive offer (RECEIVER)
    // --- FIX 2: Use peerConnectionRef.current instead of stale peerConnection from closure ---
    const handleWebRTCOffer = async ({ offer, senderId, callId }) => {
      console.log("RECEIVER: Received offer from", senderId)

      const pc = peerConnectionRef.current
      if (!pc) {
        console.error("RECEIVER: No peer connection available!")
        return
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer))
        console.log("RECEIVER: Remote description set")

        // Process any ICE candidates that arrived before the offer
        await processQueuedIceCandidates(pc)

        // Create and send answer
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        console.log("RECEIVER: Sending answer to", senderId)

        socket.emit("webrtc_answer", {
          answer,
          receiverId: senderId,
          callId,
        })

        console.log("RECEIVER: Answer sent, waiting for ICE...")
      } catch (error) {
        console.error("RECEIVER offer error:", error)
      }
    }

    // Receive answer (CALLER)
    // --- FIX 2: Use peerConnectionRef.current instead of stale peerConnection from closure ---
    const handleWebRTCAnswer = async ({ answer }) => {
      console.log("CALLER: Received answer")

      const pc = peerConnectionRef.current
      if (!pc) {
        console.error("CALLER: No peer connection!")
        return
      }

      if (pc.signalingState === "closed") {
        console.error("CALLER: Peer connection already closed!")
        return
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer))
        console.log("CALLER: Remote description (answer) set")

        // Process queued ICE candidates
        await processQueuedIceCandidates(pc)

        // Log receivers for debugging
        const receivers = pc.getReceivers()
        receivers.forEach((receiver, index) => {
          console.log(`CALLER: Receiver ${index + 1}:`, {
            hasTrack: !!receiver.track,
            trackKind: receiver.track?.kind,
            trackId: receiver.track?.id?.slice(0, 8),
            trackReadyState: receiver.track?.readyState,
          })
        })

        console.log("CALLER: Answer processed, waiting for ICE connection...")
      } catch (error) {
        console.error("CALLER answer error:", error)
      }
    }

    // Receive ICE candidate
    // --- FIX 2: Use peerConnectionRef.current ---
    const handleWebRTCIceCandidate = async ({ candidate, senderId }) => {
      console.log("Received ICE candidate from", senderId)

      const pc = peerConnectionRef.current
      if (pc && pc.signalingState !== "closed") {
        if (pc.remoteDescription) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate))
            console.log("ICE candidate added successfully")
          } catch (error) {
            console.error("ICE candidate error:", error)
          }
        } else {
          // Queue candidate — remote description not set yet
          addIceCandidate(candidate)
        }
      }
    }

    socket.on("call_accepted", handleCallAccepted)
    socket.on("call_rejected", handleCallRejected)
    socket.on("call_ended", handleCallEnded)
    socket.on("webrtc_offer", handleWebRTCOffer)
    socket.on("webrtc_answer", handleWebRTCAnswer)
    socket.on("webrtc_ice_candidate", handleWebRTCIceCandidate)

    console.log("Socket listeners registered")

    return () => {
      console.log("Cleaning up socket listeners...")
      socket.off("call_accepted", handleCallAccepted)
      socket.off("call_rejected", handleCallRejected)
      socket.off("call_ended", handleCallEnded)
      socket.off("webrtc_offer", handleWebRTCOffer)
      socket.off("webrtc_answer", handleWebRTCAnswer)
      socket.off("webrtc_ice_candidate", handleWebRTCIceCandidate)
    }
    // --- FIX 2: Removed peerConnection from dependency array.
    //     Handlers now use peerConnectionRef.current so the effect
    //     no longer needs to re-register every time peerConnection changes,
    //     which was itself causing the race condition. ---
  }, [socket, loggedUser])

  // Don't render if modal should not be open
  if (!isCallModalOpen && !incomingCall) {
    return null
  }

  console.log("Render:", {
    status: callStatus,
    active: isCallActive,
    local: !!localStream,
    remote: !!remoteStream,
  })

  const shouldShowActiveCall =
    isCallActive ||
    callStatus === "calling" ||
    callStatus === "connecting" ||
    callStatus === "connected"

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
              <h2
                className={`text-2xl font-semibold mb-2 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                {displayInfo?.name || "Unknown"}
              </h2>
              <p
                className={`text-lg ${
                  theme === "dark" ? "text-gray-300" : "text-gray-600"
                }`}
              >
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
                className={`w-full h-full object-cover bg-gray-800 ${
                  remoteStream ? "block" : "hidden"
                }`}
              />
            )}

            {/* Avatar / Status placeholder shown until remote stream arrives */}
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
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Call Status Badge */}
            <div className="absolute top-4 left-4">
              <div
                className={`px-4 py-2 rounded-full ${
                  theme === "dark" ? "bg-gray-800" : "bg-white"
                } bg-opacity-75`}
              >
                <p
                  className={`text-sm ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
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
                    {isVideoEnabled ? (
                      <FaVideo className="w-5 h-5" />
                    ) : (
                      <FaVideoSlash className="w-5 h-5" />
                    )}
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
                  {isAudioEnabled ? (
                    <FaMicrophone className="w-5 h-5" />
                  ) : (
                    <FaMicrophoneSlash className="w-5 h-5" />
                  )}
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

        {/* Close button shown only while still in calling state */}
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