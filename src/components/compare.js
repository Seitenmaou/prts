import React from "react";

export default function CompareStats ({compareId, firstNum, secondNum, invert}) {
    if (!invert){
        return (
            <>
                <span style={{color: compareId !== null ? 
                    (firstNum < secondNum ? 'red' :
                    (firstNum > secondNum ? 'green' : 'yellow')) : 'black' }}>
                    {firstNum.toFixed(2).replace(/[.,]00$/, "")}
                </span>
                {compareId !== null && (
                <>
                    <span>
                    {firstNum < secondNum ? " < " :
                    (firstNum > secondNum ? " > " : " = ")}
                    </span>
                    <span style={{
                    color: firstNum < secondNum ? 'green' :
                    (firstNum > secondNum ? 'red' : 'yellow')
                    }}>
                    {secondNum.toFixed(2).replace(/[.,]00$/, "")}
                    </span>
                </>
                )}
            </>
        );
    } else {
        return (
            <>
                <span style={{color: compareId !== null ? 
                    (firstNum < secondNum ? 'green' :
                    (firstNum > secondNum ? 'red' : 'yellow')) : 'black' }}>
                    {firstNum.toFixed(2).replace(/[.,]00$/, "")}
                </span>
                {compareId !== null && (
                <>
                    <span>
                    {firstNum < secondNum ? " < " :
                    (firstNum > secondNum ? " > " : " = ")}
                    </span>
                    <span style={{
                    color: firstNum < secondNum ? 'red' :
                    (firstNum > secondNum ? 'green' : 'yellow')
                    }}>
                    {secondNum.toFixed(2).replace(/[.,]00$/, "")}
                    </span>
                </>
                )}
            </>
        );
    }
};