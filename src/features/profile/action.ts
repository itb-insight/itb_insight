'use server'

import { revalidatePath } from "next/cache";
import { createClient } from '@/lib/supabase/server'

export type ProfileState = { ok: boolean; message: string } | null

const text = (fd: FormData, key: string) => String(fd.get(key) ?? '').trim()

export async function updateProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser(); // Re-check auth
    if (!user) return { ok: false, message: 'Silakan masuk terlebih dahulu.' };

    const full_name = text(formData, 'full_name')
    const phone = text(formData, 'phone')
    const institution = text(formData, 'institution')
    if (!full_name || !phone || !institution) {
        return { ok: false, message: 'Semua kolom wajib diisi.' };
    }
    // Same limits as the profiles_field_lengths constraint (0023_security_hardening).
    if (full_name.length > 120 || phone.length > 32 || institution.length > 200) {
        return { ok: false, message: 'Isian terlalu panjang.' };
    }

    const { error } = await supabase
        .from('profiles')
        .update({ full_name, phone, institution })
        .eq('id', user.id)

    if (error) {
        console.error('[updateProfile]', error.message)
        return { ok: false, message: 'Gagal menyimpan profil. Coba lagi.' };
    }

    revalidatePath('/dashboard/profile');
    return { ok: true, message: 'Profil berhasil diperbarui.' };
}