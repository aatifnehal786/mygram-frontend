import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

const useVideoCallStore = create(
  subscribeWithSelector((set, get) => ({
    // Call state
    currentCall: null,
    incomingCall: null,
    isCallActive: false,
    callType: null, // 'video' or 'audio'

    // Media state
    localStream: null,
    remoteStream: null,
    isVideoEnabled: true,
    isAudioEnabled: true,

    // WebRTC
   
    iceCandidatesQueue: [], // Queue for ICE candidates
    // ICE (Interactive Connectivity Establishment) is a protocol used in WebRTC to find the best path (like IP and port) between peers to establish a connection.

    // UI state
    isCallModalOpen: false,
    callStatus: "idle", // 'idle', 'calling', 'ringing', 'connecting', 'connected', 'ended'

    // Actions
    setCurrentCall: (call) => {
      console.log("📞 Setting current call:", call);
      set({ currentCall: call });
    },

    setIncomingCall: (call) => {
      console.log("📞 Setting incoming call:", call);
      set({ incomingCall: call });
    },

    setCallActive: (active) => {
      console.log("🔄 Call active:", active);
      set({ isCallActive: active });
    },

    setCallType: (type) => set({ callType: type }),

    setLocalStream: (stream) => {
      console.log("🎥 Local stream:", !!stream);
      set({ localStream: stream });
    },

    setRemoteStream: (stream) => {
      console.log("🎥 Remote stream:", !!stream);
      set({ remoteStream: stream });
    },

   

    setCallModalOpen: (open) => set({ isCallModalOpen: open }),

    setCallStatus: (status) => {
      console.log("📊 Status:", status);
      set({ callStatus: status });
    },

    // Add ICE candidate to queue
    addIceCandidate: (candidate) => {
      const { iceCandidatesQueue } = get();
      set({ iceCandidatesQueue: [...iceCandidatesQueue, candidate] });
    },

    // Process queued ICE candidates
    processQueuedIceCandidates: async () => {
      const { peerConnection, iceCandidatesQueue } = get();

      if (!peerConnection || !peerConnection.remoteDescription) return;

      const queue = [...iceCandidatesQueue];
      set({ iceCandidatesQueue: [] });

      for (const candidate of queue) {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("ICE error", e);
        }
      }
    },
    toggleVideo: () => {
      const { localStream, isVideoEnabled } = get();
      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = !isVideoEnabled;
          set({ isVideoEnabled: !isVideoEnabled });
        }
      }
    },

    toggleAudio: () => {
      const { localStream, isAudioEnabled } = get();
      if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = !isAudioEnabled;
          set({ isAudioEnabled: !isAudioEnabled });
        }
      }
    },

   endCall: () => {
  const { localStream, remoteStream } = get();

  console.log("📞 Ending call");

  if (localStream) {
    localStream.getTracks().forEach(t => t.stop());
  }

  if (remoteStream) {
    remoteStream.getTracks().forEach(t => t.stop());
  }

  

  set({
    currentCall: null,
    incomingCall: null,
    isCallActive: false,
    callType: null,
    localStream: null,
    remoteStream: null,
    isCallModalOpen: false,
    callStatus: "idle",
    isVideoEnabled: true,
    isAudioEnabled: true,
    iceCandidatesQueue: [],
  });
},

    clearIncomingCall: () => {
      console.log("🗑️ Clearing incoming call");
      set({ incomingCall: null });
    },
  }))
);

export default useVideoCallStore;
