import React from "react"

interface ButtonProps{
    event: () => void;
    text:string;
}

function Button({event, text}: ButtonProps): React.ReactElement{
    return <button onClick={event}>{text}</button>
}

export default Button