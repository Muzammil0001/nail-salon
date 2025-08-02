import React, { useState, useRef } from "react";
import { styled } from "@mui/material/styles";
import { Paper, Typography, Box, FormHelperText } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

const UploadContainer = styled(Paper)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  border: "1px solid #CCCCCC",
  borderRadius: "8px",
  cursor: "pointer",
  textAlign: "center",
  height: "168px",
  width: "368px",
  "&:hover": {
    backgroundColor: "#f5f5f5",
  },
}));

const UploadArea = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: theme.spacing(2),
}));

type FileType = "image" | "video" | "all";

type CustomFileUploadProps = {
  onFileUpload: (file: string) => void;
  sx?: object;
  children?: React.ReactNode;
  error?: boolean;
  helperText?: string | false;
  fileName?: string;
  multiSelect?: boolean;
  video?: any;
  fileType?: FileType;
  onChange: any;
  accept: any;
};

const CustomFileUpload = ({
  onFileUpload,
  sx,
  children,
  error,
  helperText,
  fileName,
  video,
  multiSelect = false,
  fileType = "all",
  ...props
}: CustomFileUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const droppedFiles = event.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      handleFileSelect(droppedFiles[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        const base64String = reader.result.toString();
        onFileUpload(base64String);
        setFile(selectedFile);
        if (props.onChange) {
          props.onChange({ target: { files: [selectedFile] } });
        }
      }
    };

    reader.readAsDataURL(selectedFile);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleContainerClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const getAcceptType = () => {
    switch (fileType) {
      case "image":
        return "image/*";
      case "video":
        return "video/*";
      case "all":
      default:
        return "*/*";
    }
  };

  return (
    <>
      <UploadContainer
        className="overflow-hidden"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={handleContainerClick}
        elevation={0}
        sx={{ border: "1px solid #CCCCCC" }}
        {...props}
      >
        {video ? (
          <video controls className="min-w-full min-h-full" src={video} />
        ) : (
          <>
            <UploadArea>
              <CloudUploadIcon
                sx={{ color: "#CCCCCC", width: "66px", height: "52px" }}
              />
              <Typography
                variant="h6"
                component="div"
                sx={{ color: "#666666" }}
                className="w-[150px] truncate text-wrap"
              >
                {file ? file.name : fileName || "Upload a File"}
              </Typography>
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ color: "#666666" }}
              >
                {file ? "File ready for upload" : "Drag and drop files here"}
              </Typography>
            </UploadArea>
          </>
        )}
        <input
          type="file"
          ref={fileInputRef}
          hidden
          multiple={multiSelect}
          accept={getAcceptType()}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileSelect(e.target.files[0]);
            }
          }}
        />
      </UploadContainer>

      {error && helperText && (
        <FormHelperText error>{helperText}</FormHelperText>
      )}
    </>
  );
};

export default CustomFileUpload;
