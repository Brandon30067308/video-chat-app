import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { withRouter } from 'react-router-dom';
import Peer from 'simple-peer';
import RoomHeader from '../RoomHeader';
import PeerVideo from '../PeerVideo';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faVideo,
  faMicrophone,
  faVideoSlash,
  faTimes,
  faMicrophoneSlash
} from '@fortawesome/free-solid-svg-icons';

const Room = ({ props }) => {
  const name = props?.location?.state?.name;
  const [audioEnabled, setAudioEnabled] = useState(props?.location?.state?.audioEnabled);
  const [videoEnabled, setVideoEnabled] = useState(props?.location?.state?.videoEnabled);
  const [peers, setPeers] = useState([]);
  const peersRef = useRef([]);
  const socketRef = useRef();
  const streamRef = useRef();
  const userVideo = useRef();
  const mediaRef = useRef([props?.location?.state?.audioEnabled,
  props?.location?.state?.videoEnabled]);
  const roomID = props.match.params.roomID;
  const copiedRef = useRef();

  const setUserMedia = (audio, value) => {
    /* media ref -> [audio, video] */
    audio ? setAudioEnabled(value) : setVideoEnabled(value);
    mediaRef.current = audio ?
      [value, mediaRef.current[1]] :
      [mediaRef.current[0], value];
  }

  const handleLeave = () => {
    peersRef.current = [];
    setVideoEnabled(false);
    setAudioEnabled(false);
    streamRef.current && streamRef.current.getTracks().forEach(s => s?.stop());
    setPeers([]);
    socketRef.current.disconnect();
    props.history.push('/');
  }

  useEffect(() => {
    socketRef.current && socketRef.current.emit('media-update', {
      roomID,
      audioEnabled: mediaRef.current[0],
      videoEnabled
    });
    const videoTrack = streamRef.current && streamRef.current.getTracks()
      .find(track => track.kind === 'video');
    if (videoTrack) videoTrack.enabled = videoEnabled;
  }, [videoEnabled, roomID]);

  useEffect(() => {
    socketRef.current && socketRef.current.emit('media-update', {
      audioEnabled,
      videoEnabled: mediaRef.current[1]
    });
    const audioTrack = streamRef.current && streamRef.current.getTracks()
      .find(track => track.kind === 'audio');
    if (audioTrack) audioTrack.enabled = audioEnabled;
  }, [audioEnabled, roomID]);

  useEffect(() => {
    socketRef.current = io.connect('/');
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      stream.getTracks().find(track => track.kind === 'video').enabled = videoEnabled;
      stream.getTracks().find(track => track.kind === 'audio').enabled = audioEnabled;

      streamRef.current = stream;

      if (userVideo.current) {
        userVideo.current.srcObject = stream;
      }

      socketRef.current.emit('join-room', { name, roomID });

      socketRef.current.on('peer-media-update', ({
        audioEnabled,
        videoEnabled,
        peerID
      }) => {
        peersRef.current = [...peersRef.current].map(p => {
          return p.peerID === peerID ? {
            ...p,
            audioEnabled,
            videoEnabled
          } :
            p
        });
        setPeers(prevPeers => {
          return prevPeers.map(p => {
            return p.peerID === peerID ? {
              ...p,
              audioEnabled,
              videoEnabled
            } :
              p
          });
        })
      });

      socketRef.current.on('user-left', id => {
        console.log('user left: ', id);
        const peer = peersRef.current.find(p => p.peerID === id);
        if (peer) {
          peer.peer.destroy();
        }

        const newPeers = [...peersRef.current].filter(p => p.peerID !== id);

        peersRef.current = newPeers;

        setPeers(newPeers.map(({ name, peer, peerID, audioEnabled, videoEnabled }) =>
          ({ name, peerID, peer, audioEnabled, videoEnabled })));
      });

      socketRef.current.on('all-users', users => {
        const peersCopy = [];
        users.forEach(({ name, id: userID }) => {
          /*  create a peer object for every user in the room */
          const peer = createPeer(userID, socketRef.current.id, stream);
          peersRef.current.push({
            name,
            peerID: userID,
            peer,
            recieved: false,
            audioEnabled: false,
            videoEnabled: false
          });
          peersCopy.push({
            name,
            peer,
            peerID: userID,
            audioEnabled: false,
            videoEnabled: false
          });
        });
        setPeers(peersCopy);
      });

      socketRef.current.on('user-joined', ({ signal, callerID, name, audioEnabled, videoEnabled }) => {
        console.log('user joined: ', name, signal);
        /* create a new peer for the new user and add to the list of peers */
        const peer = addPeer(signal, callerID, stream);

        /* add new peer to list of peers */
        peersRef.current.push({
          name,
          peerID: callerID,
          peer,
          recieved: false,
          audioEnabled,
          videoEnabled
        });

        const newPeer = {
          name,
          peer,
          peerID: callerID,
          audioEnabled,
          videoEnabled
        }

        setPeers(prevPeers => [...prevPeers, newPeer]);
      });
    });

    return () => {
      handleLeave();
    }
  }, []);


  function createPeer(userToSignal, callerID, stream) {
    console.log('creating peer for existing user: ', userToSignal);
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream
    });

    peer.on('signal', signal => {
      console.log('signal received for existing user peer: ', userToSignal);
      /* send the signal to 'userToSignal' */
      socketRef.current.emit('sending-signal', {
        userToSignal, callerID, name, signal,
        audioEnabled, videoEnabled
      });
    });

    socketRef.current.on('recieved-signal', ({ signal, id, audioEnabled, videoEnabled }) => {
      console.log('received back signal from existing user: ', signal);
      const item = peersRef.current.find(p => p.peerID === id);
      if (item.recieved === false) {
        const updatedPeer = {
          ...item,
          recieved: true,
          audioEnabled,
          videoEnabled
        }

        const newPeers = [...peersRef.current].map(item => {
          return id === item.peerID ? {
            name: item.name,
            peer: item.peer,
            peerID: item.peerID,
            audioEnabled,
            videoEnabled
          } : {
            name: item.name,
            peer: item.peer,
            peerID: item.peerID,
            audioEnabled: item.audioEnabled,
            videoEnabled: item.videoEnabled
          };
        });

        /* update peer media */
        setPeers(newPeers);

        peersRef.current[peersRef.current.indexOf(item)] = updatedPeer;
        item.peer.signal(signal);
      }
    });

    return peer;
  }

  function addPeer(incomingSignal, callerID, stream) {
    console.log('adding new peer: ', incomingSignal);
    /* incomingSignal -> signal recieved from new user */
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream
    });
    peer.on('signal', signal => {
      console.log('returning signal to new user: ', signal);
      socketRef.current.emit('returning-signal', {
        signal,
        callerID,
        audioEnabled: mediaRef.current[0],
        videoEnabled: mediaRef.current[1]
      });
    });

    peer.signal(incomingSignal);

    return peer;
  }

  return (
    <div className="w-full">
      <RoomHeader
        roomID={roomID}
        copiedRef={copiedRef}
      />
      <div className="flex video-container">
        <div className="flex column">
          {
            <div className="video-box">
              <video
                ref={userVideo}
                playsInline
                autoPlay
                muted
                className={`${!videoEnabled ? 'disabled' : 'enabled'}`}
              />
              {!videoEnabled && <span className="flex muted w-full">
                {name && name[0]}
              </span>}
            </div>
          }
          <div className="flex">
            {name && <p>{name.length > 8 ? `${name.slice(0, 9)}...` : name}</p>}
            <div
              className="flex"
              style={{
                columnGap: '1rem'
              }}>
              <button
                className="icon-button"
                onClick={
                  () => setUserMedia(false, !videoEnabled)
                }>
                <FontAwesomeIcon
                  className="muted"
                  icon={videoEnabled ? faVideo : faVideoSlash}
                />
              </button>
              <button
                className="icon-button"
                onClick={
                  () => setUserMedia(true, !audioEnabled)
                }
              >
                <FontAwesomeIcon
                  className="muted"
                  icon={audioEnabled ? faMicrophone : faMicrophoneSlash}
                />
              </button>
            </div>
          </div>
        </div>
        {
          peers.length >= 1 && peers.map(p => {
            return <PeerVideo key={p.peerID} user={p} />
          })
        }
      </div>
      <button
        onClick={handleLeave}
        className="flex leave-btn">
        Leave Room
      </button>
      <div
        ref={copiedRef}
        className="copied-msg"
      >
        <span
          className="flex muted w-full">
          roomID copied!
          <button className="icon-button">
            <FontAwesomeIcon
              icon={faTimes}
              className="muted"
              onClick={() => copiedRef.current.style.display = 'none'}
            />
          </button>
        </span>
      </div>
    </div>
  );
}

export default withRouter(Room);