import React, { useCallback, useState, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Typography, Button } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";

interface MultipleFileUploaderProps {
  files: string[] | null;
  setFiles: (files: string[]) => void;
  containerClass?: string | null;
  imageClass?: string | null;
}

const PreviewImageUpload: React.FC<MultipleFileUploaderProps> = ({
  files,
  setFiles,
  containerClass,
  imageClass,
}) => {
  const [error, setError] = useState<string | null>(null);
  const maxSize = 5 * 1024 * 1024; // 5MB
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null);

      if (acceptedFiles.length === 0) {
        return;
      }

      const newFiles: string[] = [];
      acceptedFiles.forEach((file) => {
        if (file.size > maxSize) {
          setError("File is too large");
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result) {
            newFiles.push(reader.result as string);
            if (newFiles.length === acceptedFiles.length) {
              setFiles(newFiles);
            }
          }
        };

        reader.readAsDataURL(file);
      });
    },
    [setFiles]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    maxSize,
    multiple: true,
  });

  const handleUpdatePdf = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      onDrop(Array.from(selectedFiles));
    }
  };


  return (
    <div>
        <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
        multiple={true}
      />
      <input {...getInputProps()} />
      {files?.length ? (
        files.map((file, index) => {
          const isPdf = file.endsWith(".pdf");
          const fileUrl = `${process.env.NEXT_PUBLIC_IMG_DIR}${file}`;

          return isPdf ? (
            <div key={index} className="flex gap-2">
              <Button
                variant="contained"
                color="primary"
                startIcon={<PictureAsPdfIcon />}
                onClick={() => window.open(fileUrl, "_blank")}
              >
                Open PDF
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleUpdatePdf}
              >
                Update PDF
              </Button>
            </div>
          ) : (
            <img
              key={index}
              src={file}
              alt={`Preview ${index}`}
              className={`w-60 h-36 rounded-lg m-4 ${imageClass}`}
            />
          );
        })
      ) : (
        <div
          {...getRootProps({ className: "dropzone" })}
          className={`flex flex-col justify-center items-center border border-[#CCCCCC] hover:border-primary rounded-lg hover:bg-salete gap-3 group w-60 min-h-36 ${containerClass}`}
        >
          <CloudUploadIcon
            sx={{ color: "#CCCCCC", width: "66px", height: "52px" }}
          />
          <Typography variant="h6" component="div" sx={{ color: "#666666" }}>
            Upload Files
          </Typography>
          <Typography
            variant="body2"
            color="textSecondary"
            sx={{ color: "#666666" }}
          >
            Drag and drop files here
          </Typography>
          {error && <Typography color="error">{error}</Typography>}
        </div>
      )}
    </div>
  );
};

export default PreviewImageUpload;
