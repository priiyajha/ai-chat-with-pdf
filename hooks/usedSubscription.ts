'use client';

import {useEffect, useState} from "react";
import {useUser} from "@clerk/nextjs";

import {useCollection, useDocument} from "react-firebase-hooks/firestore";
import {doc} from "@firebase/firestore";
import {db} from "@/firebase";
import {collection} from "firebase/firestore";

const PRO_LIMIT = 10;
const FREE_LIMIT = 5;

function useSubscription() {
    const [hasActiveMembership, setHasActiveMembership] = useState(null);
    const [isOverFileLimit, setIsOverFileLimit] = useState(false);
    const {user} = useUser();

    const [snapshot, loading, error] = useDocument(
        user && doc(db, 'user', user.id),
        {
            snapshotListenOptions: {includeMetadataChanges: true},
        }
    );

    const [filesSnapshot, filesLoading] = useCollection(
        user && collection(db, 'user', user?.id, 'files')
    );

    useEffect(() => {
        if(!snapshot) return;
        const data = snapshot.data();
        if(!data) return;

        setHasActiveMembership(data.hasActiveMembership);

    },[snapshot]);

    useEffect(() => {
        if(!filesSnapshot || hasActiveMembership == null ) return;
        const files = filesSnapshot.docs;
        const usersLimit =   hasActiveMembership? PRO_LIMIT  : FREE_LIMIT;
        console.log(
            "Checking if user's over file limit",
            files.length,
            usersLimit
        );

        setIsOverFileLimit(files.length >= usersLimit);
    },[filesSnapshot, hasActiveMembership, PRO_LIMIT, FREE_LIMIT]);

    return{hasActiveMembership, loading, error, isOverFileLimit, filesLoading};


}

export default useSubscription
