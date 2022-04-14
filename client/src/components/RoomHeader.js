import { useEffect } from "react";
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
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 48 48"
          width="24px"
          height="24px"
        >
          <path d="M 36 5 C 32.151772 5 29 8.1517752 29 12 C 29 12.585766 29.198543 13.109464 29.335938 13.654297 L 17.345703 19.652344 C 16.059118 18.073938 14.181503 17 12 17 C 8.1517722 17 5 20.151775 5 24 C 5 27.848225 8.1517722 31 12 31 C 14.181503 31 16.059118 29.926062 17.345703 28.347656 L 29.335938 34.345703 C 29.198543 34.890536 29 35.414234 29 36 C 29 39.848225 32.151772 43 36 43 C 39.848228 43 43 39.848225 43 36 C 43 32.151775 39.848228 29 36 29 C 33.818497 29 31.940882 30.073938 30.654297 31.652344 L 18.664062 25.654297 C 18.801457 25.109464 19 24.585766 19 24 C 19 23.414234 18.801457 22.890536 18.664062 22.345703 L 30.654297 16.347656 C 31.940882 17.926062 33.818497 19 36 19 C 39.848228 19 43 15.848225 43 12 C 43 8.1517752 39.848228 5 36 5 z M 36 8 C 38.226909 8 40 9.7730927 40 12 C 40 14.226907 38.226909 16 36 16 C 33.773091 16 32 14.226907 32 12 C 32 9.7730927 33.773091 8 36 8 z M 12 20 C 14.226909 20 16 21.773093 16 24 C 16 26.226907 14.226909 28 12 28 C 9.7730915 28 8 26.226907 8 24 C 8 21.773093 9.7730915 20 12 20 z M 36 32 C 38.226909 32 40 33.773093 40 36 C 40 38.226907 38.226909 40 36 40 C 33.773091 40 32 38.226907 32 36 C 32 33.773093 33.773091 32 36 32 z" />
        </svg>
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
