//
// import PdfView from "@/components/PdfView";
// import { adminDb } from "@/firebaseAdmin";
// import { auth } from "@clerk/nextjs/server";
//
// function Chat(props: { id: string }) {
//     return null;
// }
//
// async function ChatToFilePage({
//                                   params:{id}
//                               }: {
//     params: {
//         id: string;
//     };
// }) {
//     auth.protect();
//     const { userId } = await auth();
//
//     const ref = await adminDb
//         .collection("users")
//         .doc(userId!)
//         .collection("files")
//         .doc(id)
//         .get();
//
//     const url = ref.data()?.downloadUrl;
//
//     return (
//         <div className="flex flex-row h-full overflow-hidden">
//             {/* Right */}
//             <div className="w-1/2 overflow-y-auto">
//                 {/* Chat */}
//                 <Chat id={id}/>
//             </div>
//
//             {/* Left */}
//             <div className="w-1/2 bg-gray-100 border-2 border-indigo-600 overflow-y-auto">
//                 {/* PDFView */}
//                 <PdfView url={url} />
//             </div>
//         </div>
//     );
// }
// export default ChatToFilePage;


import Chat from "@/components/Chat";
import PdfView from "@/components/PdfView";
import { adminDb } from "@/firebaseAdmin";
import { auth } from "@clerk/nextjs/server";

async function ChatToFilePage({
                                  params: { id },
                              }: {
    params: {
        id: string;
    };
}) {
    auth.protect();
    const { userId } = await auth();

    const ref = await adminDb
        .collection("users")
        .doc(userId!)
        .collection("files")
        .doc(id)
        .get();

    const url = ref.data()?.downloadUrl;

    return (
        <div className="grid lg:grid-cols-5 h-full overflow-hidden">
            {/* Right */}
            <div className="col-span-5 lg:col-span-2 overflow-y-auto">
                {/* Chat */}
                <Chat id={id} />
            </div>

            {/* Left */}
            <div className="col-span-5 lg:col-span-3 bg-gray-100 border-r-2 lg:border-indigo-600 lg:-order-1 overflow-auto">
                {/* PDFView */}
                <PdfView url={url} />
            </div>
        </div>
    );
}
export default ChatToFilePage;

