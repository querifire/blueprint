import { useState, useEffect, useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Box, IconButton, useTheme, Tooltip } from "@mui/material";
import RemoveIcon from "@mui/icons-material/Remove";
import CropSquareRoundedIcon from "@mui/icons-material/CropSquareRounded";
import FilterNoneRoundedIcon from "@mui/icons-material/FilterNoneRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";
import PushPinIcon from "@mui/icons-material/PushPin";

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const appWindowRef = useRef(getCurrentWindow());

  useEffect(() => {
    const win = appWindowRef.current;
    win.isMaximized().then(setIsMaximized).catch(() => {});
    let unlisten: (() => void) | undefined;
    win.onResized(async () => {
      win.isMaximized().then(setIsMaximized).catch(() => {});
    }).then((fn) => {
      unlisten = fn;
    }).catch(() => {});
    return () => unlisten?.();
  }, []);

  const handleDragMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      appWindowRef.current.startDragging().catch(() => {});
    }
  };

  const handleDragDoubleClick = () => {
    appWindowRef.current.toggleMaximize().catch(() => {});
  };

  const handleMinimize = () => {
    appWindowRef.current.minimize().catch(() => {});
  };

  const handleMaximize = () => {
    appWindowRef.current.toggleMaximize().catch(() => {});
  };

  const handleClose = () => {
    appWindowRef.current.close().catch(() => {});
  };

  const handleAlwaysOnTop = () => {
    const next = !isAlwaysOnTop;
    appWindowRef.current.setAlwaysOnTop(next).then(() => {
      setIsAlwaysOnTop(next);
    }).catch(() => {});
  };

  const bg = isDark ? "#171717" : "#f7f7f8";
  const borderColor = isDark ? "#272727" : "#ebebeb";
  const btnColor = isDark ? "#4a4a5e" : "#b0b0c0";
  const btnHoverBg = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
  const btnHoverColor = isDark ? "#ececec" : "#0d0d0d";

  const iconBtnSx = {
    width: 32,
    height: 28,
    borderRadius: "6px",
    color: btnColor,
    transition: "background-color 0.15s ease, color 0.15s ease",
    "&:hover": {
      backgroundColor: btnHoverBg,
      color: btnHoverColor,
    },
  };

  return (
    <Box
      sx={{
        height: 40,
        display: "flex",
        alignItems: "center",
        backgroundColor: bg,
        borderBottom: `1px solid ${borderColor}`,
        flexShrink: 0,
        position: "relative",
        zIndex: 1300,
        WebkitAppRegion: "no-drag",
      }}
    >
      <Box
        onMouseDown={handleDragMouseDown}
        onDoubleClick={handleDragDoubleClick}
        sx={{
          flex: 1,
          height: "100%",
          display: "flex",
          alignItems: "center",
          pl: "68px",
          cursor: "default",
          userSelect: "none",
          WebkitAppRegion: "drag",
        }}
      >
        <Box
          component="span"
          sx={{
            fontWeight: 600,
            color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.18)",
            fontSize: "0.8125rem",
            fontFamily: "'Manrope', sans-serif",
            letterSpacing: "0.02em",
            pointerEvents: "none",
          }}
        >
          Blueprint
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.25,
          px: 1,
          flexShrink: 0,
          position: "relative",
          zIndex: 1,
        }}
      >
        <Tooltip title={isAlwaysOnTop ? "Открепить окно" : "Поверх окон"} placement="bottom" enterDelay={600}>
          <IconButton
            size="small"
            disableRipple
            onClick={handleAlwaysOnTop}
            sx={{
              ...iconBtnSx,
              color: isAlwaysOnTop ? "#0ea5e9" : btnColor,
              "&:hover": {
                backgroundColor: btnHoverBg,
                color: isAlwaysOnTop ? "#38bdf8" : btnHoverColor,
              },
            }}
          >
            {isAlwaysOnTop ? (
              <PushPinIcon sx={{ fontSize: 13 }} />
            ) : (
              <PushPinOutlinedIcon sx={{ fontSize: 13 }} />
            )}
          </IconButton>
        </Tooltip>

        <IconButton
          size="small"
          disableRipple
          onClick={handleMinimize}
          sx={iconBtnSx}
        >
          <RemoveIcon sx={{ fontSize: 14 }} />
        </IconButton>

        <IconButton
          size="small"
          disableRipple
          onClick={handleMaximize}
          sx={iconBtnSx}
        >
          {isMaximized ? (
            <FilterNoneRoundedIcon sx={{ fontSize: 11 }} />
          ) : (
            <CropSquareRoundedIcon sx={{ fontSize: 14 }} />
          )}
        </IconButton>

        <IconButton
          size="small"
          disableRipple
          onClick={handleClose}
          sx={{
            ...iconBtnSx,
            "&:hover": {
              backgroundColor: "rgba(239,68,68,0.85)",
              color: "#ffffff",
            },
          }}
        >
          <CloseRoundedIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Box>
    </Box>
  );
}
