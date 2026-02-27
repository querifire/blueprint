import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  Tooltip,
  useTheme,
} from "@mui/material";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import DnsOutlinedIcon from "@mui/icons-material/DnsOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import { invoke } from "@tauri-apps/api/core";
import TitleBar from "./TitleBar";

const SIDEBAR_WIDTH = 56;

const navItems = [
  { path: "/", label: "Чат", icon: <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 20 }} /> },
  { path: "/clients", label: "Клиенты", icon: <PeopleOutlinedIcon sx={{ fontSize: 20 }} /> },
  { path: "/services", label: "Сервисы", icon: <DnsOutlinedIcon sx={{ fontSize: 20 }} /> },
  { path: "/notes", label: "Заметки", icon: <AssignmentOutlinedIcon sx={{ fontSize: 20 }} /> },
];

const bottomItems = [
  { path: null, label: "Оверлей", icon: <LayersOutlinedIcon sx={{ fontSize: 20 }} />, action: "overlay" },
  { path: null, label: "Поиск (Ctrl+K)", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  ), action: "palette" },
  { path: "/settings", label: "Настройки", icon: <SettingsOutlinedIcon sx={{ fontSize: 20 }} /> },
];

export default function Layout({ onOpenPalette }: { onOpenPalette?: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const sidebarBg = isDark ? "#171717" : "#f7f7f8";
  const borderColor = isDark ? "#272727" : "#ebebeb";

  const NavBtn = ({
    path,
    label,
    icon,
    action,
  }: {
    path: string | null;
    label: string;
    icon: React.ReactNode;
    action?: string;
  }) => {
    const selected = path ? location.pathname === path : false;

    const handleClick = () => {
      if (action === "overlay") {
        invoke("toggle_overlay_window");
      } else if (action === "palette") {
        onOpenPalette?.();
      } else if (path) {
        navigate(path);
      }
    };

    return (
      <Tooltip title={label} placement="right" arrow>
        <ListItemButton
          selected={selected}
          onClick={handleClick}
          sx={{
            width: 40,
            height: 40,
            minHeight: "unset",
            justifyContent: "center",
            alignItems: "center",
            borderRadius: "9px",
            mx: "auto",
            mb: 0.5,
            p: 0,
            color: selected
              ? isDark ? "#ececec" : "#0d0d0d"
              : isDark ? "#5e5e72" : "#a0a0b0",
            backgroundColor: selected
              ? isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"
              : "transparent",
            transition: "background-color 0.15s ease, color 0.15s ease, transform 0.15s ease",
            "&:hover": {
              backgroundColor: selected
                ? isDark ? "rgba(255,255,255,0.13)" : "rgba(0,0,0,0.1)"
                : isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
              color: isDark ? "#ececec" : "#0d0d0d",
              transform: "scale(1.08)",
            },
          }}
        >
          {icon}
        </ListItemButton>
      </Tooltip>
    );
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <TitleBar />

      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Drawer
          variant="permanent"
          sx={{
            width: SIDEBAR_WIDTH,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: SIDEBAR_WIDTH,
              boxSizing: "border-box",
              overflowX: "hidden",
              border: "none",
              borderRight: `1px solid ${borderColor}`,
              backgroundColor: sidebarBg,
              display: "flex",
              flexDirection: "column",
              top: "auto",
              height: "100%",
              position: "relative",
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 48,
              flexShrink: 0,
            }}
          >
            <Box
              sx={{
                width: 26,
                height: 26,
                borderRadius: "7px",
                backgroundColor: "#0ea5e9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Box
                component="span"
                sx={{
                  fontSize: "0.6875rem",
                  fontWeight: 800,
                  color: "#ffffff",
                  lineHeight: 1,
                  fontFamily: "'Manrope', sans-serif",
                  letterSpacing: "-0.02em",
                }}
              >
                B
              </Box>
            </Box>
          </Box>

          <Box sx={{ flex: 1, pt: 0.5 }}>
            <List disablePadding sx={{ px: 1 }}>
              {navItems.map((item) => (
                <NavBtn key={item.path} {...item} />
              ))}
            </List>
          </Box>

          <Box
            sx={{
              pb: 2,
              borderTop: `1px solid ${borderColor}`,
              pt: 1,
            }}
          >
            <List disablePadding sx={{ px: 1 }}>
              {bottomItems.map((item, idx) => (
                <NavBtn key={idx} {...item} />
              ))}
            </List>
          </Box>
        </Drawer>

        <Box
          component="main"
          key={location.pathname}
          sx={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "background.default",
            animation: "pageFadeIn 0.15s ease",
            "@keyframes pageFadeIn": {
              from: { opacity: 0 },
              to: { opacity: 1 },
            },
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
