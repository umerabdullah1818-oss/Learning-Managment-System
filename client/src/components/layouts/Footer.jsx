import React, { useState, useEffect } from "react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const [isWide, setIsWide] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(min-width: 600px)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 600px)");
    const handler = (e) => setIsWide(e.matches);
    if (mq.addEventListener) {
      mq.addEventListener("change", handler);
    } else if (mq.addListener) {
      mq.addListener(handler);
    }
    return () => {
      if (mq.removeEventListener) {
        mq.removeEventListener("change", handler);
      } else if (mq.removeListener) {
        mq.removeListener(handler);
      }
    };
  }, []);

  const leftStyle = {
    ...footerLeftStyle,
    textAlign: isWide ? "left" : "center",
    flex: isWide ? "1 1 auto" : "1 1 100%",
  };

  const rightStyle = {
    ...footerRightStyle,
    textAlign: isWide ? "right" : "center",
    flex: isWide ? "1 1 auto" : "1 1 100%",
  };

  return (
    <footer style={footerStyle}>
      <div style={footerContentStyle}>
        <div style={leftStyle}>
          <p style={textStyle}>&copy; {currentYear} Kiaalap. All rights reserved.</p>
        </div>
        <div style={rightStyle}>
          <p style={textStyle}>
            Built with <span style={{ color: "red" }}>♥</span> for education
          </p>
        </div>
      </div>
    </footer>
  );
};

// Styles
const footerStyle = {
  background: "#ffffff",
  padding: "15px 20px",
  width: "100%",
  bottom: 0,
  marginTop: "auto",  
};

const footerContentStyle = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "space-between",
  alignItems: "center",
  textAlign: "center",
  gap: "10px",
};

const footerLeftStyle = {
  flex: "1 1 100%",
  textAlign: "center",
};

const footerRightStyle = {
  flex: "1 1 100%",
  textAlign: "center",
};

const textStyle = {
  margin: 0,
  fontSize: "14px",
};

// Responsive styles are applied inside the component without mutating constants.

export default Footer;
