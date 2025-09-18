import { ListItemData } from "@/components/ListItem";

export interface StorageData {
  freeList: ListItemData[];
  premiumList: ListItemData[];
  archive: ListItemData[];
  isPremium: boolean;
  version: string;
}

const STORAGE_KEY = "notes-app-data";
const CURRENT_VERSION = "1.0.0";

const defaultData: StorageData = {
  freeList: [],
  premiumList: [],
  archive: [],
  isPremium: false,
  version: CURRENT_VERSION,
};

export const loadData = (): StorageData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultData;
    
    const parsed = JSON.parse(stored) as StorageData;
    
    // Convert date strings back to Date objects
    const convertDates = (items: any[]): ListItemData[] => {
      return items.map(item => ({
        ...item,
        createdAt: new Date(item.createdAt),
      }));
    };
    
    return {
      ...parsed,
      freeList: convertDates(parsed.freeList || []),
      premiumList: convertDates(parsed.premiumList || []),
      archive: convertDates(parsed.archive || []),
      version: CURRENT_VERSION,
    };
  } catch (error) {
    console.error("Failed to load data from localStorage:", error);
    return defaultData;
  }
};

export const saveData = (data: StorageData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save data to localStorage:", error);
  }
};

export const exportData = (): string => {
  const data = loadData();
  return JSON.stringify(data, null, 2);
};

export const importData = (jsonString: string): boolean => {
  try {
    const imported = JSON.parse(jsonString) as StorageData;
    saveData(imported);
    return true;
  } catch (error) {
    console.error("Failed to import data:", error);
    return false;
  }
};

// Utility functions
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const createEmptyItem = (): ListItemData => ({
  id: generateId(),
  content: "",
  isBold: false,
  isEmpty: true,
  createdAt: new Date(),
});

export const createTextItem = (content: string, isBold: boolean = false): ListItemData => ({
  id: generateId(),
  content,
  isBold,
  isEmpty: false,
  createdAt: new Date(),
});