import React from 'react'
import Link from "next/link";
import {SignedIn, UserButton} from '@clerk/nextjs';
import {Button} from "@/components/ui/button";
import {FilePlus2} from "lucide-react";
import UpgradeButton from "@/components/UpgradeButton";


const Header = () => {
    return <div className="flex justify-between bg-gray-200 shadow-sm p-5 border-b">
        <Link href="/dashboard">
        Chat to <span className="text-indigo-600">PDF</span>
        </Link>
        <SignedIn>
            <div className="flex items-center space-x-2">

                <Button asChild variant="link" className="hidden md:flex">
                    <Link href="/dashboard/upgrade">Pricing</Link>
                </Button>

                <Button asChild variant="outline">
                    <Link href="/dashboard">My Documents</Link>
                </Button>

                <Button asChild variant="outline" className="border-indigo-600">
                    <Link href="/dashboard/upload">
                        <FilePlus2 className="text-indigo-600" />
                    </Link>
                </Button>
                <UpgradeButton/>

                <UserButton/>
            </div>
        </SignedIn>
    </div>
}
export default Header
