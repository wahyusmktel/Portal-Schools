import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo
} from 'lucide-react'

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const extensions = [
  StarterKit,
  Underline,
];

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions,
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px] px-4 py-3 bg-white rounded-b-[8px]',
        placeholder: placeholder || 'Ketik sesuatu di sini...'
      }
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-zinc-200 rounded-[8px] bg-softgray focus-within:border-rosebrand-500 transition-colors flex flex-col">
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-zinc-200 bg-zinc-50 rounded-t-[8px]">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`p-2 rounded-[6px] hover:bg-zinc-200 text-zinc-700 transition ${
            editor.isActive('bold') ? 'bg-zinc-200 text-rosebrand-600 font-bold' : ''
          }`}
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`p-2 rounded-[6px] hover:bg-zinc-200 text-zinc-700 transition ${
            editor.isActive('italic') ? 'bg-zinc-200 text-rosebrand-600' : ''
          }`}
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          disabled={!editor.can().chain().focus().toggleUnderline().run()}
          className={`p-2 rounded-[6px] hover:bg-zinc-200 text-zinc-700 transition ${
            editor.isActive('underline') ? 'bg-zinc-200 text-rosebrand-600' : ''
          }`}
          title="Underline"
        >
          <UnderlineIcon size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={`p-2 rounded-[6px] hover:bg-zinc-200 text-zinc-700 transition ${
            editor.isActive('strike') ? 'bg-zinc-200 text-rosebrand-600' : ''
          }`}
          title="Strikethrough"
        >
          <Strikethrough size={16} />
        </button>

        <div className="w-px h-6 bg-zinc-300 mx-1"></div>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded-[6px] hover:bg-zinc-200 text-zinc-700 transition ${
            editor.isActive('heading', { level: 2 }) ? 'bg-zinc-200 text-rosebrand-600' : ''
          }`}
          title="Heading 2"
        >
          <Heading1 size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-2 rounded-[6px] hover:bg-zinc-200 text-zinc-700 transition ${
            editor.isActive('heading', { level: 3 }) ? 'bg-zinc-200 text-rosebrand-600' : ''
          }`}
          title="Heading 3"
        >
          <Heading2 size={16} />
        </button>

        <div className="w-px h-6 bg-zinc-300 mx-1"></div>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded-[6px] hover:bg-zinc-200 text-zinc-700 transition ${
            editor.isActive('bulletList') ? 'bg-zinc-200 text-rosebrand-600' : ''
          }`}
          title="Bullet List"
        >
          <List size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded-[6px] hover:bg-zinc-200 text-zinc-700 transition ${
            editor.isActive('orderedList') ? 'bg-zinc-200 text-rosebrand-600' : ''
          }`}
          title="Ordered List"
        >
          <ListOrdered size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded-[6px] hover:bg-zinc-200 text-zinc-700 transition ${
            editor.isActive('blockquote') ? 'bg-zinc-200 text-rosebrand-600' : ''
          }`}
          title="Blockquote"
        >
          <Quote size={16} />
        </button>

        <div className="w-px h-6 bg-zinc-300 mx-1"></div>

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          className="p-2 rounded-[6px] hover:bg-zinc-200 text-zinc-700 transition disabled:opacity-30 disabled:cursor-not-allowed"
          title="Undo"
        >
          <Undo size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className="p-2 rounded-[6px] hover:bg-zinc-200 text-zinc-700 transition disabled:opacity-30 disabled:cursor-not-allowed"
          title="Redo"
        >
          <Redo size={16} />
        </button>
      </div>

      <EditorContent editor={editor} className="flex-1 overflow-y-auto cursor-text" />
    </div>
  )
}
