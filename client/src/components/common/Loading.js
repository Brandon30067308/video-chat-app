import React, { useState, useEffect, useRef } from 'react';

let sign = false;

const Loading = ({ number, fullWidth }) => {
  const [count, setCount] = useState(1);
  let c = useRef(1);

  useEffect(() => {
    const intervalID = setInterval(() => {
      if (c.current === number || c.current === 1) {
        sign = !sign;
      }
      c.current = sign ? ++c.current : --c.current;
      setCount(c.current);
    }, 700);

    return () => {
      clearInterval(intervalID);
    }
  }, [number]);

  return (
    <div
      className={"loading flex"}
      style={{
        height: `${fullWidth ? 'calc(100vh - (var(--container-padding) * 2))'
          : 'auto'}`,
        margin: `${fullWidth ? '0px' : '13.5px 0px 0px 15px'}`
      }}
    >
      <span
        className={`${fullWidth ? 'full-width' : ''}`}
      >Loading{'.'.repeat(count)}</span>
    </div>
  )
}

export default Loading;