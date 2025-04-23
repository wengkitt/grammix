/// <reference types="chrome" />
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import "./popup.css";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const Popup: React.FC = () => {
  const [text, setText] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    chrome.storage.local.get(
      ["correctedText"],
      (result: { correctedText?: string }) => {
        setText(result.correctedText || "");
      }
    );
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => console.error("Copy failed:", err));
  };

  return (
    <div className="w-[400px]">
      <Card>
        <CardHeader>
          <CardTitle>Corrected Text</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="corrected-text">Your corrected text is ready</Label>
            <Textarea
              id="corrected-text"
              value={text}
              readOnly
              className="min-h-[150px] resize-none"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={copyToClipboard}
            variant="default"
            size="default"
            className="w-full"
          >
            {copied ? "Copied!" : "Copy to Clipboard"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<Popup />);

export default Popup;
