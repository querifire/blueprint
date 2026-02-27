import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  InputAdornment,
  Tooltip,
  CircularProgress,
  Divider,
  useTheme,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import {
  useServicesStore,
  Service,
  getDaysRemaining,
  getExpiryStatus,
} from "../stores/servicesStore";

function getStatusDot(status: string, isDark: boolean) {
  const map: Record<string, { color: string; label: string }> = {
    ok: { color: isDark ? "#10a37f" : "#10a37f", label: "Активен" },
    warning: { color: isDark ? "#f59e0b" : "#b45309", label: "Скоро" },
    critical: { color: isDark ? "#ef4444" : "#dc2626", label: "Срочно" },
    expired: { color: isDark ? "#4a4a5a" : "#c5c5d2", label: "Истёк" },
  };
  return map[status] ?? map.ok;
}

interface ServiceFormData {
  project_name: string;
  service_name: string;
  login: string;
  url: string;
  expires_at: string;
  cost: string;
  currency: string;
  notes: string;
  category: string;
  notify_days: string;
}

const defaultForm: ServiceFormData = {
  project_name: "",
  service_name: "",
  login: "",
  url: "",
  expires_at: format(new Date(), "yyyy-MM-dd"),
  cost: "",
  currency: "USD",
  notes: "",
  category: "",
  notify_days: "7",
};

const FILTER_DEFS = [
  { key: "all", label: "Все" },
  { key: "ok", label: "Активные" },
  { key: "warning", label: "Скоро" },
  { key: "critical", label: "Срочно" },
];

export default function Services() {
  const { services, loading, fetchServices, createService, updateService, deleteService } =
    useServicesStore();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editService, setEditService] = useState<Service | null>(null);
  const [form, setForm] = useState<ServiceFormData>(defaultForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const border = isDark ? "#2f2f2f" : "#e5e5e5";

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const filtered = services.filter((s) => {
    const matchesSearch =
      s.service_name.toLowerCase().includes(search.toLowerCase()) ||
      s.project_name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filterStatus === "all") return true;
    return getExpiryStatus(getDaysRemaining(s.expires_at)) === filterStatus;
  });

  const openCreate = () => { setEditService(null); setForm(defaultForm); setDialogOpen(true); };
  const openEdit = (s: Service) => {
    setEditService(s);
    setForm({
      project_name: s.project_name, service_name: s.service_name, login: s.login || "",
      url: s.url || "", expires_at: s.expires_at, cost: s.cost?.toString() || "",
      currency: s.currency, notes: s.notes || "", category: s.category || "",
      notify_days: s.notify_days.toString(),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const input = {
      project_name: form.project_name, service_name: form.service_name,
      login: form.login || undefined, url: form.url || undefined,
      expires_at: form.expires_at, cost: form.cost ? parseFloat(form.cost) : undefined,
      currency: form.currency, notes: form.notes || undefined,
      category: form.category || undefined, notify_days: parseInt(form.notify_days, 10) || 7,
    };
    if (editService) await updateService({ ...editService, ...input });
    else await createService(input as Parameters<typeof createService>[0]);
    setDialogOpen(false);
  };

  const statusCounts = {
    all: services.length,
    ok: services.filter((s) => getExpiryStatus(getDaysRemaining(s.expires_at)) === "ok").length,
    warning: services.filter((s) => getExpiryStatus(getDaysRemaining(s.expires_at)) === "warning").length,
    critical: services.filter((s) => ["critical", "expired"].includes(getExpiryStatus(getDaysRemaining(s.expires_at)))).length,
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <Box
        sx={{
          px: 3,
          py: 1.25,
          display: "flex",
          alignItems: "center",
          gap: 2,
          borderBottom: `1px solid ${border}`,
        }}
      >
        <Typography
          sx={{ fontSize: "0.875rem", fontWeight: 600, color: isDark ? "#ececec" : "#0d0d0d" }}
        >
          Сервисы
        </Typography>
        <Box sx={{ flex: 1 }} />
        <TextField
          placeholder="Поиск..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ fontSize: 16, color: isDark ? "#4a4a5a" : "#c5c5d2" }} />
              </InputAdornment>
            ),
          }}
          sx={{ width: 200 }}
        />
        <Button
          startIcon={<AddRoundedIcon sx={{ fontSize: 16 }} />}
          variant="outlined"
          size="small"
          onClick={openCreate}
        >
          Добавить
        </Button>
      </Box>

      <Box sx={{ px: 3, py: 1, display: "flex", gap: 0.5, borderBottom: `1px solid ${border}` }}>
        {FILTER_DEFS.map((f) => {
          const active = filterStatus === f.key;
          const count = statusCounts[f.key as keyof typeof statusCounts];
          return (
            <Box
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.75,
                px: 1.25,
                py: 0.4,
                borderRadius: "5px",
                cursor: "pointer",
                transition: "all 0.12s ease",
                backgroundColor: active
                  ? isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"
                  : "transparent",
                "&:hover": {
                  backgroundColor: active
                    ? isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"
                    : isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                },
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.875rem",
                  fontWeight: active ? 500 : 400,
                  color: active
                    ? isDark ? "#ececec" : "#0d0d0d"
                    : isDark ? "#6e6e80" : "#8e8ea0",
                }}
              >
                {f.label}
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.75rem",
                  color: isDark ? "#6e6e80" : "#acacbe",
                  fontWeight: 500,
                }}
              >
                {count}
              </Typography>
            </Box>
          );
        })}
      </Box>

      <Box sx={{ flex: 1, overflow: "auto" }}>
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress size={20} />
          </Box>
        )}

        {!loading && filtered.length === 0 && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              py: 10,
              gap: 1,
            }}
          >
            <Typography sx={{ fontSize: "0.875rem", color: isDark ? "#4a4a5a" : "#c5c5d2" }}>
              Нет сервисов
            </Typography>
          </Box>
        )}

        {filtered.map((s, idx) => {
          const days = getDaysRemaining(s.expires_at);
          const status = getExpiryStatus(days);
          const st = getStatusDot(status, isDark);

          return (
            <Box key={s.id}>
              {idx > 0 && <Divider />}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  px: 3,
                  py: 1.5,
                  gap: 2,
                  "&:hover": {
                    backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                  },
                  "&:hover .service-actions": { opacity: 1 },
                  transition: "background-color 0.12s ease",
                }}
              >
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    backgroundColor: st.color,
                    flexShrink: 0,
                  }}
                />

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: "0.9375rem",
                      fontWeight: 500,
                      color: isDark ? "#ececec" : "#0d0d0d",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s.service_name}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.8125rem",
                      color: isDark ? "#6e6e80" : "#8e8ea0",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s.project_name}
                    {s.category ? ` · ${s.category}` : ""}
                    {s.login ? ` · ${s.login}` : ""}
                  </Typography>
                </Box>

                <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                  <Typography
                    sx={{
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      color: st.color,
                    }}
                  >
                    {days < 0 ? "Истёк" : `${days} дн`}
                  </Typography>
                  <Typography sx={{ fontSize: "0.8125rem", color: isDark ? "#6e6e80" : "#8e8ea0" }}>
                    {format(parseISO(s.expires_at), "d MMM yyyy", { locale: ru })}
                  </Typography>
                </Box>

                {s.cost && (
                  <Typography
                    sx={{
                      fontSize: "0.875rem",
                      color: isDark ? "#8e8ea0" : "#6e6e80",
                      flexShrink: 0,
                      minWidth: 60,
                      textAlign: "right",
                    }}
                  >
                    {s.cost} {s.currency}
                  </Typography>
                )}

                <Box
                  className="service-actions"
                  sx={{
                    display: "flex",
                    gap: 0.25,
                    opacity: 0,
                    transition: "opacity 0.15s",
                    flexShrink: 0,
                  }}
                >
                  {s.url && (
                    <Tooltip title={s.url} arrow>
                      <IconButton
                        size="small"
                        onClick={() => window.open(s.url, "_blank")}
                        sx={{ width: 30, height: 30 }}
                      >
                        <OpenInNewRoundedIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                  <IconButton size="small" onClick={() => openEdit(s)} sx={{ width: 30, height: 30 }}>
                    <EditOutlinedIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                  <IconButton size="small" onClick={() => setDeleteConfirm(s.id)} sx={{ width: 30, height: 30 }}>
                    <DeleteOutlineRoundedIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editService ? "Редактировать сервис" : "Новый сервис"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}>
          <TextField label="Проект" value={form.project_name} onChange={(e) => setForm({ ...form, project_name: e.target.value })} required autoFocus />
          <TextField label="Название сервиса" value={form.service_name} onChange={(e) => setForm({ ...form, service_name: e.target.value })} required />
          <TextField label="Логин / аккаунт" value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} />
          <TextField label="URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
          <TextField label="Дата истечения" type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} InputLabelProps={{ shrink: true }} required />
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField label="Стоимость" type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} sx={{ flex: 1 }} />
            <TextField label="Валюта" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} sx={{ width: 90 }} />
          </Box>
          <TextField label="Категория" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <TextField label="Уведомить за (дней)" type="number" value={form.notify_days} onChange={(e) => setForm({ ...form, notify_days: e.target.value })} />
          <TextField label="Заметки" multiline rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={() => setDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleSave} variant="contained" disabled={!form.project_name || !form.service_name || !form.expires_at}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Удалить сервис?</DialogTitle>
        <DialogActions>
          <Button variant="text" onClick={() => setDeleteConfirm(null)}>Отмена</Button>
          <Button
            variant="contained"
            sx={{
              backgroundColor: isDark ? "#ef4444" : "#dc2626",
              color: "#ffffff",
              "&:hover": { backgroundColor: isDark ? "#dc2626" : "#b91c1c" },
            }}
            onClick={async () => {
              if (deleteConfirm) { await deleteService(deleteConfirm); setDeleteConfirm(null); }
            }}
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
