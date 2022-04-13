import { useState, useEffect, useRef } from "react";

const Loading = ({ text = "Loading", fullWidth = false }) => {
  const [count, setCount] = useState(1);
  let countRef = useRef(1);
  let forwardRef = useRef(false);

  useEffect(() => {
    const intervalID = setInterval(() => {
      if (countRef.current === 4 || countRef.current === 1) {
        forwardRef.current = !forwardRef.current;
      }

      countRef.current = forwardRef.current
        ? ++countRef.current
        : --countRef.current;
      setCount(countRef.current);
    }, 750);

    return () => {
      clearInterval(intervalID);
    };
  }, []);

  return (
    <div
      className={"loading flex"}
      style={{
        height: `${
          fullWidth ? "calc(100vh - (var(--container-padding) * 2))" : "auto"
        }`,
        margin: `${fullWidth ? "0px" : "13.5px 0px 0px 15px"}`,
      }}
    >
      <span className={`${fullWidth ? "full-width" : ""}`}>
        {`${text}${".".repeat(count)}`}
      </span>
    </div>
  );
};

export default Loading;
