import React from "react";
import Button from "./button";
import handleLoginClick from "./handleCLickIntra";

function Login(){
    return(
        <div>
            <h1>Página de login</h1>
            <input type="text" placeholder="Login"/>
            <Button event={handleLoginClick} text="Logar com a Intra" />
        </div>
    )
}

export default Login;