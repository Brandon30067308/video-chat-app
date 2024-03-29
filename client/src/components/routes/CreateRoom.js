import { useRef, useState, useEffect } from "react";
import { v4 as uuidV4 } from "uuid";
import Loading from "../common/Loading";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faInfo } from "@fortawesome/free-solid-svg-icons";
import { useHistory, useLocation } from "react-router-dom";
import Modal from "react-modal";
import Info from "../Info";
import fetchWithTimeout from "../../utils/fetchWithTimeout";

const CreateRoom = () => {
  const history = useHistory();
  const location = useLocation();
  const roomRef = useRef();
  const [roomIDValue, setRoomIDValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [inputError, setInputError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [onBoardingModalOpen, setOnBoardingModalOpen] = useState(false);
  const [isCreateRoom, setIsCreateRoom] = useState(false);
  const [name, setName] = useState("");
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [onBoardingError, setOnBoardingError] = useState(null);
  const onBoardingInputRef = useRef();

  const createRoomHandler = () => {
    setOnBoardingError(null);
    setIsCreateRoom(true);
    setOnBoardingModalOpen(true);
  };

  const joinRoomHandler = (e) => {
    e.preventDefault();

    setOnBoardingError(null);
    setIsCreateRoom(false);

    error && setError(false);
    roomRef.current.blur();

    const value = roomIDValue.trim();
    if (value.trim() === "") {
      setInputError(true);
      setError("Invalid room ID");
      return;
    }
    setOnBoardingModalOpen(true);
  };

  const infoClickHandler = () => {
    setModalOpen(!modalOpen);
  };

  const createRoom = () => {
    if (name.trim() === "") {
      onBoardingInputRef.current && onBoardingInputRef.current.blur();
      setOnBoardingError("fill out the name field");
      return;
    }

    setOnBoardingModalOpen(false);

    const id = uuidV4();
    history.push(`/room/${id}`, {
      name,
      audioEnabled,
      videoEnabled,
    });
  };

  const joinRoom = () => {
    if (name.trim() === "") {
      onBoardingInputRef.current && onBoardingInputRef.current.blur();
      setOnBoardingError("fill out the name field");
      return;
    }

    setOnBoardingModalOpen(false);

    setLoading(true);
    fetchWithTimeout("/api/rooms", {
      setTimeout: 13000,
    })
      .then((res) => {
        setLoading(false);
        if (res.ok) {
          return res.json();
        } else {
          console.log("an error occurred...");
          setInputError(false);
          setError(res.status === 500 ? "Server error!" : "An error occurred!");
        }
      })
      .then((rooms) => {
        if (!rooms) throw new Error("Unable to reach server");

        const roomId = roomIDValue.trim();
        if (Object.keys(rooms).includes(roomId) && rooms[roomId].length <= 3) {
          history.push(`/room/${roomId}`, {
            name,
            audioEnabled,
            videoEnabled,
          });
        } else if (!Object.keys(rooms).includes(roomId)) {
          setInputError(true);
          console.log("Room ID does not exist!");
          setError("Room ID does not exist!");
        } else {
          console.log("Room is full!");
          setError("Room is full!");
        }
      })
      .catch((err) => {
        console.log("an error occurred: ", err.message);
        setLoading(false);
        setOnBoardingModalOpen(false);

        setInputError(false);
        if (err.name === "AbortError") {
          setError("Network error!");
        } else {
          setError(err.message);
        }
      });
  };

  useEffect(() => {
    const roomID = location?.search.split("=")[1];
    roomID && setRoomIDValue(roomID);
    roomID && setOnBoardingModalOpen(true);
  }, [location.search]);

  return (
    <div className="flex column">
      <nav style={{ justifyContent: "flex-end" }}>
        <button className="icon-button alt-button" onClick={infoClickHandler}>
          <FontAwesomeIcon icon={faInfo} className="muted" />
        </button>
      </nav>
      <div className="container flex justify-start">
        <div>
          <p className="heading-lg flex justify-start">Create a room</p>
          <p className="heading-sm">
            create a new room and share the roomID or link to allow people join
          </p>
        </div>
        <button
          onClick={createRoomHandler}
          className="flex"
          style={{ marginLeft: "15px" }}
        >
          Create room
        </button>
      </div>
      <div className="container flex justify-start">
        <p className="heading-lg flex justify-start">Join a room</p>
        <form
          onSubmit={joinRoomHandler}
          className="flex column w-full items-start"
        >
          <input
            className={error && inputError ? "error-input w-full" : "w-full"}
            placeholder="room ID"
            value={roomIDValue}
            ref={roomRef}
            onChange={(e) => setRoomIDValue(e.target.value)}
            onFocus={() => inputError && setError(null)}
          />
          <div className="flex justify-start">
            <button
              type="submit"
              className="flex"
              style={{ marginTop: "13.5px" }}
            >
              Join room
            </button>
            {error && <p className="error">{error}</p>}
            {loading && <Loading fullWidth={false} />}
          </div>
        </form>
      </div>
      <Modal
        className="modal-menu"
        isOpen={modalOpen}
        onRequestClose={() => setModalOpen(false)}
        shouldCloseOnOverlayClick={true}
        ariaHideApp={false}
      >
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <p>How to use</p>
          <button
            className="icon-button close-modal-button"
            onClick={() => setModalOpen(false)}
          >
            close
          </button>
        </div>
        <Info />
      </Modal>
      <Modal
        className="modal-menu onboarding w-full justify-start"
        isOpen={onBoardingModalOpen}
        onRequestClose={() => setOnBoardingModalOpen(false)}
        shouldCloseOnOverlayClick={true}
        ariaHideApp={false}
      >
        <div className="w-full flex">
          <p>{isCreateRoom ? "Create room ⚡" : "Join room ⚡"}</p>
          <button
            className="icon-button close-modal-button"
            onClick={() => setOnBoardingModalOpen(false)}
          >
            close
          </button>
        </div>
        <form
          className="flex column w-full"
          onSubmit={(e) => {
            e.preventDefault();
            isCreateRoom ? createRoom() : joinRoom();
          }}
        >
          <input
            type="text"
            placeholder="your name..."
            ref={onBoardingInputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={() => onBoardingError && setOnBoardingError(null)}
            className={`${onBoardingError ? "error-input w-full" : "w-full"}`}
          />
          <div className="flex">
            <label className="muted">enable audio:</label>
            <div
              className="checkbox flex"
              onClick={() => setAudioEnabled(!audioEnabled)}
              tabIndex={0}
            >
              {audioEnabled && (
                <FontAwesomeIcon className="muted" icon={faCheck} />
              )}
            </div>
          </div>
          <div className="flex">
            <label className="muted">enable video:</label>
            <div
              className="checkbox flex"
              onClick={() => setVideoEnabled(!videoEnabled)}
              tabIndex={0}
            >
              {videoEnabled && (
                <FontAwesomeIcon className="muted" icon={faCheck} />
              )}
            </div>
          </div>
          {
            <>
              <button type="submit" disabled={loading}>
                Go!
              </button>
              {onBoardingError && (
                <span className="error text-center">{onBoardingError}</span>
              )}
            </>
          }
        </form>
      </Modal>
    </div>
  );
};

export default CreateRoom;
