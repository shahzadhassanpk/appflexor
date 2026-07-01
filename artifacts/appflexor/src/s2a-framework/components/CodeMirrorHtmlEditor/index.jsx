// import React, { useState, useEffect } from "react";
// import "codemirror/lib/codemirror.css";
// import "codemirror/mode/htmlmixed/htmlmixed";
// import "codemirror/addon/fold/foldgutter.css";
// import "codemirror/addon/fold/foldgutter";
// import "codemirror/addon/fold/brace-fold";
// import "codemirror/addon/fold/foldcode";
// import "codemirror/addon/format/format";
// import { Controlled as ControlledEditor } from "react-codemirror2";

// function HTMLCodeEditor({ code, onChange }) {
//     const [formattedCode, setFormattedCode] = useState(code);

//     useEffect(() => {
//         setFormattedCode(code);
//     }, [code]);

//     const handleFormat = () => {
//         const editor = editorRef.current.editor;
//         if (editor) {
//             editor.execCommand("format");
//         }
//     };

//     const handleChange = (editor, data, value) => {
//         setFormattedCode(value);
//         if (onChange) {
//             onChange(value);
//         }
//     };

//     const editorRef = React.createRef();

//     return (
//         <div>
//             <button onClick={handleFormat}>Format HTML</button>
//             <ControlledEditor
//                 onBeforeChange={handleChange}
//                 value={formattedCode}
//                 options={{
//                     lineNumbers: true,
//                     mode: "htmlmixed",
//                     foldGutter: true,
//                     gutters: [
//                         "CodeMirror-linenumbers",
//                         "CodeMirror-foldgutter",
//                     ],
//                     extraKeys: {
//                         "Ctrl-Space": "autocomplete",
//                         "Ctrl-Enter": cm => cm.foldCode(cm.getCursor()),
//                     },
//                 }}
//                 ref={editorRef}
//             />
//         </div>
//     );
// }

// export default HTMLCodeEditor;
