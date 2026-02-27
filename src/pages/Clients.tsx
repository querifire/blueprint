import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  List,
  ListItemButton,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  InputAdornment,
  CircularProgress,
  Divider,
  useTheme,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { format, subMonths } from "date-fns";
import { ru } from "date-fns/locale";
import { useClientsStore, Client } from "../stores/clientsStore";

const MONTHS = Array.from({ length: 12 }, (_, i) =>
  format(subMonths(new Date(), i), "yyyy-MM")
);

function getMonthLabel(period: string) {
  const [y, m] = period.split("-");
  return format(new Date(parseInt(y), parseInt(m) - 1), "MMM ''yy", { locale: ru });
}

interface ClientFormData {
  name: string;
  contact: string;
  payment_type: "monthly" | "onetime";
  amount: string;
  currency: string;
  notes: string;
  payment_date: string;
  payment_day: string;
}

const defaultForm: ClientFormData = {
  name: "",
  contact: "",
  payment_type: "monthly",
  amount: "",
  currency: "USD",
  notes: "",
  payment_date: format(new Date(), "yyyy-MM-dd"),
  payment_day: "",
};

export default function Clients() {
  const { clients, payments, loading, fetchClients, fetchPayments, createClient, updateClient, deleteClient, togglePayment } =
    useClientsStore();
  const [selected, setSelected] = useState<Client | null>(null);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [form, setForm] = useState<ClientFormData>(defaultForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const border = isDark ? "#2f2f2f" : "#e5e5e5";

  useEffect(() => { fetchClients(); }, [fetchClients]);
  useEffect(() => { if (selected) fetchPayments(selected.id); }, [selected, fetchPayments]);

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditClient(null); setForm(defaultForm); setDialogOpen(true); };
  const openEdit = (c: Client) => {
    setEditClient(c);
    setForm({ name: c.name, contact: c.contact || "", payment_type: c.payment_type as "monthly" | "onetime", amount: c.amount?.toString() || "", currency: c.currency, notes: c.notes || "", payment_date: format(new Date(), "yyyy-MM-dd"), payment_day: c.payment_day?.toString() || "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const input = { name: form.name, contact: form.contact || undefined, payment_type: form.payment_type, amount: form.amount ? parseFloat(form.amount) : undefined, currency: form.currency, notes: form.notes || undefined, payment_date: form.payment_type === "onetime" ? form.payment_date : undefined, payment_day: form.payment_type === "monthly" && form.payment_day ? parseInt(form.payment_day, 10) : undefined };
    if (editClient) await updateClient({ ...editClient, ...input });
    else await createClient(input as Parameters<typeof createClient>[0]);
    setDialogOpen(false);
  };

  const clientPayments = selected ? (payments[selected.id] || []) : [];

  const monthlyClients = clients.filter((c) => c.payment_type === "monthly");
  const monthlyIncome = monthlyClients.reduce((sum, c) => sum + (c.amount || 0), 0);
  const currentMonth = format(new Date(), "yyyy-MM");
  const paidThisMonth = monthlyClients.filter((c) => {
    const cp = payments[c.id];
    return cp?.some((p) => p.period === currentMonth && p.paid);
  }).length;
  const paidPercent = monthlyClients.length > 0
    ? Math.round((paidThisMonth / monthlyClients.length) * 100)
    : 0;

  return (
    <Box sx={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <Box
        sx={{
          width: 260,
          flexShrink: 0,
          borderRight: `1px solid ${border}`,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Box sx={{ px: 2, pt: 2, pb: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
            <Typography
              sx={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: isDark ? "#ececec" : "#0d0d0d",
              }}
            >
              Клиенты
            </Typography>
            <Button
              startIcon={<AddRoundedIcon sx={{ fontSize: 16 }} />}
              variant="outlined"
              size="small"
              onClick={openCreate}
              sx={{ fontSize: "0.8125rem", px: 1.5 }}
            >
              Добавить
            </Button>
          </Box>

          {clients.length > 0 && (
            <Box
              sx={{
                display: "flex",
                gap: 0.75,
                mb: 1.5,
                p: 1.25,
                borderRadius: "8px",
                backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.025)",
                border: `1px solid ${border}`,
              }}
            >
              <Box sx={{ flex: 1, textAlign: "center" }}>
                <Typography sx={{ fontSize: "0.9375rem", fontWeight: 700, color: isDark ? "#ececec" : "#0d0d0d", lineHeight: 1.2 }}>
                  {clients.length}
                </Typography>
                <Typography sx={{ fontSize: "0.6875rem", color: isDark ? "#6e6e80" : "#8e8ea0", mt: 0.25 }}>всего</Typography>
              </Box>
              <Box sx={{ width: "1px", backgroundColor: border }} />
              <Box sx={{ flex: 1, textAlign: "center" }}>
                <Typography sx={{ fontSize: "0.9375rem", fontWeight: 700, color: isDark ? "#ececec" : "#0d0d0d", lineHeight: 1.2 }}>
                  {monthlyIncome > 0 ? `${monthlyIncome.toLocaleString()}` : "—"}
                </Typography>
                <Typography sx={{ fontSize: "0.6875rem", color: isDark ? "#6e6e80" : "#8e8ea0", mt: 0.25 }}>в мес</Typography>
              </Box>
              <Box sx={{ width: "1px", backgroundColor: border }} />
              <Box sx={{ flex: 1, textAlign: "center" }}>
                <Typography sx={{ fontSize: "0.9375rem", fontWeight: 700, color: paidPercent === 100 ? "#10a37f" : isDark ? "#ececec" : "#0d0d0d", lineHeight: 1.2 }}>
                  {monthlyClients.length > 0 ? `${paidPercent}%` : "—"}
                </Typography>
                <Typography sx={{ fontSize: "0.6875rem", color: isDark ? "#6e6e80" : "#8e8ea0", mt: 0.25 }}>оплачено</Typography>
              </Box>
            </Box>
          )}

          <TextField
            fullWidth
            size="small"
            placeholder="Поиск..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ fontSize: 16, color: isDark ? "#4a4a5a" : "#c5c5d2" }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <List sx={{ flex: 1, overflow: "auto", px: 0.75, pb: 1 }} disablePadding>
          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={18} />
            </Box>
          )}
          {!loading && filtered.length === 0 && (
            <Typography
              sx={{
                display: "block",
                textAlign: "center",
                py: 4,
                fontSize: "0.8125rem",
                color: isDark ? "#4a4a5a" : "#c5c5d2",
              }}
            >
              Нет клиентов
            </Typography>
          )}
          {filtered.map((c) => (
            <ListItemButton
              key={c.id}
              selected={selected?.id === c.id}
              onClick={() => setSelected(c)}
              sx={{ mb: 0.25, borderRadius: "6px", pr: 1 }}
            >
              <ListItemText
                primary={c.name}
                secondary={`${c.payment_type === "monthly" ? "Ежемесячно" : "Разовый"}${c.amount ? ` · ${c.amount} ${c.currency}` : ""}${c.payment_type === "monthly" && c.payment_day ? ` · ${c.payment_day}-е` : ""}`}
                primaryTypographyProps={{
                  fontWeight: selected?.id === c.id ? 500 : 400,
                  fontSize: "0.875rem",
                  color: isDark ? "#ececec" : "#0d0d0d",
                }}
                secondaryTypographyProps={{
                  fontSize: "0.8125rem",
                  color: isDark ? "#6e6e80" : "#8e8ea0",
                }}
              />
              <Box sx={{ display: "flex", gap: 0.25, opacity: 0, ".MuiListItemButton-root:hover &": { opacity: 1 }, transition: "opacity 0.15s" }}>
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); openEdit(c); }}
                  sx={{ width: 28, height: 28 }}
                >
                  <EditOutlinedIcon sx={{ fontSize: 15 }} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); setDeleteConfirm(c.id); }}
                  sx={{ width: 28, height: 28 }}
                >
                  <DeleteOutlineRoundedIcon sx={{ fontSize: 15 }} />
                </IconButton>
              </Box>
            </ListItemButton>
          ))}
        </List>
      </Box>

      <Box sx={{ flex: 1, overflow: "auto", p: 3 }}>
        {!selected && (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
            }}
          >
            <Typography sx={{ fontSize: "0.875rem", color: isDark ? "#4a4a5a" : "#c5c5d2" }}>
              Выбери клиента
            </Typography>
          </Box>
        )}

        {selected && (
          <>
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5, mb: 0.5 }}>
                <Typography
                  sx={{
                    fontSize: "1.125rem",
                    fontWeight: 600,
                    color: isDark ? "#ececec" : "#0d0d0d",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {selected.name}
                </Typography>
                <Typography sx={{ fontSize: "0.875rem", color: isDark ? "#6e6e80" : "#8e8ea0" }}>
                  {selected.payment_type === "monthly" ? "Ежемесячно" : "Разовый"}
                  {selected.amount ? ` · ${selected.amount} ${selected.currency}` : ""}
                  {selected.payment_type === "monthly" && selected.payment_day ? ` · ${selected.payment_day}-е число` : ""}
                </Typography>
              </Box>
              {selected.contact && (
                <Typography sx={{ fontSize: "0.875rem", color: isDark ? "#6e6e80" : "#8e8ea0" }}>
                  {selected.contact}
                </Typography>
              )}
              {selected.notes && (
                <Typography sx={{ fontSize: "0.875rem", color: isDark ? "#6e6e80" : "#8e8ea0", mt: 0.25 }}>
                  {selected.notes}
                </Typography>
              )}
            </Box>

            <Divider sx={{ mb: 2.5 }} />

            {selected.payment_type === "monthly" && (
              <>
                <Typography
                  sx={{
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: isDark ? "#6e6e80" : "#acacbe",
                    mb: 1.5,
                    fontSize: "0.75rem",
                  }}
                >
                  Платежи — последние 12 месяцев
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {MONTHS.map((month) => {
                    const payment = clientPayments.find((p) => p.period === month);
                    const paid = payment?.paid || false;
                    return (
                      <Box
                        key={month}
                        onClick={() => togglePayment(selected.id, month, !paid)}
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 0.5,
                          px: 1.5,
                          py: 1,
                          cursor: "pointer",
                          border: `1px solid ${paid
                            ? isDark ? "rgba(16,163,127,0.35)" : "rgba(16,163,127,0.3)"
                            : border}`,
                          borderRadius: "6px",
                          backgroundColor: paid
                            ? isDark ? "rgba(16,163,127,0.07)" : "rgba(16,163,127,0.04)"
                            : "transparent",
                          minWidth: 64,
                          transition: "all 0.15s ease",
                          "&:hover": {
                            borderColor: isDark ? "#555" : "#b0b0b0",
                          },
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            color: paid
                              ? "#10a37f"
                              : isDark ? "#6e6e80" : "#acacbe",
                          }}
                        >
                          {getMonthLabel(month)}
                        </Typography>
                        <Checkbox
                          checked={paid}
                          size="small"
                          disableRipple
                          sx={{
                            p: 0,
                            width: 14,
                            height: 14,
                            "& .MuiSvgIcon-root": { fontSize: 14 },
                          }}
                          onChange={() => {}}
                        />
                      </Box>
                    );
                  })}
                </Box>
              </>
            )}

            {selected.payment_type === "onetime" && (
              <>
                <Typography
                  sx={{
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: isDark ? "#6e6e80" : "#acacbe",
                    mb: 1.5,
                    fontSize: "0.75rem",
                  }}
                >
                  Статус оплаты
                </Typography>
                {clientPayments.length === 0 && (
                  <Typography sx={{ fontSize: "0.875rem", color: isDark ? "#4a4a5a" : "#c5c5d2" }}>
                    Нет записей об оплате
                  </Typography>
                )}
                {clientPayments.map((p) => (
                  <Box
                    key={p.id}
                    onClick={() => togglePayment(selected.id, p.period, !p.paid)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      px: 2,
                      py: 1,
                      cursor: "pointer",
                      border: `1px solid ${p.paid
                        ? isDark ? "rgba(16,163,127,0.3)" : "rgba(16,163,127,0.25)"
                        : border}`,
                      borderRadius: "6px",
                      backgroundColor: p.paid
                        ? isDark ? "rgba(16,163,127,0.05)" : "rgba(16,163,127,0.03)"
                        : "transparent",
                      mb: 0.75,
                      maxWidth: 320,
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Checkbox
                      checked={p.paid}
                      disableRipple
                      sx={{ p: 0, "& .MuiSvgIcon-root": { fontSize: 16 } }}
                      onChange={() => {}}
                    />
                    <Typography sx={{ fontSize: "0.875rem", color: isDark ? "#ececec" : "#0d0d0d", flex: 1 }}>
                      {p.period}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "0.75rem",
                        color: p.paid
                          ? "#10a37f"
                          : isDark ? "#f59e0b" : "#b45309",
                      }}
                    >
                      {p.paid ? "Оплачено" : "Ожидает"}
                    </Typography>
                  </Box>
                ))}
              </>
            )}
          </>
        )}
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editClient ? "Редактировать клиента" : "Новый клиент"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}>
          <TextField label="Имя" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus />
          <TextField label="Контакт" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
          <FormControl size="small">
            <InputLabel>Тип платежа</InputLabel>
            <Select value={form.payment_type} label="Тип платежа" onChange={(e) => setForm({ ...form, payment_type: e.target.value as "monthly" | "onetime" })}>
              <MenuItem value="monthly">Ежемесячный</MenuItem>
              <MenuItem value="onetime">Разовый</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField label="Сумма" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} sx={{ flex: 1 }} />
            <TextField label="Валюта" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} sx={{ width: 90 }} />
          </Box>
          {form.payment_type === "onetime" && (
            <TextField label="Дата платежа" type="date" value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} InputLabelProps={{ shrink: true }} />
          )}
          {form.payment_type === "monthly" && (
            <TextField
              label="День оплаты (1–28)"
              type="number"
              value={form.payment_day}
              onChange={(e) => {
                const v = e.target.value;
                const n = parseInt(v, 10);
                if (v === "" || (n >= 1 && n <= 28)) setForm({ ...form, payment_day: v });
              }}
              inputProps={{ min: 1, max: 28 }}
              helperText="Число месяца, когда ожидается оплата"
            />
          )}
          <TextField label="Заметки" multiline rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={() => setDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleSave} variant="contained" disabled={!form.name}>Сохранить</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Удалить клиента?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: "0.875rem", color: isDark ? "#8e8ea0" : "#6e6e80" }}>
            Все данные об оплатах будут удалены.
          </Typography>
        </DialogContent>
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
              if (deleteConfirm) {
                await deleteClient(deleteConfirm);
                if (selected?.id === deleteConfirm) setSelected(null);
                setDeleteConfirm(null);
              }
            }}
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
