'use client';


import { FormEvent, useEffect, useRef, useState, useTransition } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Loader2Icon } from "lucide-react";
// import ChatMessage from "./ChatMessage";
import { useCollection } from "react-firebase-hooks/firestore";
import { useUser } from "@clerk/nextjs";
import { collection, orderBy, query } from "firebase/firestore";
import { db } from "@/firebase";
import {askQuestion} from "@/actions/askQuestion";
// import { askQuestion } from "@/actions/askQuestion";
// import ChatMessage from "./ChatMessage";
// import { useToast } from "./ui/use-toast";


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

    const[snapshot, loading, error] = useCollection(
        user &&
        query(
            collection(db, "users", user?.id, "files", id, "chat"),
            orderBy("createdAt", "asc"),
        )
    );

    useEffect(() => {
        if(!snapshot) return;
        console.log("Updated Snapshot = ",snapshot.docs);

    }, [snapshot]);

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
            <div className="flex-1 overflow-y-auto">
            {/*    contents of the chat...      */}
            </div>

            <form
                onSubmit={handleSubmit}
                className="flex-shrink-0 flex items-center space-x-2 p-5 bg-indigo-600/75"
            >
                <Input
                    placeholder="Ask a question..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                />

                <Button type="submit" disabled={!input || isPending}>
                    {isPending?(
                        <Loader2Icon className="animate-spin text-indigo-600"/>
                    ):(
                        "Ask"
                    )}
                </Button>

            </form>


        </div>
    )
}
export default Chat
