"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { SquarePen } from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

const useAIGrammerChecker = () => {
  const [isChecking, setIsChecking] = React.useState(false);
  const [correction, setCorrection] = React.useState<string>("");
  const correctionRef = React.useRef<HTMLDivElement>(null);

  const handleSummarize = async (selectedText: string) => {
    if (!selectedText) {
      return;
    }

    setIsChecking(true);
    setCorrection("");

    try {
      const response = await fetch("/api/buttons/AIGrammarCheckButton", {
        method: "POST",
        body: `correct the grammar and style of the following text: ${selectedText}`,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = (await reader?.read()) ?? {
          done: true,
          value: new Uint8Array(),
        };
        if (done) break;
        const chunk = decoder.decode(value);
        setCorrection((prev) => prev + chunk);
      }
    } catch (error) {
      console.error("Error corerecting text:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      correctionRef.current &&
      !correctionRef.current.contains(event.target as Node)
    ) {
      setCorrection("");
    }
  };

  React.useEffect(() => {
    if (correction) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [correction]);

  return { isChecking, correction, handleSummarize, correctionRef };
};

interface AIGrammarCheckButtonProps {
  className?: string;
  buttonClassName?: string;
  tooltipClassName?: string;
  correctionClassName?: string;
}

const AIGrammarCheckButton: React.FC<AIGrammarCheckButtonProps> = ({
  className,
  buttonClassName,
  tooltipClassName,
  correctionClassName,
  ...props
}) => {
  const { isChecking, correction, handleSummarize, correctionRef } =
    useAIGrammerChecker();

  const handleClick = async () => {
    const selectedText = window.getSelection()?.toString();
    await handleSummarize(selectedText || "");
  };

  return (
    <div className={cn("relative", className)}>
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <motion.button
              onClick={handleClick}
              whileTap={{ scale: 1 }}
              whileHover={{ scale: 1.1 }}
              className={cn(
                "p-3 bg-primary text-primary-foreground rounded-full shadow-lg",
                buttonClassName
              )}
              disabled={isChecking}
            >
              <SquarePen
                className={cn("h-6 w-6", isChecking ? "animate-pulse" : "")}
              />
              <span className="sr-only">Check selected text</span>
            </motion.button>
          </Tooltip.Trigger>
          <Tooltip.Content
            className={cn(
              "bg-secondary text-secondary-foreground px-3 py-1 rounded shadow-md text-sm",
              tooltipClassName
            )}
            sideOffset={5}
            {...props}
          >
            Check selected text
          </Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>
      {correction && (
        <div
          ref={correctionRef}
          className={cn(
            "absolute top-full mt-4 w-64 max-h-80 p-4 bg-background border border-border rounded-md shadow-lg overflow-y-auto",
            "scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-black scrollbar-track-gray-100",
            correctionClassName
          )}
        >
          <h3 className="text-lg font-semibold mb-2">Correction:</h3>
          <p className="text-sm">{correction}</p>
        </div>
      )}
    </div>
  );
};

export { AIGrammarCheckButton };
