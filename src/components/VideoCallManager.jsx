"use client"
import { useEffect, useCallback, useRef } from "react"
import useVideoCallStore from "../store/VideoCallStore"
import VideoCallModal from "./VideoCallModal"
import { getSocket } from "../contexts/SocketContext";
import useUserStore from "../store/useUserStore"

const VideoCallManager = ({selectedUser}) => {
  const { setIncomingCall, setCurrentCall, setCallType, setCallModalOpen, setCallStatus, endCall } = useVideoCallStore()
  const socket = getSocket();
  const loggedUser = useUserStore((state) => state.loggedUser);
  const callTimeoutRef = useRef(null);

  useEffect(() => {
    if (!socket) return

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

    const handleCallAccepted = () => {
      // ✅ clear timeout when accepted
      if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
    }

    const handleCallRejected = () => {
      if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
    }

    socket.on("incoming_call", handleIncomingCall)
    socket.on("call_failed", handleCallFailed)
    socket.on("call_accepted", handleCallAccepted)
    socket.on("call_rejected", handleCallRejected)

    return () => {
      socket.off("incoming_call", handleIncomingCall)
      socket.off("call_failed", handleCallFailed)
      socket.off("call_accepted", handleCallAccepted)
      socket.off("call_rejected", handleCallRejected)
    }
  }, [socket, setIncomingCall, setCallType, setCallModalOpen, setCallStatus, endCall])

 const initiateCall = useCallback((receiverId, receiverName, receiverAvatar, callType = "video") => {
    const myId = loggedUser?.userid || loggedUser?._id || loggedUser?.id;
    const callId = `${myId}-${receiverId}-${Date.now()}`

    const myAvatar = loggedUser?.profilePicture || loggedUser?.profilePic || loggedUser?.avatar || "/placeholder.svg"
    const validatedAvatar = receiverAvatar && receiverAvatar!== "video"? receiverAvatar : "/placeholder.svg"

    setCurrentCall({ callId, participantId: receiverId, participantName: receiverName, participantAvatar: validatedAvatar })
    setCallType(callType)
    setCallModalOpen(true)
    setCallStatus("calling")

    socket.emit("initiate_call", {
      callerId: myId,
      receiverId,
      callType,
      callId,
      callerInfo: {
        username: loggedUser.username || loggedUser.name,
        profilePicture: myAvatar,
        profilePic: myAvatar,
      },
    });

    // ✅ NEW - auto missed after 30s
    if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
    callTimeoutRef.current = setTimeout(() => {
      const { callStatus } = useVideoCallStore.getState();
      if (callStatus === "calling") {
        console.log("Call not answered - saving as missed");
        socket.emit("call_not_answered", {
          callerId: myId,
          receiverId,
          callId
        });
        endCall();
      }
    }, 30000);

  }, [loggedUser, socket, setCurrentCall, setCallType, setCallModalOpen, setCallStatus, endCall])

  // ✅ clear timeout on unmount
  useEffect(() => {
    return () => {
      if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    useVideoCallStore.getState().initiateCall = initiateCall
  }, [initiateCall])

  return <VideoCallModal selectedUser={selectedUser} />
}
export default VideoCallManager