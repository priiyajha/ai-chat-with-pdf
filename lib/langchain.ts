import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { createHistoryAwareRetriever } from "langchain/chains/history_aware_retriever";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import pineconeClient from "./pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { PineconeConflictError } from "@pinecone-database/pinecone/dist/errors";
import { Index, RecordMetadata } from "@pinecone-database/pinecone";
import { adminDb } from "@/firebaseAdmin";
import { auth } from "@clerk/nextjs/server";


const model = new ChatGoogleGenerativeAI({
    model: "gemini-1.5-flash",
    apiKey: process.env.GEMINI_API_KEY,
});



export const indexName = "ai-chat-with-pdf";

export async function fetchMessagesFromDB(docId:string){

    const {userId} = await auth();
    if(!userId){
        throw new Error("Not authorized");
    }
    console.log(`fetching chat from firebase datastore...`);
    const LIMIT = 6;

    const chats = await adminDb
        .collection(`users`)
        .doc(userId)
        .collection("files")
        .doc(docId)
        .collection("chat")
        .orderBy("createdAt", "desc")
        .get();


    const chatHistory = chats.docs.map((doc) =>
        doc.data().role === "human"
            ? new HumanMessage(doc.data().message)
            : new AIMessage(doc.data().message)
    );

    console.log(
        `--- fetched last ${chatHistory.length} messages successfully ---`
    );
    console.log(chatHistory.map((msg) => msg.content.toString()));

    return chatHistory;

}

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
    const embeddings = new GoogleGenerativeAIEmbeddings({
        model: "embedding-001",
        apiKey: process.env.GEMINI_API_KEY,
    });

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
        console.log("Split Docs:", splitDocs);
        console.log(`storing the embeddings in namespace ${docId} in the ${indexName} in the vector store`);



        const testText = "This is a test sentence.";
        const testEmbedding = await embeddings.embedDocuments([testText]);
        console.log("Test Embedding:", testEmbedding);

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

// const generateLangchainCompletion = async (docId:string , question:string)=>{
//     let pineconeVectorStore;
//     pineconeVectorStore = await generateEmbeddingsInPineconeVectorStore(docId);
//     if(!pineconeVectorStore) {
//         throw new Error("No pineconeVectorStore");
//     }
//     console.log(`creating a retriever...`);
//     const retriever = pineconeVectorStore.asRetriever();
//     const chatHistory = await fetchMessagesFromDB(docId);
//
//     console.log(`define prompt template...`);
//     const historyAwarePrompt = ChatPromptTemplate.fromMessages([
//         ...chatHistory,
//         ["user", "{input}"],
//         [
//             "user",
//             "Given the above conversation, generate a search query to look up in order to get information relevant to the conversation",
//         ],
//     ]);
//     console.log("creating history aware retriever chain...");
//     const historyAwareRetrieverChain =await createHistoryAwareRetriever({
//         llm: model,
//         retriever,
//         rephrasePrompt: historyAwarePrompt,
//     });
//     console.log(`define prompt template for answering questions...`);
//     const historyAwareCombineDocsChain = ChatPromptTemplate.fromMessages([
//         [
//             "system",
//             "Answer the user's questions based on the below context :\n{context}",
//         ],
//         ...chatHistory,
//         ["user", "{input}"],
//     ]);
//     console.log('creating main retrieval chain...');
//     const conversationalRetrievalChain = await createRetrievalChain({
//         retriever: historyAwareRetrieverChain,
//         combineDocsChain: historyAwareCombineDocsChain,
//     });
//     console.log('running chain w a sample convo...');
//     const reply = await conversationalRetrievalChain.invoke({
//         chat_history: chatHistory,
//         input: question,
//     });
//
//     console.log(reply.answer);
//     return reply.answer;
//
// };

const generateLangchainCompletion = async (docId: string, question: string) => {
    let pineconeVectorStore;

    pineconeVectorStore = await generateEmbeddingsInPineconeVectorStore(docId);
    if (!pineconeVectorStore) {
        throw new Error("Pinecone vector store not found");
    }

    // Create a retriever to search through the vector store
    console.log("--- Creating a retriever... ---");
    const retriever = pineconeVectorStore.asRetriever();

    // Fetch the chat history from the database
    const chatHistory = await fetchMessagesFromDB(docId);

    // Define a prompt template for generating search queries based on conversation history
    console.log("--- Defining a prompt template... ---");
    const historyAwarePrompt = ChatPromptTemplate.fromMessages([
        ...chatHistory, // Insert the actual chat history here

        ["user", "{input}"],
        [
            "user",
            "Given the above conversation, generate a search query to look up in order to get information relevant to the conversation",
        ],
    ]);

    // Create a history-aware retriever chain that uses the model, retriever, and prompt
    console.log("--- Creating a history-aware retriever chain... ---");
    const historyAwareRetrieverChain = await createHistoryAwareRetriever({
        llm: model,
        retriever,
        rephrasePrompt: historyAwarePrompt,
    });

    // Define a prompt template for answering questions based on retrieved context
    console.log("--- Defining a prompt template for answering questions... ---");
    const historyAwareRetrievalPrompt = ChatPromptTemplate.fromMessages([
        [
            "system",
            "Answer the user's questions based on the below context:\n\n{context}",
        ],

        ...chatHistory, // Insert the actual chat history here

        ["user", "{input}"],
    ]);

    // Create a chain to combine the retrieved documents into a coherent response
    console.log("--- Creating a document combining chain... ---");
    const historyAwareCombineDocsChain = await createStuffDocumentsChain({
        llm: model,
        prompt: historyAwareRetrievalPrompt,
    });

    // Create the main retrieval chain that combines the history-aware retriever and document combining chains
    console.log("--- Creating the main retrieval chain... ---");
    const conversationalRetrievalChain = await createRetrievalChain({
        retriever: historyAwareRetrieverChain,
        combineDocsChain: historyAwareCombineDocsChain,
    });

    console.log("--- Running the chain with a sample conversation... ---");
    const reply = await conversationalRetrievalChain.invoke({
        chat_history: chatHistory,
        input: question,
    });

    // Print the result to the console
    console.log(reply.answer);
    return reply.answer;
};

// Export the model and the run function
export { model, generateLangchainCompletion };