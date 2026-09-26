import { supabase } from '../lib/supabase';

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  created_at?: string;
}

export const categoryService = {
  /**
   * Get all categories
   */
  async getCategories(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('[categoryService.getCategories] Error:', err.message || err);
      throw err;
    }
  },

  /**
   * Create a new category
   */
  async createCategory(categoryData: { name: string; description?: string }): Promise<Category> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: categoryData.name.trim(),
          description: categoryData.description ? categoryData.description.trim() : null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('[categoryService.createCategory] Error:', err.message || err);
      throw err;
    }
  },

  /**
   * Get category by ID
   */
  async getCategoryById(id: string): Promise<Category | null> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('[categoryService.getCategoryById] Error:', err.message || err);
      throw err;
    }
  },
};
