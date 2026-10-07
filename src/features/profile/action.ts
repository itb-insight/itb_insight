'use server'

import { revalidatePath } from "next/cache";
import { createClient } from '@/lib/supabase/server'

export type ProfileState = { ok: boolean; message: string } | null

const text = (fd: FormData, key: string) => String(fd.get(key) ?? '').trim()

export async function updateProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser(); // Re-check auth
    if (!user) return { ok: false, message: 'Name tidak boleh kosong.' };

    const full_name = text(formData, 'full_name')
    const phone = text(formData, 'phone')
    const institution = text(formData, 'institution')
    if (!full_name || !phone || !institution) {
        return { ok: false, message: 'Semua kolom wajib diisi.' };
    }

    const { error } = await supabase
        .from('profiles')
        .update({ full_name, phone, institution })
        .eq('id', user.id)

    if (error) return { ok: false, message: error.message };

    revalidatePath('/dashboard/profile');
    return { ok: true, message: 'Profil berhasil diperbarui.' };
}