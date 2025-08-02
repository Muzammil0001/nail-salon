import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Slider,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useEffect, useState } from "react";
import AvatarEditor from "react-avatar-editor";
import { toast } from "sonner";
import CustomFormLabel from "../forms/theme-elements/CustomFormLabel";
import ImageUpload from "./ImageUpload";
import Loader from "../loader/Loader";
import { ToastErrorMessage } from "../common/ToastMessages";
import { useSelector } from "@/store/Store";
import { t } from "../../../lib/translationHelper";
import axios from "axios";

const AvatarEditorDialog = ({
  initialLogo,
  image,
  setImage,
  placeholder,
}: {
  initialLogo: string;
  image: string;
  setImage: any;
  placeholder: string;
}) => {
  const [loading, setLoading] = useState(false);
  const [editor, setEditor] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const handleImage = () => {
    try {
      if (!editor) {
        return;
      } else {
        setLoading(true);
        setDidSaved(true);
        setPreviousScale(scale);
        setPreviousAvatarPosition(position);
        const canvas = editor.getImageScaledToCanvas();
        const dataUrl = canvas.toDataURL("image/webp");
        setCroppedLogo(dataUrl);
        setImage(dataUrl);
      }
    } catch (error) {
      ToastErrorMessage(error);
    } finally {
      setLoading(false);
    }
  };
  const setEditorRef = (editor: any) => {
    setEditor(editor);
  };

  const [scale, setScale] = useState(1);
  const [previousScale, setPreviousScale] = useState(1);
  const [didSaved, setDidSaved] = useState(false);
  const [croppedLogo, setCroppedLogo] = useState("");
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await axios.post(
          "/api/app-translation/fetchbypagename",
          { page_name: "avatoreditor" }
        );
        setKeys(response.data);
      } catch (error) {
        console.error("Error while fetching translations:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [languageUpdate]);

  const [position, setPosition] = useState({
    x: 0.5,
    y: 0.5,
  });
  const [previousAvatarPosition, setPreviousAvatarPosition] = useState({
    x: 0.5,
    y: 0.5,
  });
  const handleImageEdit = async () => {
    await handleImage();
    setOpen(false);
  };

  const isMobile = useMediaQuery("(max-width: 768px)");
  const handleCancel = async () => {
    if (croppedLogo && didSaved) {
      setImage(croppedLogo);
      setScale(previousScale);
      setPosition(previousAvatarPosition);
    } else {
      setImage(initialLogo ? initialLogo : "placeholder.svg");
      setScale(1);
      setPosition({
        x: 0.5,
        y: 0.5,
      });
    }
    setOpen(false);
  };

  const handleOpenAgain = () => {
    if (image?.startsWith("data:image")) {
      setOpen(true);
    }
  };
  const handleImageUpload = async (file: string) => {
    setOpen(false);
    setPosition({
      x: 0.5,
      y: 0.5,
    });
    setScale(1);
    setOpen(true);
    setImage(file);
    setLoading(false);
  };

  const resetImage = () => {
    setImage("");
    setDidSaved(false);
  };

  return (
    <>
      <Box>
        <Loader loading={loading} />
        <CustomFormLabel>{t(placeholder, keys)}</CustomFormLabel>

        <Box className={"w-fit"} sx={{cursor:"pointer"}}>
          <ImageUpload
            onUpload={handleImageUpload}
            file={
              image?.startsWith("data:image")
                ? image
                : `${process.env.NEXT_PUBLIC_IMG_DIR}/${image ||
                    "placeholder.svg"}`
            }
            maxSize={5}
          />

          <Stack
            direction="row"
            spacing={1}
            my={1}
            justifyContent="space-between"
            sx={{ width: "100%" }}
          >
            <Button
              variant="contained"
              onClick={resetImage}
              sx={{
                backgroundColor: "#DA514E",
                "&:hover": { backgroundColor: "#B0413C" },
                color: "#fff",
                flex: 1,
                textAlign: "center",
              }}
            >
              {t("reset", keys)}
            </Button>
            <Button
              variant="contained"
              onClick={handleOpenAgain}
              disabled={!image?.startsWith("data:image")}
              color="primary"
              sx={{
                flex: 1,
                textAlign: "center",
                "&:disabled": {
                  backgroundColor: "#BDBDBD",
                  color: "#ffffff",
                },
              }}
            >
              {t("edit", keys)}
            </Button>
          </Stack>
        </Box>
      </Box>

      <Dialog open={open}>
        <DialogTitle>Edit Image</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
            <AvatarEditor
              ref={setEditorRef}
              image={image}
              style={{
                width: isMobile ? "238px" : "430px",
                height: isMobile ? "150px" : "270px",
              }}
              width={1052}
              height={700}
              border={3}
              borderRadius={0}
              color={[150, 150, 150, 0.6]}
              scale={scale}
              disableHiDPIScaling={false}
              disableBoundaryChecks={false}
              position={position}
              onPositionChange={(position) => setPosition(position)}
            />

            <Typography variant="h6" sx={{ marginTop: "10px" }}>
              Scale:{" "}
            </Typography>
            <Slider
              sx={{ width: "100%" }}
              aria-label="Scale"
              value={scale}
              onChange={(e: any) => setScale(e.target.value)}
              min={1}
              max={2}
              step={0.01}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleImageEdit}
            variant="contained"
            color={"primary"}
          >
            Save
          </Button>
          <Button
            onClick={handleCancel}
            variant="contained"
            sx={{ backgroundColor: "#DA514E" }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AvatarEditorDialog;
