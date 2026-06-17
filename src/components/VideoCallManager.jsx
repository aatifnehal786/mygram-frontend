"use client"

import { useEffect, useCallback } from "react"
import useVideoCallStore from "../store/VideoCallStore"
import VideoCallModal from "./VideoCallModal"
import { getSocket } from "../contexts/SocketContext"
import useUserStore from "../store/useUserStore"

const VideoCallManager = ({ selectedUser }) => {
  const {
    setIncomingCall,
    setCurrentCall,
    setCallType,
    setCallModalOpen,
    setCallStatus,
    endCall,
  } = useVideoCallStore()

  const socket = getSocket()
  const loggedUser = useUserStore((state) => state.loggedUser)

  useEffect(() => {
    if (!socket) return

    // Handle incoming call notification
    const handleIncomingCall = ({
      callerId,
      callerName,
      callerAvatar,
      callType,
      callId,
    }) => {
      console.log("Received incoming call:", {
        callerId,
        callerName,
        callerAvatar,
        callType,
        callId,
      })

      setIncomingCall({
        callerId,
        callerName,
        callerAvatar,
        callId,
      })
      setCallType(callType)
      setCallModalOpen(true)
      setCallStatus("ringing")
    }

    // Handle call failed (server-side failure before WebRTC starts)
    const handleCallFailed = ({ reason }) => {
      console.error("Call failed:", reason)
      setCallStatus("failed")
      setTimeout(() => {
        endCall()
      }, 2000)
    }

    socket.on("incoming_call", handleIncomingCall)
    socket.on("call_failed", handleCallFailed)

    return () => {
      socket.off("incoming_call", handleIncomingCall)
      socket.off("call_failed", handleCallFailed)
    }
  }, [socket, setIncomingCall, setCallType, setCallModalOpen, setCallStatus, endCall])

  // Memoized function to initiate an outgoing call
  const initiateCall = useCallback(
    (receiverId, receiverName, receiverAvatar, callType = "video") => {
      const callId = `${loggedUser?.userid}-${receiverId}-${Date.now()}`

      console.log("Initiating call:", {
        receiverId,
        receiverName,
        receiverAvatar,
        callType,
        callId,
      })

      const validatedAvatar =
        receiverAvatar && receiverAvatar !== "video"
          ? receiverAvatar
          : "/placeholder.svg?height=128&width=128"

      const callData = {
        callId,
        participantId: receiverId,
        participantName: receiverName,
        participantAvatar: validatedAvatar,
      }

      setCurrentCall(callData)
      setCallType(callType)
      setCallModalOpen(true)
      setCallStatus("calling")

      socket.emit("initiate_call", {
        callerId: loggedUser.userid,
        receiverId,
        callType,
        callerInfo: {
          username: loggedUser.username,
          profilePicture: loggedUser.profilePicture,
        },
      })

      console.log("Call initiated, currentCall:", callData)
    },
    [loggedUser, socket, setCurrentCall, setCallType, setCallModalOpen, setCallStatus],
  )

  // Expose initiateCall on the store so other components can trigger calls
  useEffect(() => {
    useVideoCallStore.getState().initiateCall = initiateCall
  }, [initiateCall])

  return <VideoCallModal selectedUser={selectedUser} />
}

export default VideoCallManager