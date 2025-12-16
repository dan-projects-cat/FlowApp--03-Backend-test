
import { supabase } from '../supabaseClient';
import { USERS, VENDORS, RESTAURANTS, BOARD_TEMPLATES, MENU_TEMPLATES, MENU_ITEM_TEMPLATES } from '../data';
import { UserRole } from '../types';

const toEmail = (username: string) => `${username.toLowerCase().replace(/\s/g, '')}@flowapp.test`;

export const seedDatabase = async (): Promise<string> => {
    let log = "Starting Supabase seed...\n";

    // 1. CLEAR TABLES
    const tables = [
        'orders', 
        'users', 
        'restaurants', 
        'boardTemplates', 
        'menuTemplates', 
        'menuItemTemplates', 
        'vendors' 
    ];

    for (const t of tables) {
        const { error } = await supabase.from(t).delete().neq('id', '00000000-0000-0000-0000-000000000000'); 
        if (error) {
            if (error.code !== 'PGRST116') {
                 // Common RLS error code is 42501. We proceed anyway, assuming we might just need to insert.
                 log += `[WARN] Error clearing ${t}: ${error.message} (Code: ${error.code}). Proceeding...\n`;
            }
        }
    }
    log += "Tables clear attempt finished.\n";

    const idMap: Record<string, string> = {};

    // 2. VENDORS
    for (const v of VENDORS) {
        const { data, error } = await supabase.from('vendors').insert({ name: v.name }).select().single();
        if (data) {
            idMap[`vendor_${v.id}`] = data.id;
            log += `Created Vendor: ${v.name}\n`;
        } else {
            log += `Failed Vendor ${v.name}: ${error?.message || 'Unknown Error'}\n`;
        }
    }

    // 3. TEMPLATES
    for (const t of BOARD_TEMPLATES) {
        const newVendorId = idMap[`vendor_${t.vendorId}`];
        if (!newVendorId) continue;
        const { data } = await supabase.from('boardTemplates').insert({ ...t, id: undefined, vendorId: newVendorId }).select().single();
        if (data) idMap[`board_${t.id}`] = data.id;
    }
    for (const t of MENU_ITEM_TEMPLATES) {
        const newVendorId = idMap[`vendor_${t.vendorId}`];
        if (!newVendorId) continue;
        const { data } = await supabase.from('menuItemTemplates').insert({ ...t, id: undefined, vendorId: newVendorId }).select().single();
        if (data) idMap[`item_${t.id}`] = data.id;
    }
    for (const t of MENU_TEMPLATES) {
        const newVendorId = idMap[`vendor_${t.vendorId}`];
        if (!newVendorId) continue;
        const newSections = t.sections.map(sec => ({
            ...sec,
            itemIds: sec.itemIds.map(oldId => idMap[`item_${oldId}`] || oldId)
        }));

        const { data } = await supabase.from('menuTemplates').insert({ ...t, id: undefined, vendorId: newVendorId, sections: newSections }).select().single();
        if (data) idMap[`menu_${t.id}`] = data.id;
    }

    // 4. RESTAURANTS
    for (const r of RESTAURANTS) {
        const newVendorId = idMap[`vendor_${r.vendorId}`];
        const newBoardId = r.boardTemplateId ? idMap[`board_${r.boardTemplateId}`] : null;
        const newMenuIds = r.assignedMenuTemplateIds?.map(old => idMap[`menu_${old}`]).filter(Boolean);

        const { data } = await supabase.from('restaurants').insert({
            ...r,
            id: undefined,
            vendorId: newVendorId,
            boardTemplateId: newBoardId,
            assignedMenuTemplateIds: newMenuIds
        }).select().single();
        
        if (data) {
            idMap[`restaurant_${r.id}`] = data.id;
            log += `Created Restaurant: ${r.name}\n`;
        }
    }

    // 5. USERS
    for (const u of USERS) {
        if (!u.username) continue;
        const email = toEmail(u.username);
        const password = u.password || 'password';

        // Try SignUp
        let { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
        
        // If user already exists, try to sign in to get their ID to repair the profile
        if (authError && authError.message.toLowerCase().includes('registered')) {
             const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
             if (signInData.user) {
                 authData.user = signInData.user;
                 log += `User ${u.username} exists. Signed in to update profile.\n`;
             } else {
                 log += `[ERROR] User ${u.username} exists but cannot sign in: ${signInError?.message}. (Is 'Confirm Email' enabled in Supabase? Is 'Email' provider enabled?)\n`;
             }
        } else if (authError) {
             log += `[ERROR] Auth SignUp failed for ${u.username}: ${authError.message}\n`;
        }

        if (authData.user) {
            const userId = authData.user.id;
            
            const newVendorId = u.vendorId ? idMap[`vendor_${u.vendorId}`] : null;
            const newRestId = u.restaurantId ? idMap[`restaurant_${u.restaurantId}`] : null;
            
            const { error: profileError } = await supabase.from('users').upsert({
                id: userId,
                name: u.name,
                username: u.username,
                role: u.role,
                vendorId: newVendorId,
                restaurantId: newRestId,
                permissions: u.permissions,
                permissionSchedule: u.permissionSchedule
            });
            
            if (!profileError) log += `✓ Seeded/Updated Profile: ${u.username}\n`;
            else log += `[ERROR] Failed Profile ${u.username}: ${profileError.message} (Likely RLS blocking insert)\n`;
        }
    }

    return log + "\nDone! Check logs for any Errors.";
};
