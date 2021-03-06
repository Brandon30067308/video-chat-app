import { useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faVideo,
  faMicrophone,
  faVideoSlash,
  faMicrophoneSlash,
} from "@fortawesome/free-solid-svg-icons";

const PeerVideo = ({ user: { peer, name, audioEnabled, videoEnabled } }) => {
  const ref = useRef();

  useEffect(() => {
    peer &&
      peer.on("stream", (stream) => {
        if (ref.current) ref.current.srcObject = stream;
      });
  }, [peer]);

  return (
    <div className="flex column">
      {
        <div className="video-box">
          <video
            playsInline
            autoPlay
            ref={ref}
            className={`${!videoEnabled ? "disabled w-full" : "w-full"}`}
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
          <FontAwesomeIcon
            className="muted"
            icon={videoEnabled ? faVideo : faVideoSlash}
            style={{ marginRight: "14px" }}
          />
          <FontAwesomeIcon
            className="muted"
            icon={audioEnabled ? faMicrophone : faMicrophoneSlash}
          />
        </div>
      </div>
    </div>
  );
};

export default PeerVideo;
