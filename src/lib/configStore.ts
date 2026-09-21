import { createStore } from '@/lib/stage';
import { CategoryId, DEFAULT_SELECTION } from '@/config/finishes';
import { useSyncExternalStore } from 'react';

export type ConfigState = {
  category: CategoryId;
  selection: Record<CategoryId, string>;
};

export const configStore = createStore<ConfigState>({
  category: 'body',
  selection: { ...DEFAULT_SELECTION },
});

export const useConfig = () =>
  useSyncExternalStore(configStore.subscribe, configStore.get, configStore.get);

export const selectOption = (category: CategoryId, id: string) =>
  configStore.set({ selection: { ...configStore.get().selection, [category]: id } });

export const setCategory = (category: CategoryId) => configStore.set({ category });
