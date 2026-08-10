"use client"
import { useEffect, useCallback } from "react"
import useVideoCallStore from "../store/VideoCallStore"
import VideoCallModal from "./VideoCallModal"
import { getSocket } from "../contexts/SocketContext";
import useUserStore from "../store/useUserStore"

const VideoCallManager = ({selectedUser}) => {
  const { setIncomingCall, setCurrentCall, setCallType, setCallModalOpen, setCallStatus, endCall } = useVideoCallStore()
  const socket = getSocket();
  const loggedUser = useUserStore((state) => state.loggedUser);

  useEffect(() => {
    if (!socket) return
    // In VideoCallManager.jsx -> handleIncomingCall
const handleIncomingCall = ({ callerId, callerName, callerAvatar, callerPic, callType, callId }) => {
  console.log("Incoming call data:", { callerId, callerName, callerAvatar, callerPic })
  setIncomingCall({ 
    callerId, 
    callerName: callerName || "Unknown", 
    callerAvatar: callerAvatar || callerPic || "/placeholder.svg", 
    callId 
  })
  setCallType(callType)
  setCallModalOpen(true)
  setCallStatus("ringing")
}
    const handleCallFailed = ({ reason }) => {
      setCallStatus("failed")
      setTimeout(() => endCall(), 2000)
    }
    socket.on("incoming_call", handleIncomingCall)
    socket.on("call_failed", handleCallFailed)
    return () => {
      socket.off("incoming_call", handleIncomingCall)
      socket.off("call_failed", handleCallFailed)
    }
  }, [socket])

 const initiateCall = useCallback((receiverId, receiverName, receiverAvatar, callType = "video") => {
    const callId = `${loggedUser?.userid || loggedUser?._id}-${receiverId}-${Date.now()}`
    
    // FIX: handle both profilePic and profilePicture
    const myAvatar = loggedUser?.profilePicture || loggedUser?.profilePic || loggedUser?.avatar || "/placeholder.svg"
    const validatedAvatar = receiverAvatar && receiverAvatar !== "video" ? receiverAvatar : "/placeholder.svg"

    setCurrentCall({ callId, participantId: receiverId, participantName: receiverName, participantAvatar: validatedAvatar })
    setCallType(callType)
    setCallModalOpen(true)
    setCallStatus("calling")

    socket.emit("initiate_call", {
      callerId: loggedUser.userid || loggedUser._id || loggedUser.id,
      receiverId,
      callType,
      callId,
      callerInfo: {
        username: loggedUser.username || loggedUser.name,
        profilePicture: myAvatar, // send as profilePicture
        profilePic: myAvatar,      // also send as profilePic for safety
      },
    });
  }, [loggedUser, socket, setCurrentCall, setCallType, setCallModalOpen, setCallStatus])

  useEffect(() => {
    useVideoCallStore.getState().initiateCall = initiateCall
  }, [initiateCall])

  return <VideoCallModal selectedUser={selectedUser} />
}
export default VideoCallManager