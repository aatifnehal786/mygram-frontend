// ✅ Chat.js
import React, { useEffect } from 'react';
import ChatSidebar from './ChatSideBar';
import ChatWindow from './ChatWindow';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { apiFetch } from '../api/apiFetch';
import './chat.css';
// import { UserContext } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';  
import { getSocket } from "../contexts/SocketContext";
import useChatStore from "../store/chatStore";
import useUserStore from '../store/useUserStore';




const Chat = () => {
  // const [selectedUser, setSelectedUser] = useState(null);
   const socket = getSocket();
  // const [messages, setMessages] = useState([]);
  // const {loggedUser} = useContext(UserContext)
   const loggedUser = useUserStore(
    (state) => state.loggedUser
  );
  console.log(loggedUser)
  // const [isForwarding, setIsForwarding] = useState(false);
  // const [messageToForward, setMessageToForward] = useState(null);
  const {theme} = useTheme();
  //  const [followedUsers, setFollowedUsers] = useState([]);
const {
  selectedUser,
  setSelectedUser,
  setMessages,
  addMessage,
  followedUsers,
  setFollowedUsers,
  updateUnreadCount,
  updateLastMessage,
  isForwarding,
  messageToForward,
  setForwardMode,
} = useChatStore();



 
useEffect(() => {
  if (!selectedUser || !loggedUser?.token) return;

  setMessages([]);

  const fetchChat = async () => {
    try {
      const data = await apiFetch(
        `api/chats/chat/${selectedUser._id}`
      );

      setMessages(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error(
        "Fetch chat error:",
        err
      );

      setMessages([]);
    }
  };

  fetchChat();

  const handleReceiveMessage = (msg) => {
     console.log("🔥 SOCKET MESSAGE RECEIVED", msg);

    const senderId =
      msg.sender?._id || msg.sender;

    const receiverId =
      msg.receiver?._id || msg.receiver;

    const otherUserId =
      senderId === loggedUser.userid
        ? receiverId
        : senderId;

    const isCurrentChat =
      selectedUser &&
      (
        (
          senderId === loggedUser.userid &&
          receiverId === selectedUser._id
        ) ||
        (
          receiverId === loggedUser.userid &&
          senderId === selectedUser._id
        )
      );

    if (isCurrentChat) {
      addMessage(msg);
    }

    updateLastMessage(otherUserId, msg);
  };

  socket.on("receiveMessage",
    handleReceiveMessage
  );

  return () => {
    socket.off(
      "receiveMessage",
      handleReceiveMessage
    );
  };
}, [
  selectedUser,
  loggedUser,
  socket
]);



useEffect(() => {
  if (!loggedUser?.token) return;

  const fetchFollowedUsers = async () => {
    try {
      const data = await apiFetch(
        `api/followers/${loggedUser.userid}`
      );

      setFollowedUsers(
        data.followers || []
      );
    } catch (err) {
      console.error(
        "Error fetching followed users:",
        err.message
      );
    }
  };

  fetchFollowedUsers();
}, [
  loggedUser?.token,
  loggedUser?.userid,
  setFollowedUsers,
]);

useEffect(() => {
  if (!socket) return;

  const handleUnreadUpdate = (
    data
  ) => {
    updateUnreadCount(
      data.senderId,
      data.unreadCount
    );
  };

  socket.on(
    "unreadCountUpdated",
    handleUnreadUpdate
  );

  return () => {
    socket.off(
      "unreadCountUpdated",
      handleUnreadUpdate
    );
  };
}, [
  socket,
  updateUnreadCount,
]);


// Forward message to multiple users
const forwardMessageToUsers = async (
  msg,
  receiverIds
) => {
  const receivers = Array.isArray(
    receiverIds
  )
    ? receiverIds
    : [receiverIds];

  setForwardMode(true, msg);

  try {
    for (const receiverId of receivers) {
      if (
        receiverId ===
        loggedUser.userid
      )
        continue;

      const newMsg =
        await apiFetch(
          "api/chats/chat/forward",
          {
            method: "POST",
            body: JSON.stringify({
              senderId:
                loggedUser.userid,
              receiverId,
              message:
                msg.message || "",
              fileUrl:
                msg.fileUrl || null,
              fileType:
                msg.fileType || null,
              isForwarded: true,
            }),
          }
        );

      socket?.emit(
        "sendMessage",
        newMsg
      );

      if (
        selectedUser?._id ===
        receiverId
      ) {
        addMessage(newMsg);
      }
    }

    alert(
      "Message forwarded successfully."
    );
  } catch (err) {
    console.error(
      "Forward failed:",
      err
    );

    alert("Forwarding failed.");
  } finally {
    setForwardMode(false, null);
  }
};

const triggerForwardMode = (
  msg
) => {
  setForwardMode(true, msg);

  setSelectedUser(null);
};

  

 

  return (
    <div className="flex h-screen w-full bg-gray-100 overflow-hidden">
  {/* Sidebar */}
  <div
    className={`
      w-full md:w-1/3 lg:w-1/4
      bg-white border-r
      transition-all duration-300
      ${selectedUser ? "hidden md:block" : "block"}
    `}
  >
   <ChatSidebar
  onSelectUser={(user) => {
    if (!isForwarding) {
      setSelectedUser(user);
    }
  }}
  followedUsers={followedUsers}
  selectedUserId={selectedUser?._id}
  isForwarding={isForwarding}
  onSelectForwardUser={(userIds) => {
    if (userIds.length === 0) {
      setForwardMode(false, null);
    } else {
      forwardMessageToUsers(
        messageToForward,
        userIds
      );
    }
  }}
  theme={theme}
/>
  </div>

  {/* Chat Window */}
  <div
    className={`
      flex-1 bg-gray-50
      transition-all duration-300
      ${selectedUser ? "block" : "hidden md:block"}
    `}
  >
    {selectedUser ? (
     <ChatWindow
  selectedUser={selectedUser}
  triggerForwardMode={triggerForwardMode}
  onBack={() => setSelectedUser(null)}
  theme={theme}
/>
    ) : (
      <div className="hidden md:flex h-full items-center justify-center text-gray-400">
        Select a chat to start messaging
      </div>
    )}
  </div>

  {/* Toast */}
  <ToastContainer position="bottom-right" autoClose={3000} />

 
  
</div>


  );
};

export default Chat;