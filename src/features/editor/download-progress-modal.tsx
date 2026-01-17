import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useDownloadState } from "./store/use-download-state";
import { Button } from "@/components/ui/button";
import { CircleCheckIcon, XIcon, Loader2 } from "lucide-react";
import { DialogDescription, DialogTitle } from "@radix-ui/react-dialog";

const DownloadProgressModal = () => {
  const { progress, displayProgressModal, output, actions, statusMessage, exporting } =
    useDownloadState();
  const isCompleted = progress === 100 && !exporting;

  const handleDownload = () => {
    if (output?.url) {
      const link = document.createElement("a");
      link.href = output.url;
      link.download = output.type === "json" ? "edit_decision_list.json" : "rendered_video.mp4";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log("Downloaded:", output.type);
    }
  };

  return (
    <Dialog
      open={displayProgressModal}
      onOpenChange={actions.setDisplayProgressModal}
    >
      <DialogContent className="flex h-[627px] flex-col gap-0 bg-background p-0 sm:max-w-[844px]">
        <DialogTitle className="hidden" />
        <DialogDescription className="hidden" />
        <XIcon
          onClick={() => actions.setDisplayProgressModal(false)}
          className="absolute right-4 top-5 h-5 w-5 text-zinc-400 hover:cursor-pointer hover:text-zinc-500"
        />
        <div className="flex h-16 items-center border-b px-4 font-medium">
          {isCompleted ? "Download Ready" : "Rendering..."}
        </div>
        {isCompleted ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 space-y-4">
            <div className="flex flex-col items-center space-y-1 text-center">
              <div className="font-semibold text-green-500">
                <CircleCheckIcon className="h-12 w-12" />
              </div>
              <div className="font-bold text-xl">
                {output?.type === "mp4" ? "Video Rendered!" : "Export Ready"}
              </div>
              <div className="text-muted-foreground">
                {output?.type === "mp4"
                  ? "Your video has been rendered with FFmpeg."
                  : "Your edit decision list is ready."}
              </div>
            </div>
            <Button onClick={handleDownload} size="lg">
              Download {output?.type?.toUpperCase() || "File"}
            </Button>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="text-5xl font-semibold">
              {Math.floor(progress)}%
            </div>
            <div className="font-bold">{statusMessage || "Processing..."}</div>
            <div className="text-center text-zinc-500 max-w-md">
              <div>Your video is being processed on the server.</div>
              <div>This may take a few moments depending on video length.</div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DownloadProgressModal;
