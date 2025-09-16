import { ClerkLoaded } from "@clerk/nextjs";
import Header from "@/components/header";

function DashboardLayout({children}: {children: React.ReactNode}) {
    return (<ClerkLoaded>
        <div className="flex-1 flex flex-col h-screen">
            {/*Header component add*/}
            <Header />
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
        </ClerkLoaded>
    )
}
export default DashboardLayout;