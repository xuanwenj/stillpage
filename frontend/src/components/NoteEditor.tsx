import { useEditor, EditorContent } from "@tiptap/react";
import { useState, useEffect } from "react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";

interface NoteEditorProps {
  note: {
    title: string;
    content: string;
  };
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  initialTitle: string;
}

export const NoteEditor = ({
  note,
  onContentChange,
  onTitleChange,
  //  onSave,
  initialTitle,
}: NoteEditorProps) => {
  const [title, setTitle] = useState(initialTitle || note.title);

  // Update title state when initialTitle changes
  useEffect(() => {
    setTitle(initialTitle || note.title);
  }, [initialTitle, note.title]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        blockquote: false,
        codeBlock: false,
        underline: false,
      }),
      Underline,
      Image.configure({
        allowBase64: true,
      }),
    ],
    content: note.content || "<p>Start typing here...</p>",
    onUpdate: ({ editor }) => {
      // Call the callback when content changes
      onContentChange(editor.getHTML());
    },
  });

  if (!editor) {
    return <div className="note-editor">Loading editor...</div>;
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    onTitleChange(newTitle);
  };

  return (
    <div className="note-editor">
      {/* Title Input */}
      <input
        type="text"
        value={title}
        onChange={handleTitleChange}
        placeholder="Note title..."
        className="note-editor-title"
      />

      {/* Toolbar */}
      <div className="note-editor-toolbar">
        <button
          className={`toolbar-btn ${editor.isActive("bold") ? "active" : ""}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          Bold
        </button>
        <button
          className={`toolbar-btn ${editor.isActive("italic") ? "active" : ""}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          Italic
        </button>
        <button
          className={`toolbar-btn ${editor.isActive("underline") ? "active" : ""}`}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          Underline
        </button>
        <button
          className={`toolbar-btn ${editor.isActive("heading", { level: 1 }) ? "active" : ""}`}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
        >
          H1
        </button>
        <button
          className={`toolbar-btn ${editor.isActive("heading", { level: 2 }) ? "active" : ""}`}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          H2
        </button>
        <button
          className={`toolbar-btn ${editor.isActive("bulletList") ? "active" : ""}`}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          List
        </button>
        <button
          className="toolbar-btn"
          onClick={() =>
            editor
              .chain()
              .focus()
              .setImage({ src: prompt("Enter image URL:") || "" })
              .run()
          }
        >
          Image
        </button>
      </div>

      {/* Editor */}
      <div className="note-editor-content">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
export default NoteEditor;
