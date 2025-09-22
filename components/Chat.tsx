'use client';


import { FormEvent, useEffect, useRef, useState, useTransition } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Loader2Icon } from "lucide-react";

import { useCollection } from "react-firebase-hooks/firestore";
import { useUser } from "@clerk/nextjs";
import { collection, orderBy, query } from "firebase/firestore";
import { db } from "@/firebase";
import {askQuestion} from "@/actions/askQuestion";
import {placeholder} from "google-logging-utils";
import {scrollIntoView} from "pdfjs-dist/types/web/ui_utils";
import ChatMessage from "@/components/ChatMessage";



export type Message = {
    id?: string;
    role: "human" | "ai" | "placeholder";
    message: string;
    createdAt: Date;
};


function Chat({id}:{id:string}) {

    const {user} = useUser();
    const [input, setInput] = useState("");
    const [message, setMessage] = useState<Message[]>([]);
    const [isPending, startTransition] = useTransition();

    const bottomOfChatRef = useRef<HTMLDivElement>(null);

    const[snapshot, loading, error] = useCollection(
        user &&
        query(
            collection(db, "users", user?.id, "files", id, "chat"),
            orderBy("createdAt", "asc"),
        )
    );

    useEffect(() => {
        bottomOfChatRef.current?.scrollIntoView({
            behavior: "smooth"
        });
    }, [message]);

    useEffect(() => {
        if(!snapshot) return;
        console.log("Updated Snapshot = ",snapshot.docs);

        const lastMessage = message.pop();

        if(lastMessage?.role ==="ai" && lastMessage.message === "thinking") {
            return;
        }

        const newMessages = snapshot.docs.map((doc) => {
            const {role, message, createdAt} = doc.data();
            return{
                id: doc.id,
                role,
                message,
                createdAt: createdAt.toDate(),
            };
        })

        setMessage(newMessages);

    }, [snapshot, message]);


    const handleSubmit = async function(e:FormEvent) {
        e.preventDefault();
        const q = input;
        setInput("");
        setMessage((prev) =>[
            ...prev,
            {
                role:"human",
                message:q,
                createdAt: new Date(),
            },
            {
                role:"ai",
                message:"Thinking...",
                createdAt: new Date(),
            }
        ]);
        startTransition(async ()=>{
            const {success, message} = await askQuestion(id, q);

            if(!success){
                setMessage((prev)=>
                    prev.slice(0, prev.length-1).concat([
                        {
                            role:"ai",
                            message:`FATAL!${message}`,
                            createdAt: new Date(),
                        }
                    ])
                )
            }

        })

    };

    return (


        <div className="flex flex-col h-full overflow-scroll">
            <div className="flex-1 w-full">
            {/*    contents of the chat...      */}
                {loading ? (
                   <div className="flex items-center justify-center">
                       <Loader2Icon className="animate-spin h-20 w-20 text-indigo-600"/>
                   </div>
                ):(
                    <div className="p-5">
                        {/*{message.map(message=>(*/}
                        {/*    <div key={message.id}>*/}
                        {/*        <p>{message.message}</p>*/}
                        {/*    </div>*/}
                        {/*))}*/}

                        { message.length === 0 && (
                        <ChatMessage
                        key = {"placeholder"}
                        message ={{
                        role:"ai",
                        message:"Ask me anything about your PDF :)...",
                        createdAt: new Date(),
                        }}
                        />
                        )}

                        {message.map((message, index) => (
                            <ChatMessage key={index} message={message} />
                        ))}

                        <div ref={bottomOfChatRef}/>

                    </div>

                )}

            </div>

            <form
                onSubmit={handleSubmit}
                className="flex sticky bottom-0 space-x-2 p-5 bg-indigo-600/75"
            >
                <Input
                    placeholder="Ask a Question..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />

                <Button type="submit" disabled={!input || isPending}>
                    {isPending ? (
                        <Loader2Icon className="animate-spin text-white" />
                    ) : (
                        "Ask"
                    )}
                </Button>
            </form>
        </div>
    );
}
export default Chat
