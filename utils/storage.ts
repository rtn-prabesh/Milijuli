import { supabase } from "./supabase";

/**
 * Uploads a receipt proof file to the Supabase Storage 'proofs' bucket.
 * 
 * @param file The file object to upload
 * @param folder The target subfolder inside the bucket ('savings' | 'loans' | 'payments')
 * @returns The relative storage path (e.g., 'savings/filename.jpg')
 */
export async function uploadProofFile(
  file: File,
  folder: "savings" | "loans" | "payments"
): Promise<string> {
  if (!file) throw new Error("No file provided for upload");

  const fileExt = file.name.split(".").pop();
  const randomId = crypto.randomUUID();
  const filePath = `${folder}/${randomId}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from("proofs")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("[Storage] Upload failed:", error.message);
    throw new Error(`Upload failed: ${error.message}`);
  }

  return data.path; // This is the relative path (e.g., 'savings/some-uuid.jpg')
}
