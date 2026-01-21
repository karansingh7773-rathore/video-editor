import useStore from "../store/use-store";
import { useEffect, useRef, useState } from "react";
import { Droppable } from "@/components/ui/droppable";
import { PlusIcon } from "lucide-react";
import { DroppableArea } from "./droppable";
import { dispatch } from "@designcombo/events";
import { ADD_VIDEO, ADD_IMAGE, ADD_AUDIO } from "@designcombo/state";
import { generateId } from "@designcombo/timeline";

const SceneEmpty = () => {
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [desiredSize, setDesiredSize] = useState({ width: 0, height: 0 });
  const { size } = useStore();

  useEffect(() => {
    const container = containerRef.current!;
    const PADDING = 96;
    const containerHeight = container.clientHeight - PADDING;
    const containerWidth = container.clientWidth - PADDING;
    const { width, height } = size;

    const desiredZoom = Math.min(
      containerWidth / width,
      containerHeight / height
    );
    setDesiredSize({
      width: width * desiredZoom,
      height: height * desiredZoom
    });
    setIsLoading(false);
  }, [size]);

  const onSelectFiles = (files: File[]) => {
    console.log("Files selected:", files);

    if (files.length === 0) return;

    // Directly add files to the timeline (for mobile users who can't access Uploads panel)
    files.forEach((file) => {
      const blobUrl = URL.createObjectURL(file);
      const fileType = file.type.split("/")[0]; // 'video', 'image', 'audio'

      if (fileType === "video") {
        dispatch(ADD_VIDEO, {
          payload: {
            id: generateId(),
            details: {
              src: blobUrl
            },
            metadata: {}
          },
          options: {
            resourceId: "main",
            scaleMode: "fit"
          }
        });
      } else if (fileType === "image") {
        dispatch(ADD_IMAGE, {
          payload: {
            id: generateId(),
            type: "image",
            display: {
              from: 0,
              to: 5000
            },
            details: {
              src: blobUrl
            },
            metadata: {}
          },
          options: {}
        });
      } else if (fileType === "audio") {
        dispatch(ADD_AUDIO, {
          payload: {
            id: generateId(),
            type: "audio",
            details: {
              src: blobUrl
            },
            metadata: {}
          },
          options: {}
        });
      }
    });
  };

  // Hidden file input ref for click-to-upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onSelectFiles(Array.from(files));
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  return (
    <div ref={containerRef} className="absolute z-50 flex h-full w-full flex-1">
      {/* Hidden file input for click-to-upload */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="video/*,audio/*,image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />
      {!isLoading ? (
        <Droppable
          maxFileCount={4}
          maxSize={500 * 1024 * 1024}
          disabled={false}
          onValueChange={onSelectFiles}
          className="h-full w-full flex-1 bg-background"
          accept={{
            "video/*": [],
            "audio/*": [],
            "image/*": []
          }}
        >
          <DroppableArea
            onDragStateChange={setIsDraggingOver}
            className={`absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 transform items-center justify-center border border-dashed text-center transition-colors duration-200 ease-in-out cursor-pointer ${isDraggingOver ? "border-white bg-white/10" : "border-white/15 hover:border-white/40 hover:bg-white/5"
              }`}
            style={{
              width: desiredSize.width,
              height: desiredSize.height
            }}
          >
            <div
              className="flex flex-col items-center justify-center gap-4 pb-12 w-full h-full"
              onClick={handleClick}
            >
              <div className="hover:bg-primary-dark cursor-pointer rounded-md border bg-primary p-2 text-secondary transition-colors duration-200">
                <PlusIcon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-px">
                <p className="text-sm text-muted-foreground">Click to upload</p>
                <p className="text-xs text-muted-foreground/70">
                  Or drag and drop files here
                </p>
              </div>
            </div>
          </DroppableArea>
        </Droppable>
      ) : (
        <div className="flex flex-1 items-center justify-center bg-background-subtle text-sm text-muted-foreground">
          Loading...
        </div>
      )}
    </div>
  );
};

export default SceneEmpty;
