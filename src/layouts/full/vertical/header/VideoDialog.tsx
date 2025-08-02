import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
} from "@mui/material";
import { IconX } from "@tabler/icons-react";

interface VideoDialogProps {
  open: boolean;
  onClose: () => void;
  videoLink: string;
}

const VideoDialog = ({ open, onClose, videoLink }: VideoDialogProps) => {
  const isYouTubeUrl = (url: string) => {
    return url.includes("youtube.com") || url.includes("youtu.be");
  };

  const getVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const renderVideo = () => {
    if (isYouTubeUrl(videoLink)) {
      const videoId = getVideoId(videoLink);
      const embedUrl = `https://www.youtube.com/embed/${videoId}`;

      return (
        <iframe
          src={embedUrl}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            border: "none",
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    } else {
      return (
        <video
          src={videoLink}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            border: "none",
          }}
          controls
        />
      );
    }
  };

  return (
    <Dialog
      open={open}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          position: "relative",
        },
      }}
    >
      <IconButton
        onClick={onClose}
        sx={{
          position: "absolute",
          right: 8,
          top: 8,
          zIndex: 1,
          color: "white",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          "&:hover": {
            backgroundColor: "rgba(0, 0, 0, 0.7)",
          },
        }}
      >
        <IconX size={20} />
      </IconButton>
      <DialogContent sx={{ p: 0, position: "relative", paddingTop: "56.25%" }}>
        {renderVideo()}
      </DialogContent>
    </Dialog>
  );
};

export default VideoDialog;
