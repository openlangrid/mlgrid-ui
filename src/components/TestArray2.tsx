import React from "react";
import { FormEventHandler } from "react";

export function TestArray2(){
    const [messages, setMessages] = React.useState<string[]>([]);
    const onSubmit: FormEventHandler = e=>{
        e.preventDefault();
        setMessages([...messages, "hello"]);
    };
    console.log(messages);
    return <div>
        {messages.map((s, i)=><div key={i}>{s}</div>)}
        <form onSubmit={onSubmit}>
            <button>Click!</button>
        </form>
    </div>;
}
