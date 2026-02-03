import { Request } from 'express';
import { supabase, supabaseAdmin } from './supabase';

/**
 * Get the effective user ID for data operations.
 * If the user is linked to another account (secondary user), 
 * returns the primary user's ID. Otherwise returns their own ID.
 */
export async function getEffectiveUserId(req: Request): Promise<string> {
  const currentUserId = req.user?.id;
  
  if (!currentUserId) {
    throw new Error('User not authenticated');
  }

  try {
    // Check if this user is linked as a secondary user
    const { data: link } = await supabase
      .from('account_links')
      .select('primary_user_id')
      .eq('secondary_user_id', currentUserId)
      .single();

    // If linked, return the primary user's ID, otherwise return own ID
    return link?.primary_user_id || currentUserId;
  } catch (error) {
    // If no link found or error, return own ID
    return currentUserId;
  }
}

/**
 * Check if a user has any linked accounts (is primary user with secondaries)
 */
export async function getLinkedAccounts(userId: string) {
  const { data: links, error } = await supabase
    .from('account_links')
    .select('*')
    .eq('primary_user_id', userId);

  if (error) {
    console.error('Error fetching linked accounts:', error);
    return [];
  }

  return links || [];
}

/**
 * Check if current user is a secondary (linked) user
 */
export async function isLinkedUser(userId: string): Promise<boolean> {
  const { data: link } = await supabase
    .from('account_links')
    .select('primary_user_id')
    .eq('secondary_user_id', userId)
    .single();

  return !!link;
}

/**
 * Get primary user info if current user is linked
 */
export async function getPrimaryUserInfo(userId: string) {
  const { data: link } = await supabase
    .from('account_links')
    .select('primary_user_id')
    .eq('secondary_user_id', userId)
    .single();

  if (!link) return null;

  // Get primary user's email from auth.users
  const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(link.primary_user_id);
  
  if (error || !user) return null;

  return {
    id: user.id,
    email: user.email,
  };
}

/**
 * Create a link between two users (invite by email)
 */
export async function createAccountLink(primaryUserId: string, secondaryEmail: string) {
  // Find the user by email
  const { data: { users }, error: searchError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (searchError) {
    throw new Error('Failed to search for user');
  }

  const secondaryUser = users?.find(u => u.email?.toLowerCase() === secondaryEmail.toLowerCase());
  
  if (!secondaryUser) {
    throw new Error('User with that email not found');
  }

  if (secondaryUser.id === primaryUserId) {
    throw new Error('Cannot link to yourself');
  }

  // Check if secondary user is already linked
  const { data: existingLink } = await supabase
    .from('account_links')
    .select('*')
    .eq('secondary_user_id', secondaryUser.id)
    .single();

  if (existingLink) {
    throw new Error('That user is already linked to another account');
  }

  // Create the link
  const { data, error } = await supabase
    .from('account_links')
    .insert({
      primary_user_id: primaryUserId,
      secondary_user_id: secondaryUser.id,
    })
    .select()
    .single();

  if (error) {
    throw new Error('Failed to create account link');
  }

  return data;
}

/**
 * Remove link (unlink accounts)
 */
export async function removeAccountLink(primaryUserId: string, secondaryUserId: string) {
  const { error } = await supabase
    .from('account_links')
    .delete()
    .eq('primary_user_id', primaryUserId)
    .eq('secondary_user_id', secondaryUserId);

  if (error) {
    throw new Error('Failed to remove account link');
  }

  return true;
}
