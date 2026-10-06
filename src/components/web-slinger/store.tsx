"use client";

import { createContext, useContext, useState, useSyncExternalStore } from "react";

// Petit store partagé entre l'overlay (DOM, rendu React) et la scène 3D
// (lue à chaque frame dans useFrame, sans provoquer de re-render).
export type SlingerState = {
  // Arrêt sur lequel le héros est posé (ou d'où il part).
  index: number;
  // Arrêt demandé par l'utilisateur ; le héros enchaîne les swings jusqu'à lui.
  target: number;
  swinging: boolean;
  // Premier frame rendu : on peut masquer l'écran de chargement.
  ready: boolean;
};

export type SlingerStore = ReturnType<typeof createSlingerStore>;

function createSlingerStore(count: number) {
  let state: SlingerState = { index: 0, target: 0, swinging: true, ready: false };
  const listeners = new Set<() => void>();

  const set = (patch: Partial<SlingerState>) => {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
  };

  const goTo = (target: number) => {
    set({ target: Math.max(0, Math.min(count - 1, target)) });
  };

  return {
    count,
    get: () => state,
    set,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    goTo,
    // Navigation relative : basée sur la cible pour que plusieurs appuis
    // rapides s'additionnent au lieu d'être perdus pendant un swing.
    next: () => goTo(state.target + 1),
    prev: () => goTo(state.target - 1),
  };
}

const SlingerContext = createContext<SlingerStore | null>(null);

export function SlingerProvider({
  count,
  children,
}: {
  count: number;
  children: React.ReactNode;
}) {
  const [store] = useState(() => createSlingerStore(count));
  return <SlingerContext.Provider value={store}>{children}</SlingerContext.Provider>;
}

export function useSlingerStore() {
  const store = useContext(SlingerContext);
  if (!store) throw new Error("useSlingerStore must be used inside <SlingerProvider>");
  return store;
}

export function useSlingerState<T>(selector: (state: SlingerState) => T): T {
  const store = useSlingerStore();
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.get()),
    () => selector(store.get()),
  );
}
