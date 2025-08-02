import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Avatar, Typography } from "@mui/material";

import CloudUploadIcon from "@mui/icons-material/CloudUpload";

interface SingleFileUploaderProps {
  file: string | null;
  onUpload: any;
  maxSize: number;
  containerClass?:string;
  imageStyle?: any;
}

const PreviewImageUpload: React.FC<SingleFileUploaderProps> = ({
  file,
  onUpload,
  maxSize,
  containerClass,
  imageStyle
}) => {
  const [error, setError] = useState<string | null>(null);
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null);

      if (acceptedFiles.length === 0) {
        return;
      }

      const selectedFile = acceptedFiles[0];
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          onUpload(reader.result as string);
        }
      };
      reader.readAsDataURL(selectedFile);
    },
    [onUpload]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif"],
    },
    maxSize: maxSize * 1024 * 1024,
    multiple: false,
  });

  return (
    <div
      {...getRootProps({ className: "dropzone" })}
      className={`flex flex-col justify-center items-center border border-[#CCCCCC] hover:border-primary rounded-lg hover:bg-salete gap-3 group w-60 h-40 ${containerClass}`}
    >
      <input {...getInputProps()} />
      {file ? (
         <Avatar
         
         src={file }
         alt={"user1"}
         variant="square"
         sx={{ width: 240, height: 160, ...imageStyle }}
       />
      ) : (
        <>
          <CloudUploadIcon
            sx={{ color: "#CCCCCC", width: "66px", height: "52px" }}
          />
          <Typography variant="h6" component="div" sx={{ color: "#666666" }}>
            Upload a File
          </Typography>
          <Typography
            variant="body2"
            color="textSecondary"
            sx={{ color: "#666666" }}
          >
            Drag and drop files here
          </Typography>
          {error && <Typography color="error">{error}</Typography>}
        </>
      )}
    </div>
  );
};

export default PreviewImageUpload;
