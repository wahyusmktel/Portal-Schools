import type { Metadata } from "next";
import { CommentManager } from "@/components/CommentManager";

export const metadata: Metadata = {
  title: "Manajemen Komentar | Portal Admin",
};

export default function CommentsPage() {
  return <CommentManager />;
}
