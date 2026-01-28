import supabase from "../app/middlewares/supabaseClient";

export const deleteImageFromSupabase = async (
  publicUrl: string,
): Promise<void> => {
  // Extract file path from public URL
  // Example URL: https://xyz.supabase.co/storage/v1/object/public/attachments/proflow/images/filename.jpg
  // Path needed: proflow/images/filename.jpg

  const urlParts = publicUrl.split("/attachments/");
  if (urlParts.length < 2) {
    throw new Error("Invalid Supabase URL");
  }

  const filePath = urlParts[1];

  const { error } = await supabase.storage
    .from("attachments")
    .remove([filePath]);

  if (error) {
    throw new Error("Image deletion failed");
  }
};
