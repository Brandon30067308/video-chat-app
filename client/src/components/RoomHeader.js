import { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShareNodes } from "@fortawesome/free-solid-svg-icons";
import { CopyToClipboard } from "react-copy-to-clipboard";

let timeoutId;

const RoomHeader = ({ roomID, copiedRef }) => {
  useEffect(() => {
    return () => clearTimeout(timeoutId);
  }, []);

  const handleShare = () => {
    window.location.href =
      "https://wa.me/?text=Checkout%this%really%cool%video%chat%app!";
  };

  const handleCopy = () => {
    timeoutId && clearTimeout(timeoutId);

    if (copiedRef.current) copiedRef.current.style.display = "flex";
    timeoutId = setTimeout(() => {
      if (copiedRef.current) copiedRef.current.style.display = "none";
    }, 7500);
  };

  return (
    <div className="flex room-header">
      <button
        className="flex alt-button muted icon-button"
        onClick={handleShare}
      >
        <FontAwesomeIcon icon={faShareNodes} className="muted" />
      </button>
      {roomID && (
        <CopyToClipboard text={roomID} onCopy={handleCopy}>
          <button className="flex alt-button muted">copy room id</button>
        </CopyToClipboard>
      )}
    </div>
  );
};

export default RoomHeader;
