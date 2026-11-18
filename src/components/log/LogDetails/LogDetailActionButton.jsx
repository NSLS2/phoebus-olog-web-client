import { IconButton, Stack, Tooltip } from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import ReplyIcon from "@mui/icons-material/Reply";
import { ContextMenu } from "./ContextMenu";
import { useUser } from "features/authSlice";

const LogDetailActionButton = ({ log }) => {
  const user = useUser();
  // keep the search in the URL, so sending the reply returns to it
  const { search } = useLocation();

  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={1}
      onClick={(e) => e.stopPropagation()}
    >
      {user && (
        <IconButton
          component={Link}
          to={`/logs/${log.id}/reply${search}`}
          size="small"
          color="primary"
        >
          <Tooltip title="Reply">
            <ReplyIcon sx={{ p: "2.5px" }} />
          </Tooltip>
        </IconButton>
      )}
      {user && <ContextMenu log={log} />}
    </Stack>
  );
};

export default LogDetailActionButton;
