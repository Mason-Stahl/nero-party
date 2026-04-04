import { createContext, useContext } from "react";

const PartyContext = createContext(null);

// Wrap StagePage once hostData is available from onComplete.
// data = { id, participantId, isHost, joinCode, groupName, hostName,
//          autoAccept, maxSongLengthSec, ... }
export function PartyProvider({ data, children }) {
  const value = {
    partyId:          data?.id,
    participantId:    data?.participantId,
    isHost:           !!data?.isHost,
    joinCode:         data?.joinCode,
    groupName:        data?.groupName,
    hostName:         data?.hostName,
    autoAccept:       data?.autoAccept ?? true,
    maxSongLengthSec: data?.maxSongLengthSec ?? null,
  };
  return <PartyContext.Provider value={value}>{children}</PartyContext.Provider>;
}

export function useParty() {
  const ctx = useContext(PartyContext);
  if (!ctx) throw new Error("useParty must be used inside <PartyProvider>");
  return ctx;
}
