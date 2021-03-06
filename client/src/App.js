import React, { useEffect, useState } from "react";
import { BrowserRouter, Route, Switch, Redirect } from "react-router-dom";
import CreateRoom from "./components/routes/CreateRoom";
import NotFound from "./components/routes/NotFound";
import Room from "./components/routes/Room";
import Loading from "./components/common/Loading";
import fetchWithTimeout from "./utils/fetchWithTimeout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotateLeft } from "@fortawesome/free-solid-svg-icons";
import "./App.css";

const Retry = ({ clickHandler }) => {
  return (
    <div className="w-full flex retry">
      <span>An error occurred</span>
      <button onClick={clickHandler} className="icon-button retry-button muted">
        <FontAwesomeIcon icon={faRotateLeft} />
      </button>
    </div>
  );
};

const App = () => {
  const [rooms, setRooms] = useState(null);
  const [error, setError] = useState(null);

  const fetchRooms = () => {
    fetchWithTimeout("/api/rooms", {
      timeout: 13000,
    })
      .then((res) => {
        if (res.ok) {
          return res.json();
        } else {
          setError(
            res.status === 500 ? "Server error..." : "An error occurred..."
          );
        }
      })
      .then((rooms) => {
        rooms && setRooms(rooms);
      })
      .catch((err) => {
        if (err.name === "AbortError") {
          setError("Network error...");
        }
        setError("An error occurred...");
      });
  };

  const retryFetch = () => {
    setError(null);
    fetchRooms();
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  return (
    <div className="app-container flex">
      <BrowserRouter>
        <Switch>
          <Route path="/" exact component={CreateRoom} />
          <Route
            path="/room/:roomID"
            exact
            render={(props) => {
              if (props?.location?.state?.name) {
                if (!rooms && !error) {
                  <Loading fullWidth={true} />;
                } else if (!rooms && error) {
                  return <Retry clickHandler={retryFetch} />;
                } else {
                  return <Room />;
                }
              } else {
                props.history.push(`/?roomID=${props.match.params.roomID}`);
              }
            }}
          />
          <Route component={NotFound} />
        </Switch>
      </BrowserRouter>
    </div>
  );
};

export default App;
