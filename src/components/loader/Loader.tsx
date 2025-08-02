import CircularProgress from "@mui/material/CircularProgress";
import { Dialog, Box } from "@mui/material";

function Loader({ loading }: { loading: boolean }) {
  return (
    <Dialog open={loading}>
      <Box p={2}>
        <CircularProgress />
      </Box>
    </Dialog>
  );
}

export default Loader;
