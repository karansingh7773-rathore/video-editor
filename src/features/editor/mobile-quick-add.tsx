import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Music } from "lucide-react";
import { dispatch } from "@designcombo/events";
import { ADD_VIDEO, ADD_AUDIO, ADD_IMAGE } from "@designcombo/state";
import { generateId } from "@designcombo/timeline";

interface MobileQuickAddProps {
    hasContent: boolean;
}

export const MobileQuickAdd = ({ hasContent }: MobileQuickAddProps) => {
    const videoInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);

    const handleAddMedia = () => {
        videoInputRef.current?.click();
    };

    const handleAddAudio = () => {
        audioInputRef.current?.click();
    };

    const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        Array.from(files).forEach((file) => {
            const blobUrl = URL.createObjectURL(file);
            const fileType = file.type.split("/")[0];

            if (fileType === "video") {
                dispatch(ADD_VIDEO, {
                    payload: {
                        id: generateId(),
                        details: { src: blobUrl },
                        metadata: {}
                    },
                    options: { resourceId: "main", scaleMode: "fit" }
                });
            } else if (fileType === "image") {
                dispatch(ADD_IMAGE, {
                    payload: {
                        id: generateId(),
                        type: "image",
                        display: { from: 0, to: 5000 },
                        details: { src: blobUrl },
                        metadata: {}
                    },
                    options: {}
                });
            }
        });
        e.target.value = "";
    };

    const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        Array.from(files).forEach((file) => {
            const blobUrl = URL.createObjectURL(file);
            dispatch(ADD_AUDIO, {
                payload: {
                    id: generateId(),
                    type: "audio",
                    details: { src: blobUrl },
                    metadata: {}
                },
                options: {}
            });
        });
        e.target.value = "";
    };

    if (!hasContent) return null;

    return (
        <div className="flex items-center justify-center gap-3 py-2 px-4 border-t bg-muted/50">
            {/* Hidden file inputs */}
            <input
                ref={videoInputRef}
                type="file"
                accept="video/*,image/*"
                multiple
                onChange={handleVideoSelect}
                className="hidden"
            />
            <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                multiple
                onChange={handleAudioSelect}
                className="hidden"
            />

            {/* Add Media Button */}
            <Button
                variant="outline"
                size="sm"
                onClick={handleAddMedia}
                className="flex items-center gap-1.5"
            >
                <Plus className="h-4 w-4" />
                <span>Add Media</span>
            </Button>

            {/* Add Audio Button */}
            <Button
                variant="outline"
                size="sm"
                onClick={handleAddAudio}
                className="flex items-center gap-1.5"
            >
                <Music className="h-4 w-4" />
                <span>Audio</span>
            </Button>
        </div>
    );
};

export default MobileQuickAdd;
