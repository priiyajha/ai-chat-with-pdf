import { ChatOpenAI } from "@langchain/openai";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { createHistoryAwareRetriever } from "langchain/chains/history_aware_retriever";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import pineconeClient from "./pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { PineconeConflictError } from "@pinecone-database/pinecone/dist/errors";
import { Index, RecordMetadata } from "@pinecone-database/pinecone";
import { adminDb } from "../firebaseAdmin";
import { auth } from "@clerk/nextjs/server";


const model = new ChatOpenAI(
    {
        apiKey: process.env.OPENAI_API_KEY,
        modelName: "gpt-4o",
    }
);

export const indexName = "ai-chat-with-pdf";

export async function generateDocs(docId: string){
    const {userId} = await auth();
    if(!userId){
        throw new Error("Not logged in");
    }
    console.log("Fetching the dwnld url from firebase...");

    const firebaseRef = await adminDb
        .collection("users")
        .doc(userId)
        .collection("files")
        .doc(docId)
        .get();

        const downloadUrl = await firebaseRef.data()?.downloadUrl;

        if(!downloadUrl){
            throw new Error("No download URL");
        }
    console.log("Dwnld url fetched successfully");
        const response = await fetch(downloadUrl);

        const data = await response.blob();

    console.log("Loading pdf doc..");
    const loader = new PDFLoader(data);
    const docs = await loader.load();


    //split doc
    console.log("splitting doc...");
    const splitter = new RecursiveCharacterTextSplitter();
    const splitDocs = await splitter.splitDocuments(docs);
    console.log(`split doc into ${splitDocs.length} parts`);

    return splitDocs;

}

async function namespaceExists(index:Index<RecordMetadata >,namespace:string){

    if(namespace == null){
        throw new Error("No such namespace found");
    }
    const {namespaces}= await  index.describeIndexStats();
    return namespaces?.[namespace] !== undefined;

}


export async function generateEmbeddingsInPineconeVectorStore(docId: string) {
    const {userId} = await auth();
    if(!userId){
        throw new Error("User not found!");
    }

    let pineconeVectorStore;
    console.log("---Generating embeddings...---");
    const embeddings = new OpenAIEmbeddings();

    const index = await pineconeClient.index(indexName);
    const namespaceAlreadyExists = await namespaceExists(index,docId);

    if(namespaceAlreadyExists){
        console.log(`namespace ${docId} already exists!`);

    pineconeVectorStore = await PineconeStore.fromExistingIndex(embeddings,{
        pineconeIndex: index,
        namespace: docId,
    });
    return pineconeVectorStore;}
    else {
        const splitDocs = await generateDocs(docId);

        console.log(`storing the embeddings in namespace ${docId} in the ${indexName} in the vector store`);

        pineconeVectorStore = await PineconeStore.fromDocuments(
            splitDocs,
            embeddings,
            {
                pineconeIndex: index,
                namespace: docId,
            }
        );

        return pineconeVectorStore;
    }



}
