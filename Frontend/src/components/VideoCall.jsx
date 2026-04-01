import React, { useEffect, useRef, useState } from 'react';
import { Box, styled, IconButton, Tooltip, Typography, Avatar, CircularProgress } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Mic, MicOff, Videocam, VideocamOff, CallEnd } from '@mui/icons-material';

const VideoContainer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: '#000',
  zIndex: 1000,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: theme.spacing(3),
  overflow: 'hidden',
  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
}));

const RemoteVideo = styled('video')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
});

const LocalVideoContainer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: 30,
  right: 30,
  width: 150,
  height: 200,
  borderRadius: 16,
  overflow: 'hidden',
  boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
  border: `2px solid ${alpha(theme.palette.primary.main, 0.5)}`,
  backgroundColor: '#111',
  zIndex: 1010,
  transition: 'transform 0.3s',
  '&:hover': {
    transform: 'scale(1.05)',
  }
}));

const LocalVideo = styled('video')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
});

const ControlsOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: 40,
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  gap: theme.spacing(2),
  background: alpha('#000000', 0.6),
  padding: theme.spacing(1.5, 3),
  borderRadius: 40,
  backdropFilter: 'blur(10px)',
  zIndex: 1020,
}));

const ControlButton = styled(IconButton)(({ theme, active, error }) => ({
  backgroundColor: active ? alpha(theme.palette.common.white, 0.2) : alpha(theme.palette.error.main, 0.9),
  color: theme.palette.common.white,
  '&:hover': {
    backgroundColor: active ? alpha(theme.palette.common.white, 0.3) : theme.palette.error.dark,
  },
  ...(error && {
    backgroundColor: theme.palette.error.main,
    '&:hover': {
      backgroundColor: theme.palette.error.dark,
    }
  }),
  width: 52,
  height: 52,
}));

const StateOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(2),
  color: 'white',
  zIndex: 1005,
}));

const VideoCall = ({ socket, currentUser, targetUserId, mode, incomingSignal, endCallCallback, targetParticipant }) => {
  const [stream, setStream] = useState(null);
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [callStatus, setCallStatus] = useState('connecting'); // connecting, ringing, connected, ended

  const myVideo = useRef(null);
  const userVideo = useRef(null);
  const connectionRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    let peer = null;

    const setupMediaAndWebRTC = async () => {
      try {
        const currentStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(currentStream);
        streamRef.current = currentStream;

        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        }

        peer = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        });
        connectionRef.current = peer;

        currentStream.getTracks().forEach((track) => peer.addTrack(track, currentStream));

        peer.ontrack = (event) => {
          setCallStatus('connected');
          if (userVideo.current) {
            userVideo.current.srcObject = event.streams[0];
          }
        };

        peer.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('iceCandidate', {
              to: targetUserId,
              candidate: event.candidate,
            });
          }
        };

        peer.oniceconnectionstatechange = () => {
            if (peer.iceConnectionState === 'disconnected' || peer.iceConnectionState === 'failed') {
               leaveCall();
            }
        };

        if (mode === 'caller') {
          setCallStatus('calling');
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          socket.emit('callUser', {
            userToCall: targetUserId,
            signalData: peer.localDescription,
            from: currentUser._id,
            name: `${currentUser.firstName} ${currentUser.lastName}`
          });
        } else if (mode === 'receiver' && incomingSignal) {
          setCallStatus('connecting');
          await peer.setRemoteDescription(new RTCSessionDescription(incomingSignal));
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          socket.emit('answerCall', {
            signal: peer.localDescription,
            to: targetUserId 
          });
        }

      } catch (err) {
        console.error('Failed to get user media or setup peer', err);
        setCallStatus('error');
      }
    };

    setupMediaAndWebRTC();

    const handleCallAccepted = async (signal) => {
      if (mode === 'caller' && connectionRef.current) {
        setCallStatus('connected');
        try {
            await connectionRef.current.setRemoteDescription(new RTCSessionDescription(signal));
        } catch (e) {
            console.error('Failed to set remote description on call accept', e);
        }
      }
    };

    const handleIceCandidate = async (candidate) => {
      if (connectionRef.current && connectionRef.current.remoteDescription) {
        try {
            await connectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
            console.error('Error adding received ice candidate', e);
        }
      }
    };

    const handleEndCall = () => {
      leaveCall(true);
    };

    socket.on('callAccepted', handleCallAccepted);
    socket.on('iceCandidate', handleIceCandidate);
    socket.on('endCall', handleEndCall);

    return () => {
      socket.off('callAccepted', handleCallAccepted);
      socket.off('iceCandidate', handleIceCandidate);
      socket.off('endCall', handleEndCall);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
            track.stop();
        });
      }
      if (peer) {
        peer.close();
      }
    };
  }, []);

  const toggleMic = () => {
    if (stream) {
      stream.getAudioTracks()[0].enabled = !micActive;
      setMicActive(!micActive);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks()[0].enabled = !videoActive;
      setVideoActive(!videoActive);
    }
  };

  const leaveCall = (fromRemote) => {
    setCallStatus('ended');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (connectionRef.current) {
      connectionRef.current.close();
    }
    if (!fromRemote) {
        socket.emit('endCall', { to: targetUserId });
    }
    endCallCallback();
  };

  return (
    <VideoContainer>
      {/* Remote Video */}
      <RemoteVideo playsInline autoPlay ref={userVideo} />

      {/* State Overlay when not connected */}
      {callStatus !== 'connected' && (
        <StateOverlay>
          <Avatar 
             src={targetParticipant?.avatar} 
             sx={{ width: 100, height: 100, mb: 1, boxShadow: '0 0 30px rgba(0,0,0,0.5)' }} 
          />
          <Typography variant="h5" fontWeight="600">
            {targetParticipant?.firstName} {targetParticipant?.lastName}
          </Typography>
          {callStatus === 'calling' && (
            <Typography variant="subtitle1" sx={{ opacity: 0.8, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} color="inherit" /> Calling...
            </Typography>
          )}
          {callStatus === 'connecting' && <Typography variant="subtitle1" sx={{ opacity: 0.8 }}>Connecting...</Typography>}
          {callStatus === 'error' && <Typography variant="subtitle1" color="error">Could not start video call</Typography>}
        </StateOverlay>
      )}

      {/* Local Video Picture-in-Picture */}
      <LocalVideoContainer>
         <LocalVideo playsInline muted autoPlay ref={myVideo} />
      </LocalVideoContainer>

      {/* Controls */}
      <ControlsOverlay>
        <Tooltip title={micActive ? 'Mute' : 'Unmute'}>
          <ControlButton onClick={toggleMic} active={micActive}>
            {micActive ? <Mic /> : <MicOff />}
          </ControlButton>
        </Tooltip>
        
        <Tooltip title="End Call">
          <ControlButton onClick={() => leaveCall(false)} error>
            <CallEnd />
          </ControlButton>
        </Tooltip>

        <Tooltip title={videoActive ? 'Stop Video' : 'Start Video'}>
          <ControlButton onClick={toggleVideo} active={videoActive}>
            {videoActive ? <Videocam /> : <VideocamOff />}
          </ControlButton>
        </Tooltip>
      </ControlsOverlay>
    </VideoContainer>
  );
};

export default VideoCall;
