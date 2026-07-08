import { useCallback, useSyncExternalStore } from "react";
import {
  getCareChatTotalUnread,
  getCareChatUnreadCount,
  getCareMessages,
  markCareChatRead,
  sendCareMessage,
  subscribeCareChat,
  type CareChatRole,
} from "../data/careChat";

let snapshotVersion = 0;

function subscribe(listener: () => void) {
  return subscribeCareChat(() => {
    snapshotVersion += 1;
    listener();
  });
}

function getSnapshot() {
  return snapshotVersion;
}

export function useCareChat(
  patientId: string,
  role: CareChatRole,
  peer: CareChatRole
) {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const messages = getCareMessages(patientId, role, peer);
  const peerUnread = getCareChatUnreadCount(patientId, role, peer);
  const totalUnread = getCareChatTotalUnread(patientId, role);

  const send = useCallback(
    (senderName: string, text: string) => {
      sendCareMessage({
        patientId,
        from: role,
        to: peer,
        senderName,
        text,
      });
    },
    [patientId, role, peer]
  );

  const markRead = useCallback(() => {
    markCareChatRead(patientId, role, peer);
  }, [patientId, role, peer]);

  return { messages, peerUnread, totalUnread, send, markRead };
}
