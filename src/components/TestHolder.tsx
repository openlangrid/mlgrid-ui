import React from "react";
import { FormEventHandler } from "react";
import { Holder } from "../util/Holder";


export function TestHolder(){
    const [messages, setMessages] = React.useState(new Holder<string[]>([]));
    const onSubmit: FormEventHandler = e=>{
        e.preventDefault();
        messages.value.push("hello");
        setMessages(messages.clone());
    };
    return <div>
        {messages.value.map((s, i)=><div key={i}>{s}</div>)}
        <form onSubmit={onSubmit}>
            <button>Click!</button>
        </form>
    </div>;
}
