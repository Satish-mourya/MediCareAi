import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VideoCall() {
  const { id: roomId } = useParams();
  const navigate = useNavigate();

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const socketRef = useRef();
  const peerRef = useRef();
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');

    // Get user media (video and audio as requested)
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        socketRef.current.emit('join-room', roomId, socketRef.current.id);

        socketRef.current.on('user-connected', (userId) => {
          console.log('User connected:', userId);
          createOffer(userId, stream);
        });

        socketRef.current.on('offer', handleReceiveOffer);
        socketRef.current.on('answer', handleReceiveAnswer);
        socketRef.current.on('ice-candidate', handleNewICECandidateMsg);
        socketRef.current.on('user-disconnected', () => {
          toast.error('User disconnected');
          setRemoteStream(null);
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        });
      })
      .catch((error) => {
        console.error('Error accessing media devices.', error);
        toast.error('Could not access camera/microphone');
      });

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (peerRef.current) {
        peerRef.current.close();
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const createPeer = (stream) => {
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('ice-candidate', {
          target: peer.targetUserId,
          candidate: event.candidate,
        });
      }
    };

    peer.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    stream.getTracks().forEach((track) => peer.addTrack(track, stream));

    return peer;
  };

  const createOffer = async (targetUserId, stream) => {
    peerRef.current = createPeer(stream);
    peerRef.current.targetUserId = targetUserId;
    
    try {
      const offer = await peerRef.current.createOffer();
      await peerRef.current.setLocalDescription(offer);
      socketRef.current.emit('offer', {
        target: targetUserId,
        caller: socketRef.current.id,
        sdp: offer,
      });
    } catch (e) {
      console.error('Error creating offer', e);
    }
  };

  const handleReceiveOffer = async (incoming) => {
    peerRef.current = createPeer(localStream);
    peerRef.current.targetUserId = incoming.caller;

    try {
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(incoming.sdp));
      const answer = await peerRef.current.createAnswer();
      await peerRef.current.setLocalDescription(answer);
      
      socketRef.current.emit('answer', {
        target: incoming.caller,
        sdp: answer,
      });
    } catch (e) {
      console.error('Error receiving offer', e);
    }
  };

  const handleReceiveAnswer = async (incoming) => {
    try {
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(incoming.sdp));
    } catch (e) {
      console.error('Error receiving answer', e);
    }
  };

  const handleNewICECandidateMsg = async (incoming) => {
    try {
      const candidate = new RTCIceCandidate(incoming.candidate);
      await peerRef.current.addIceCandidate(candidate);
    } catch (e) {
      console.error('Error adding ICE candidate', e);
    }
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const endCall = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <div className="flex h-screen flex-col bg-slate-900">
      <div className="flex-1 p-4">
        <div className="relative mx-auto flex h-full max-w-6xl flex-col items-center justify-center gap-4 md:flex-row">
          
          {/* Main Remote Video */}
          <div className="relative flex h-full w-full flex-1 items-center justify-center overflow-hidden rounded-2xl bg-black shadow-2xl">
            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-white/50">
                <Video className="mb-2 h-12 w-12 opacity-50" />
                <p>Waiting for the other person to join...</p>
              </div>
            )}
          </div>

          {/* Local Video Picture-in-Picture */}
          <div className="absolute bottom-6 right-6 h-48 w-36 overflow-hidden rounded-xl border-2 border-white/20 bg-black shadow-lg md:h-64 md:w-48">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex h-24 items-center justify-center gap-4 bg-slate-950 p-4">
        <button
          onClick={toggleMute}
          className={`flex h-14 w-14 items-center justify-center rounded-full transition ${
            isMuted ? 'bg-red-500 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'
          }`}
        >
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>

        <button
          onClick={toggleVideo}
          className={`flex h-14 w-14 items-center justify-center rounded-full transition ${
            isVideoOff ? 'bg-red-500 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'
          }`}
        >
          {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
        </button>

        <button
          onClick={endCall}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition hover:bg-red-700"
        >
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  );
}
