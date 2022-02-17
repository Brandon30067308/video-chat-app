import React, { useEffect, useState } from 'react';
import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom';
import CreateRoom from './components/routes/CreateRoom';
import NotFound from './components/routes/NotFound';
import Room from './components/routes/Room';
import './App.css';
import Loading from './components/common/Loading';
import fetchWithTimeout from './utils/fetchWithTimeout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRotateLeft } from '@fortawesome/free-solid-svg-icons';

const Retry = ({ clickHandler }) => {
  return (
    <div className="w-full flex retry">
      <span>An error occurred</span>
      <button onClick={clickHandler} className="icon-button retry-button muted">
        <FontAwesomeIcon icon={faRotateLeft} /></button>
    </div>
  )
}

const App = () => {
  const [rooms, setRooms] = useState();
  const [error, setError] = useState(null);

  const fetchRooms = () => {
    fetchWithTimeout('/rooms', {
      timeout: 13000
    })
      .then(res => {
        if (res.ok) {
          return res.json();
        } else {
          setError(res.status === 500 ?
            'Server error...' :
            'An error occurred...');
        }
      })
      .then(rooms => {
        rooms && setRooms(rooms);
      })
      .catch(err => {
        if (err.name === 'AbortError') {
          setError('Network error...');
        }
        setError('An error occurred...');
      });
  }

  const retryFetch = () => {
    setError(null);
    fetchRooms();
  }

  useEffect(() => {
    fetchRooms();
  }, []);

  return (
    <div className="app-container flex">
      <BrowserRouter>
        <Switch>
          <Route path="/" exact component={CreateRoom} />
          <Route path="/room/:roomID" exact render={props => {
            if (props?.location?.state?.name) {
              /* name payload present */
              if (!rooms && !error) return <Loading number={4} fullWidth={true} />
              else if (!rooms && error) return <Retry clickHandler={retryFetch} />
              let room = rooms[props.match.params.roomID];
              let length = room ? room.length : 0;
              if (length < 4) {
                return <Room props={props} />
              } else {
                return <Redirect to={{
                  pathname: '/'
                }} />
              }
            } else {
              props.history.push(`/?roomID=${props.match.params.roomID}`);
            }
          }} />
          <Route component={NotFound} />
        </Switch>
        {/* <Footer /> */}
      </BrowserRouter>
    </div>
  )
}

export default App;
