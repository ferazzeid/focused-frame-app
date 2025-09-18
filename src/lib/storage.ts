import { supabase } from "@/integrations/supabase/client";
import { ListItemData } from "@/components/ListItem";

interface AppData {
  freeList: ListItemData[];
  secondList: ListItemData[];
  archive: ListItemData[];
}

// Convert database item to ListItemData
const dbItemToListItem = (dbItem: any): ListItemData => ({
  id: dbItem.id,
  title: dbItem.title,
  content: dbItem.content,
  isBold: dbItem.is_bold,
  isEmpty: dbItem.is_empty,
  createdAt: new Date(dbItem.created_at)
});

// Convert ListItemData to database format
const listItemToDbItem = (item: ListItemData, userId: string, listType: string, position: number) => ({
  id: item.id,
  user_id: userId,
  title: item.title,
  content: item.content,
  is_bold: item.isBold,
  is_empty: item.isEmpty,
  list_type: listType,
  position: position
});

export const loadData = async (): Promise<AppData> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Return empty data if user is not authenticated
      return {
        freeList: [],
        secondList: [],
        archive: []
      };
    }

    // Load list items
    const { data: listItems, error: listError } = await supabase
      .from('list_items')
      .select('*')
      .eq('user_id', user.id)
      .order('position', { ascending: true });

    if (listError) {
      console.error("Error loading list items:", listError);
      throw listError;
    }

    // Load archived items
    const { data: archivedItems, error: archiveError } = await supabase
      .from('archived_items')
      .select('*')
      .eq('user_id', user.id)
      .order('archived_at', { ascending: false });

    if (archiveError) {
      console.error("Error loading archived items:", archiveError);
      throw archiveError;
    }

    // Group list items by type
    const freeList = (listItems || [])
      .filter(item => item.list_type === 'free')
      .map(dbItemToListItem);

    const secondList = (listItems || [])
      .filter(item => item.list_type === 'second')
      .map(dbItemToListItem);

    // Convert archived items
    const archive = (archivedItems || []).map((item: any): ListItemData => ({
      id: item.original_id,
      title: item.title,
      content: item.content,
      isBold: item.is_bold,
      isEmpty: item.is_empty,
      createdAt: new Date(item.original_created_at)
    }));

    return {
      freeList,
      secondList,
      archive
    };
  } catch (error) {
    console.error("Error loading data from Supabase:", error);
    // Fallback to empty data
    return {
      freeList: [],
      secondList: [],
      archive: []
    };
  }
};

export const saveData = async (data: AppData): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Delete existing list items for this user
    const { error: deleteError } = await supabase
      .from('list_items')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.error("Error deleting existing items:", deleteError);
      throw deleteError;
    }

    // Prepare items for bulk insert
    const itemsToInsert = [
      ...data.freeList.map((item, index) => listItemToDbItem(item, user.id, 'free', index)),
      ...data.secondList.map((item, index) => listItemToDbItem(item, user.id, 'second', index))
    ];

    // Insert new items if there are any
    if (itemsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('list_items')
        .insert(itemsToInsert);

      if (insertError) {
        console.error("Error inserting items:", insertError);
        throw insertError;
      }
    }
  } catch (error) {
    console.error("Error saving data to Supabase:", error);
    throw error;
  }
};

export const archiveItem = async (item: ListItemData): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { error } = await supabase
      .from('archived_items')
      .insert({
        user_id: user.id,
        original_id: item.id,
        title: item.title,
        content: item.content,
        is_bold: item.isBold,
        is_empty: item.isEmpty,
        list_type: 'free', // We can determine this from context if needed
        original_created_at: item.createdAt.toISOString()
      });

    if (error) {
      console.error("Error archiving item:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error archiving item:", error);
    throw error;
  }
};

export const createTextItem = (title: string, content: string): ListItemData => ({
  id: crypto.randomUUID(),
  title,
  content,
  isBold: false,
  isEmpty: false,
  createdAt: new Date()
});

export const createEmptyItem = (): ListItemData => ({
  id: crypto.randomUUID(),
  title: "",
  content: "",
  isBold: false,
  isEmpty: true,
  createdAt: new Date()
});

// Utility function for generating IDs (for backward compatibility)
export const generateId = (): string => {
  return crypto.randomUUID();
};