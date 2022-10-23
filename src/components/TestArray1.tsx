import React from "react";
import { FormEventHandler } from "react";

export function TestArray1(){
    const [messages, setMessages] = React.useState(new Array<string>());
    const onSubmit: FormEventHandler = e=>{
        e.preventDefault();
        messages.push("hello");
        setMessages(messages);
    };
    return <div>
        {messages.map((s, i)=><div key={i}>{s}</div>)}
        <form onSubmit={onSubmit}>
            <button>Click!</button>
        </form>
    </div>;
}
