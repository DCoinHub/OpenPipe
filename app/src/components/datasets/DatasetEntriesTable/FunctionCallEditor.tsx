import { useRef, useMemo, useEffect } from "react";
import { VStack, HStack, Text, Input, Box } from "@chakra-ui/react";
import { type ChatCompletionMessage } from "openai/resources/chat";

import { useAppStore } from "~/state/store";
import { type CreatedEditor } from "~/state/sharedVariantEditor.slice";

const FunctionCallEditor = ({
  function_call,
  onEdit,
}: {
  function_call: ChatCompletionMessage.FunctionCall;
  onEdit: (function_call: ChatCompletionMessage.FunctionCall) => void;
}) => {
  const monaco = useAppStore.use.sharedArgumentsEditor.monaco();
  const editorRef = useRef<CreatedEditor | null>(null);
  const editorId = useMemo(() => `editor_${Math.random().toString(36).substring(7)}`, []);

  useEffect(() => {
    if (monaco) {
      const container = document.getElementById(editorId) as HTMLElement;

      const editor = monaco.editor.create(container, {
        value: function_call.arguments,
        language: "json",
        theme: "customTheme",
        lineNumbers: "off",
        minimap: { enabled: false },
        wrappingIndent: "indent",
        wrappingStrategy: "advanced",
        wordWrap: "on",
        folding: false,
        scrollbar: {
          alwaysConsumeMouseWheel: false,
          verticalScrollbarSize: 0,
        },
        wordWrapBreakAfterCharacters: "",
        wordWrapBreakBeforeCharacters: "",
        quickSuggestions: true,
        renderLineHighlight: "none",
        fontSize: 14,
        scrollBeyondLastLine: false,
      });

      editorRef.current = editor;

      const updateHeight = () => {
        const contentHeight = editor.getContentHeight();
        container.style.height = `${contentHeight}px`;
        editor.layout();
      };

      const attemptDocumentFormat = () => {
        const action = editor.getAction("editor.action.formatDocument");
        if (action) {
          action
            .run()
            .then(updateHeight)
            .catch((error) => {
              console.error("Error running formatDocument:", error);
            });
          return true;
        }
        return false;
      };

      editor.onDidBlurEditorText(() => {
        attemptDocumentFormat();
        onEdit({ name: function_call.name, arguments: editor.getValue() });
      });

      // Interval function to check for action availability
      const checkForActionInterval = setInterval(() => {
        const formatted = attemptDocumentFormat();
        if (formatted) {
          clearInterval(checkForActionInterval); // Clear the interval once the action is found and run
        }
      }, 100); // Check every 100ms

      // Add content change listener
      const contentChangeListener = editor.onDidChangeModelContent(updateHeight);

      const resizeObserver = new ResizeObserver(() => {
        editor.layout();
      });
      resizeObserver.observe(container);

      return () => {
        contentChangeListener.dispose();
        resizeObserver.disconnect();
        editor?.dispose();
      };
    }
  }, [monaco, editorId, function_call.name, function_call.arguments, onEdit]);

  return (
    <VStack w="full" alignItems="flex-start">
      <HStack w="full">
        <Text fontWeight="bold" w={192}>
          Name:
        </Text>
        <Input
          value={function_call.name}
          onChange={(e) => onEdit({ name: e.target.value, arguments: function_call.arguments })}
          bgColor="white"
        />
      </HStack>
      <Text fontWeight="bold" w={32}>
        Arguments
      </Text>
      <VStack
        borderRadius={4}
        border="1px solid"
        borderColor="gray.200"
        w="full"
        py={1}
        bgColor="white"
      >
        <Box id={editorId} w="full" />
      </VStack>
    </VStack>
  );
};

export default FunctionCallEditor;
