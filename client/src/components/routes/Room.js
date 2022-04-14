import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { useLocation, useParams, useHistory } from "react-router-dom";
import Peer from "simple-peer";
import RoomHeader from "../RoomHeader";
import PeerVideo from "../PeerVideo";
import Loading from "../common/Loading";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faVideo,
  faMicrophone,
  faVideoSlash,
  faTimes,
  faMicrophoneSlash,
} from "@fortawesome/free-solid-svg-icons";
import Modal from "react-modal";

const Room = () => {
  const location = useLocation();
  const params = useParams();
  const history = useHistory();
  const name = location?.state?.name;
  const [audioEnabled, setAudioEnabled] = useState(
    location?.state?.audioEnabled
  );
  const [videoEnabled, setVideoEnabled] = useState(
    location?.state?.videoEnabled
  );
  const [peers, setPeers] = useState([]);
  const [reconnecting, setReconnecting] = useState(false);
  const peersRef = useRef([]);
  const socketRef = useRef();
  const streamRef = useRef();
  const userVideoRef = useRef();
  const copiedRef = useRef();
  const mediaRef = useRef([
    location?.state?.audioEnabled,
    location?.state?.videoEnabled,
  ]);
  const roomID = params.roomID;

  useEffect(() => {
    socketRef.current = io.connect("/", {
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socketRef.current.on("connect", () => {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          stream.getTracks().find((track) => track.kind === "video").enabled =
            videoEnabled;
          stream.getTracks().find((track) => track.kind === "audio").enabled =
            audioEnabled;

          streamRef.current = stream;

          if (userVideoRef.current) {
            userVideoRef.current.srcObject = stream;
          }

          socketRef.current.emit("join-room", { name, roomID });
        });
    });

    socketRef.current.on("disconnect", () => {
      console.log("disconnecting...");
      cleanUp();
    });

    socketRef.current.io.on("reconnect", () => {
      console.log("reconnected...");
      setReconnecting(false);
    });

    socketRef.current.io.on("reconnect_failed", () => {
      console.log("reconnect failed...");
      setReconnecting(false);
      history.push("/");
    });

    socketRef.current.io.on("reconnect_attempt", () => {
      setReconnecting(true);
      console.log("reconnecting...");
    });

    socketRef.current.on(
      "peer-media-update",
      ({ audioEnabled, videoEnabled, peerID }) => {
        peersRef.current = peersRef.current.map((obj) => {
          return obj.peerID === peerID
            ? {
                ...obj,
                audioEnabled,
                videoEnabled,
              }
            : obj;
        });
        setPeers(peersRef.current);
      }
    );

    socketRef.current.on("user-left", (id) => {
      console.log("user disconnected: ", id);
      const obj = peersRef.current.find((p) => p.peerID === id);
      obj && obj.peer.destroy();

      peersRef.current = peersRef.current.filter(({ peerID }) => peerID !== id);
      setPeers(peersRef.current);
    });

    socketRef.current.on("all-users", (users) => {
      users.forEach(({ name, id: userID }) => {
        const peer = createPeer(
          userID,
          socketRef.current.id,
          streamRef.current
        );

        peersRef.current.push({
          name,
          peerID: userID,
          peer,
          audioEnabled: false,
          videoEnabled: false,
        });
      });
      setPeers(peersRef.current);
    });

    socketRef.current.on(
      "user-joined",
      ({ signal, callerID, name, audioEnabled, videoEnabled }) => {
        console.log("user joined: ", name);
        const peer = addPeer(signal, callerID, streamRef.current);

        peersRef.current = [
          ...peersRef.current,
          {
            name,
            peerID: callerID,
            peer,
            audioEnabled,
            videoEnabled,
          },
        ];
        setPeers(peersRef.current);
      }
    );

    socketRef.current.on(
      "recieved-signal",
      ({ signal, id, audioEnabled, videoEnabled }) => {
        peersRef.current = peersRef.current.map((obj) =>
          obj.peerID === id ? { ...obj, audioEnabled, videoEnabled } : obj
        );

        const obj = peersRef.current.find(({ peerID }) => peerID === id);
        obj && obj.peer?.signal(signal);

        setPeers(peersRef.current);
      }
    );

    return () => {
      socketRef.current?.connected && socketRef.current?.disconnect();
      cleanUp();
    };
  }, []);

  const cleanUp = () => {
    peersRef.current.forEach(({ peer }) => peer.destroy());
    peersRef.current = [];
    setPeers([]);

    setUserMedia(false, false);
    setUserMedia(true, false);

    streamRef.current &&
      streamRef.current.getTracks().forEach((s) => s?.stop());
  };

  const setUserMedia = (audio, value) => {
    /* media ref -> [audio, video] */
    mediaRef.current = audio
      ? [value, mediaRef.current[1]]
      : [mediaRef.current[0], value];

    !audio && !value && setVideoEnabled(false);
    audio && setAudioEnabled(value);

    if (audio) {
      const audioTrack =
        streamRef.current &&
        streamRef.current.getTracks().find((track) => track.kind === "audio");
      if (audioTrack) audioTrack.enabled = value;
    } else {
      const videoTrack =
        streamRef.current &&
        streamRef.current.getTracks().find((track) => track.kind === "video");
      if (videoTrack) videoTrack.enabled = value;
    }

    !audio && value && setVideoEnabled(value);

    socketRef.current &&
      socketRef.current.emit("media-update", {
        roomID,
        audioEnabled: mediaRef.current[0],
        videoEnabled: mediaRef.current[1],
      });
  };

  const createPeer = (userToSignal, callerID, stream) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
      config: {
        iceServers: [
          {
            urls: "stun:openrelay.metered.ca:80",
          },
          {
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject",
          },
          {
            urls: "turn:openrelay.metered.ca:443",
            username: "openrelayproject",
            credential: "openrelayproject",
          },
          {
            urls: "turn:openrelay.metered.ca:443?transport=tcp",
            username: "openrelayproject",
            credential: "openrelayproject",
          },
        ],
      },
    });

    peer.on("signal", (signal) => {
      socketRef.current.emit("sending-signal", {
        userToSignal,
        callerID,
        name,
        signal,
        audioEnabled,
        videoEnabled,
      });
    });

    peer.on("error", (error) => {
      console.log("peer error: ", error);
    });

    return peer;
  };

  const addPeer = (incomingSignal, callerID, stream) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
      config: {
        iceServers: [
          {
            urls: "stun:openrelay.metered.ca:80",
          },
          {
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject",
          },
          {
            urls: "turn:openrelay.metered.ca:443",
            username: "openrelayproject",
            credential: "openrelayproject",
          },
          {
            urls: "turn:openrelay.metered.ca:443?transport=tcp",
            username: "openrelayproject",
            credential: "openrelayproject",
          },
        ],
      },
    });

    peer.on("signal", (signal) => {
      socketRef.current.emit("returning-signal", {
        signal,
        callerID,
        audioEnabled: mediaRef.current[0],
        videoEnabled: mediaRef.current[1],
      });
    });

    peer.on("error", (error) => {
      console.log("peer error: ", error);
    });

    peer?.signal(incomingSignal);

    return peer;
  };

  return (
    <div className="w-full">
      <RoomHeader roomID={roomID} copiedRef={copiedRef} />
      <div className="flex video-container">
        <div className="flex column">
          {
            <div className="video-box">
              <video
                ref={userVideoRef}
                playsInline
                autoPlay
                muted
                className={`${!videoEnabled ? "disabled" : "enabled"}`}
              />
              {!videoEnabled && (
                <span className="flex muted w-full">{name && name[0]}</span>
              )}
            </div>
          }
          <div className="flex">
            {name && (
              <p
                style={{
                  overflowWrap: "anywhere",
                  flex: "1",
                }}
              >
                {name.length > 7 ? `${name.slice(0, 7)}...` : name}
              </p>
            )}
            <div
              className="flex"
              style={{
                marginLeft: "8px",
              }}
            >
              <button
                onClick={() => setUserMedia(false, !videoEnabled)}
                className="icon-button"
                style={{ marginRight: "14px" }}
              >
                <FontAwesomeIcon
                  className="muted"
                  icon={videoEnabled ? faVideo : faVideoSlash}
                />
              </button>
              <button
                className="icon-button"
                onClick={() => setUserMedia(true, !audioEnabled)}
              >
                <FontAwesomeIcon
                  className="muted"
                  icon={audioEnabled ? faMicrophone : faMicrophoneSlash}
                />
              </button>
            </div>
          </div>
        </div>
        {peers.length >= 1 &&
          peers.map((p) => {
            return <PeerVideo key={p.peerID} user={p} />;
          })}
      </div>
      <button
        onClick={() => {
          history.push("/");
        }}
        className="flex leave-btn"
      >
        Leave Room
      </button>
      <div ref={copiedRef} className="copied-msg">
        <span className="flex muted w-full">
          roomID copied!
          <button className="icon-button">
            <FontAwesomeIcon
              icon={faTimes}
              className="muted"
              onClick={() => (copiedRef.current.style.display = "none")}
            />
          </button>
        </span>
      </div>
      {reconnecting && (
        <Modal
          className="reconnecting"
          shouldCloseOnOverlayClick={false}
          isOpen={reconnecting}
          ariaHideApp={false}
        >
          <Loading text="Reconnecting" fullWidth={true} />
        </Modal>
      )}
    </div>
  );
};

export default Room;
