"use server";
import {auth} from '@clerk/nextjs/server';
import {revalidatePath} from "next/cache";
export async function generateEmbeddings(docId: string) {
    auth().protect();
    //turn pdf to a string of numbers using Pinocone
    await generateEmbeddingsInPineconeVectorStore(docId);
    revalidatePath('/dashboard');
    return{completed: true};
}