"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { Bold, Eraser, Heading1, Heading2, Italic, List, ListOrdered, Minus, Pilcrow, Quote, Redo, Strikethrough, Underline as UnderlineIcon, Undo } from "lucide-react";
import { useEffect } from "react";
import type { ReactNode } from "react";

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

const extensions = [
  StarterKit.configure({
    heading: {
      levels: [2, 3]
    }
  }),
  Underline
];

export function RichTextEditor({ value, onChange, placeholder = "Tulis isi artikel di sini..." }: RichTextEditorProps) {
  const editor = useEditor({
    extensions,
    content: value || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[360px] max-w-none rounded-b-[8px] bg-white px-5 py-4 text-base leading-8 text-zinc-800 outline-none [&_blockquote]:border-l-4 [&_blockquote]:border-rosebrand-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_h2]:mt-6 [&_h2]:text-2xl [&_h2]:font-black [&_h3]:mt-5 [&_h3]:text-xl [&_h3]:font-black [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6"
      }
    },
    onUpdate: ({ editor }) => {
      onChange(editor.isEmpty ? "" : editor.getHTML());
    }
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.isEmpty ? "" : editor.getHTML();
    if ((value || "") !== current) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) {
    return (
      <div className="grid min-h-[420px] place-items-center rounded-[8px] border border-zinc-200 bg-white text-sm font-bold text-zinc-500">
        Memuat editor artikel...
      </div>
    );
  }

  const isEmpty = editor.isEmpty;

  return (
    <div className="overflow-hidden rounded-[8px] border border-zinc-200 bg-white shadow-sm transition focus-within:border-rosebrand-500 focus-within:ring-4 focus-within:ring-rosebrand-500/10">
      <div className="flex flex-wrap items-center gap-1 border-b border-zinc-200 bg-zinc-50 p-2">
        <ToolbarButton label="Paragraf" active={editor.isActive("paragraph")} onClick={() => editor.chain().focus().setParagraph().run()}>
          <Pilcrow size={16} aria-hidden />
        </ToolbarButton>
        <ToolbarButton label="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading1 size={16} aria-hidden />
        </ToolbarButton>
        <ToolbarButton label="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading2 size={16} aria-hidden />
        </ToolbarButton>

        <Separator />

        <ToolbarButton label="Bold" active={editor.isActive("bold")} disabled={!editor.can().chain().focus().toggleBold().run()} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={16} aria-hidden />
        </ToolbarButton>
        <ToolbarButton label="Italic" active={editor.isActive("italic")} disabled={!editor.can().chain().focus().toggleItalic().run()} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={16} aria-hidden />
        </ToolbarButton>
        <ToolbarButton label="Underline" active={editor.isActive("underline")} disabled={!editor.can().chain().focus().toggleUnderline().run()} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon size={16} aria-hidden />
        </ToolbarButton>
        <ToolbarButton label="Coret" active={editor.isActive("strike")} disabled={!editor.can().chain().focus().toggleStrike().run()} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough size={16} aria-hidden />
        </ToolbarButton>

        <Separator />

        <ToolbarButton label="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={16} aria-hidden />
        </ToolbarButton>
        <ToolbarButton label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={16} aria-hidden />
        </ToolbarButton>
        <ToolbarButton label="Kutipan" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote size={16} aria-hidden />
        </ToolbarButton>
        <ToolbarButton label="Garis pemisah" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus size={16} aria-hidden />
        </ToolbarButton>

        <Separator />

        <ToolbarButton label="Undo" disabled={!editor.can().chain().focus().undo().run()} onClick={() => editor.chain().focus().undo().run()}>
          <Undo size={16} aria-hidden />
        </ToolbarButton>
        <ToolbarButton label="Redo" disabled={!editor.can().chain().focus().redo().run()} onClick={() => editor.chain().focus().redo().run()}>
          <Redo size={16} aria-hidden />
        </ToolbarButton>
        <ToolbarButton label="Bersihkan format" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
          <Eraser size={16} aria-hidden />
        </ToolbarButton>
      </div>

      <div className="relative">
        {isEmpty ? (
          <p className="pointer-events-none absolute left-5 top-4 select-none text-base font-semibold text-zinc-400">
            {placeholder}
          </p>
        ) : null}
        <EditorContent editor={editor} className="max-h-[560px] min-h-[360px] overflow-y-auto" />
      </div>
    </div>
  );
}

function ToolbarButton({
  label,
  active = false,
  disabled = false,
  onClick,
  children
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`grid h-9 w-9 place-items-center rounded-[8px] text-zinc-600 transition hover:bg-zinc-200 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-35 ${
        active ? "bg-rosebrand-50 text-rosebrand-700 ring-1 ring-rosebrand-200" : ""
      }`}
    >
      {children}
    </button>
  );
}

function Separator() {
  return <span className="mx-1 h-6 w-px bg-zinc-300" aria-hidden />;
}
