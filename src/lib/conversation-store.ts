const globalStore = globalThis as typeof globalThis & {
  podagentConversationSearchCounts?: Map<string, number>;
};

const conversationSearchCounts =
  globalStore.podagentConversationSearchCounts ??
  (globalStore.podagentConversationSearchCounts = new Map<string, number>());

export function incrementConversationSearchCount(conversationId: string) {
  const current = conversationSearchCounts.get(conversationId) ?? 0;
  conversationSearchCounts.set(conversationId, current + 1);
}

export function getConversationSearchCount(conversationId: string) {
  return conversationSearchCounts.get(conversationId) ?? 0;
}
