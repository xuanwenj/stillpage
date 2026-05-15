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
  onSave: () => void;
  initialTitle: string;
}

export const NoteEditor = ({
  note,
  onContentChange,
  onTitleChange,
  onSave,
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
    return <div style={{ padding: "20px" }}>Loading editor...</div>;
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    onTitleChange(newTitle);
  };

  return (
    <div style={{ fontFamily: "system-ui" }}>
      {/* Title Input */}
      <input
        type="text"
        value={title}
        onChange={handleTitleChange}
        placeholder="Note title..."
        style={{
          width: "100%",
          fontSize: "18px",
          fontWeight: "bold",
          marginBottom: "15px",
          padding: "8px",
          border: "none",
          borderBottom: "1px solid #ddd",
          outline: "none",
        }}
      />

      {/* Toolbar */}
      <div
        style={{
          marginBottom: "10px",
          display: "flex",
          gap: "5px",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          style={{ fontWeight: editor.isActive("bold") ? "bold" : "normal" }}
        >
          Bold
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          style={{ fontStyle: editor.isActive("italic") ? "italic" : "normal" }}
        >
          Italic
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          style={{
            textDecoration: editor.isActive("underline") ? "underline" : "none",
          }}
        >
          Underline
        </button>
        <button
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
        >
          H1
        </button>
        <button
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          H2
        </button>
        <button onClick={() => editor.chain().focus().toggleBulletList().run()}>
          List
        </button>
        <button
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
      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: "4px",
          minHeight: "300px",
          padding: "10px",
          marginBottom: "15px",
        }}
      >
        <EditorContent editor={editor} />
      </div>

      {/* Save Button */}
      <button
        onClick={onSave}
        style={{
          padding: "10px 20px",
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "14px",
        }}
      >
        Save
      </button>
    </div>
  );
};
export default NoteEditor;
