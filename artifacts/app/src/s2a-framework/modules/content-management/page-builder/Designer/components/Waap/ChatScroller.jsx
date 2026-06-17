import React, { useRef, useLayoutEffect, useEffect, useState } from "react";

const ChatScroller = ({ messages = [], renderMessage }) => {
  const containerRef = useRef(null);
  const endRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Detect user scroll position
  const handleScroll = (event) => {
    event.stopPropagation();
    const el = containerRef.current;
    const isAtBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 40;
    setAutoScroll(isAtBottom);
  };

  // Attach scroll listener
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-scroll when messages change
  useLayoutEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);

  useLayoutEffect(() => {
    if (autoScroll) {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [autoScroll]);

  return (
    <div ref={containerRef} className="message-list enable-scroll scroll-y">
      {messages.map((msg, idx) => (
        <React.Fragment key={idx}>{renderMessage(msg, idx)}</React.Fragment>
      ))}
      <div ref={endRef} />

      {!autoScroll && (
        <i
          className="fa-solid fa-angles-down scroll-to-bottom add-pointer"
          onClick={(event) => {
            event.stopPropagation();
            endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
            setAutoScroll(true);
          }}
        ></i>
        // <button

        //   className="scroll-to-bottom btn btn-secondary"
        // >
        //   Scroll to Bottom
        // </button>
      )}
    </div>
  );
};

export default ChatScroller;
