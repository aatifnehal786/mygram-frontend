"use client"

import { useEffect, useCallback, useContext } from "react"
import useVideoCallStore from "../store/VideoCallStore"
import VideoCallModal from "./VideoCallModal"
import {UserContext} from "../contexts/UserContext"


const VideoCallManager = ({ socket , selectedUser}) => {
  const { setIncomingCall, setCurrentCall, setCallType, setCallModalOpen, setCallStatus, endCall } = useVideoCallStore()

  const {loggedUser} = useContext(UserContext)
  

  useEffect(() => {
    if (!socket) return

    // Handle incoming call
    const handleIncomingCall = ({ callerId, callerName, callerAvatar, callType, callId }) => {
      console.log("Received incoming call:", { callerId, callerName, callerAvatar, callType, callId })

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

    // Handle call failed
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

  // Memoized function to initiate a call
  const initiateCall = useCallback(
    (receiverId, receiverName, receiverAvatar, callType = "video") => {
      const callId = `${loggedUser?.userid}-${receiverId}-${Date.now()}`

      console.log("Initiating call with:", {
        receiverId,
        receiverName,
        receiverAvatar,
        callType,
        callId,
      })

      // Validate the avatar URL
      const validatedAvatar =
        receiverAvatar && receiverAvatar !== "video" ? receiverAvatar : "/placeholder.svg?height=128&width=128"

      // Set current call FIRST before opening modal
      const callData = {
        callId,
        participantId: receiverId,
        participantName: receiverName,
        participantAvatar: validatedAvatar, // Use validated avatar
      }

      setCurrentCall(callData)
      setCallType(callType)
      setCallModalOpen(true)
      setCallStatus("calling")

      // Emit the call initiation
      socket.emit("initiate_call", {
        callerId: loggedUser?.userid,
        receiverId,
        callType,
        callerInfo: {
          username: loggedUser?.username,
          profilePicture: loggedUser?.profilePicture,
        },
      })

      console.log("Call initiated, currentCall set to:", callData)
    },
    [
      loggedUser?.userid,
      loggedUser?.username,
      loggedUser?.profilePicture,
      socket,
      setCurrentCall,
      setCallType,
      setCallModalOpen,
      setCallStatus,
    ],
  )

  // Expose the initiateCall function to the store
  useEffect(() => {
    useVideoCallStore.getState().initiateCall = initiateCall
  }, [initiateCall])

  return <VideoCallModal socket={socket,selectedUser} />
}

export default VideoCallManager
