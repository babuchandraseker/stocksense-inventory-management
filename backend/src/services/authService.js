const supabase = require('../config/supabase');
const { ROLES } = require('../utils/constants');

/**
 * Auth Service
 * Encapsulates Supabase token verification and user profile/role retrieval.
 */
class AuthService {
  /**
   * Verify Supabase JWT / access token
   * @param {string} token
   * @returns {Promise<object>} Authenticated Supabase user object
   */
  async verifyToken(token) {
    if (!token) {
      throw new Error('No token provided');
    }

    try {
      const { data, error } = await supabase.auth.getUser(token);

      if (error || !data || !data.user) {
        throw new Error(error ? error.message : 'Invalid or expired token');
      }

      return data.user;
    } catch (err) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Retrieve user role and profile information from Supabase database or metadata
   * @param {object} supabaseUser
   * @returns {Promise<object>} Normalized user profile with role
   */
  async getUserProfile(supabaseUser) {
    const userId = supabaseUser.id;
    const userEmail = supabaseUser.email || '';
    let role = null;
    let name = null;
    let warehouseId = null;
    let warehouseName = null;

    // 1. Attempt to fetch profile from 'profiles' table if it exists
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && profile) {
        role = profile.role;
        name = profile.name || profile.full_name;
        warehouseId = profile.warehouse_id || profile.warehouseId;
        warehouseName = profile.warehouse_name || profile.warehouseName;
      }
    } catch (_err) {
      // Table might not exist or database not yet seeded; continue to fallbacks
    }

    // 2. If role is still not found, check 'users' table
    if (!role) {
      try {
        const { data: userRecord, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (!error && userRecord) {
          role = userRecord.role;
          name = name || userRecord.name || userRecord.full_name;
          warehouseId = warehouseId || userRecord.warehouse_id || userRecord.warehouseId;
        }
      } catch (_err) {
        // Table might not exist; continue to fallbacks
      }
    }

    // 3. Fallback to Supabase auth metadata (user_metadata or app_metadata)
    if (!role) {
      role =
        supabaseUser.user_metadata?.role ||
        supabaseUser.app_metadata?.role ||
        null;
    }

    if (!name) {
      name =
        supabaseUser.user_metadata?.name ||
        supabaseUser.user_metadata?.full_name ||
        userEmail.split('@')[0];
    }

    // 4. Fallback inference based on email convention if role not explicitly set
    if (!role) {
      if (userEmail.toLowerCase().includes('admin') || userEmail.toLowerCase().includes('manager')) {
        role = ROLES.MANAGER;
      } else {
        role = ROLES.STAFF;
      }
    }

    // Normalize role string to lower case and validate
    const normalizedRole = typeof role === 'string' ? role.toLowerCase().trim() : ROLES.STAFF;
    const finalRole = normalizedRole === ROLES.MANAGER ? ROLES.MANAGER : ROLES.STAFF;

    return {
      id: userId,
      email: userEmail,
      role: finalRole,
      name,
      warehouseId,
      warehouseName,
    };
  }

  /**
   * Verify token and fetch complete user profile in one operation
   * @param {string} token
   * @returns {Promise<object>}
   */
  async getAuthenticatedUser(token) {
    const supabaseUser = await this.verifyToken(token);
    return await this.getUserProfile(supabaseUser);
  }
}

module.exports = new AuthService();
