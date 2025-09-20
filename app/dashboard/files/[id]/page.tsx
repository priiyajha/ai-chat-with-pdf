
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
        <div className="grid lg:grid-cols-4 h-full overflow-hidden">
            {/* Right */}
            <div className=" lg:col-span-1 overflow-y-auto">
                {/* Chat */}
            </div>

            {/* Left */}
            <div className="col-span-4 lg:col-span-3 bg-gray-100 border-2 border-indigo-600 lg:-order-1 overflow-y-auto">
                {/* PDFView */}
                <PdfView url={url} />
            </div>
        </div>
    );
}
export default ChatToFilePage;