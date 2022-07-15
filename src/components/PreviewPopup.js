import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  width: "80%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
  overflowY: "scroll",
  height: "90%",
  display: "block",
};

export function Face({ img, remove, approve }) {
  return (
    <Box
      marginTop={1}
      padding={1}
      boxShadow={2}
      bgcolor="white"
      width={"fit-content"}
      display="flex"
      flexDirection="column"
    >
      <img width={400} height={400} src={img} alt="preview" />
      <Box paddingTop={1} display="flex" justifyContent="space-between">
        <Button
          variant="contained"
          onClick={remove}
          style={{ marginRight: 20 }}
        >
          Remove
        </Button>
        {approve !== null ? (
          <Button variant="contained" onClick={approve}>
            approve
          </Button>
        ) : (
          <></>
        )}
      </Box>
    </Box>
  );
}

export default function PreviewPopup({
  textures,
  removeTexture,
  approveTexture,
}) {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <Box>
      <Button
        style={{ marginInline: 10 }}
        variant="contained"
        onClick={handleOpen}
      >
        Preview
      </Button>
      <Modal open={open} onClose={handleClose}>
        <Box sx={style}>
          <Typography align="center" variant="h6" component="h2">
            <b>Preview</b>
          </Typography>
          <Box
            display="flex"
            justifyContent={"space-around"}
            flexDirection={"row"}
            flexWrap={"wrap"}
          >
            {textures.map((texture, index) => (
              <Face
                key={index}
                img={texture}
                remove={() => {
                  removeTexture(index);
                }}
                approve={approveTexture}
              />
            ))}
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}
