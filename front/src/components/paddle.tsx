import React, { useEffect, useRef, useState } from "react";

interface PaddleProps {
 initialPosition: number;
}

function Paddle({ initialPosition }: PaddleProps) {
 const [position, setPosition] = useState(initialPosition);
 const positionRef = useRef(position);
 const paddleRef = useRef<HTMLDivElement>(null);

 const handleKeyDown = (e: KeyboardEvent) => {
    if (paddleRef.current) {
        const paddleHeight = paddleRef.current.offsetHeight;

        if ((e.key === "w" || e.key === "W") && positionRef.current - window.innerHeight / 100 >= (window.innerHeight / 10)) {
            setPosition((prevPosition) => prevPosition - window.innerHeight / 100);
        } else if ((e.key === "s" || e.key === "S") && positionRef.current + window.innerHeight / 100 <= (window.innerHeight * 9 / 10) - paddleHeight) {
            setPosition((prevPosition) => prevPosition + window.innerHeight / 100);
        }
    }
 };

 useEffect(() => {
    positionRef.current = position;
 }, [position]);

 useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);

    return () => {
        window.removeEventListener("keydown", handleKeyDown);
    };
 }, []);

 return (
    <div
        ref={paddleRef}
        className="absolute w-5 h-10 bg-white"
        style={{ top: `${position}px` }}
    />
 );
}

export default Paddle;
