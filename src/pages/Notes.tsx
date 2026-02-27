import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Tooltip,
  MenuItem,
  useTheme,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import { useNotesStore } from "../stores/notesStore";

const PRESET_COLORS = [
  "#0ea5e9", "#f472b6", "#fb923c", "#facc15",
  "#4ade80", "#22d3ee", "#a78bfa", "#94a3b8",
  "#ef4444", "#f87171", "#10b981", "#6366f1",
  "#84cc16", "#f97316", "#1e3a8a", "#06b6d4",
  "#eab308", "#d946ef", "#ec4899", "#6b7280",
];

export default function Notes() {
  const {
    notes, categories, selectedCategoryId, loading,
    fetchNotes, fetchCategories, createNote, updateNote,
    deleteNote, toggleNote, createCategory, updateCategory, deleteCategory, setSelectedCategory,
  } = useNotesStore();

  const [noteDialog, setNoteDialog] = useState(false);
  const [catDialog, setCatDialog] = useState(false);
  const [editNote, setEditNote] = useState<{ id: string; title: string; content?: string; category_id?: string } | null>(null);
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [noteForm, setNoteForm] = useState({ title: "", content: "", category_id: "" });
  const [catForm, setCatForm] = useState({ name: "", color: "#0ea5e9" });
  const [deleteNoteConfirm, setDeleteNoteConfirm] = useState<string | null>(null);
  const [deleteCatConfirm, setDeleteCatConfirm] = useState<string | null>(null);
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const border = isDark ? "#2f2f2f" : "#e5e5e5";

  useEffect(() => { fetchCategories(); fetchNotes(); }, [fetchCategories, fetchNotes]);

  const openCreateNote = () => {
    setEditNote(null);
    setNoteForm({ title: "", content: "", category_id: selectedCategoryId || "" });
    setNoteDialog(true);
  };
  const openEditNote = (note: typeof notes[0]) => {
    setEditNote(note);
    setNoteForm({ title: note.title, content: note.content || "", category_id: note.category_id || "" });
    setNoteDialog(true);
  };
  const handleSaveNote = async () => {
    const input = { title: noteForm.title, content: noteForm.content || undefined, category_id: noteForm.category_id || undefined };
    if (editNote) await updateNote({ ...input, id: editNote.id });
    else await createNote(input);
    setNoteDialog(false);
  };
  const handleSaveCategory = async () => {
    if (editCategoryId) {
      await updateCategory({ id: editCategoryId, name: catForm.name, color: catForm.color });
    } else {
      await createCategory({ name: catForm.name, color: catForm.color });
    }
    setCatForm({ name: "", color: "#0ea5e9" });
    setEditCategoryId(null);
    setCatDialog(false);
  };

  const incomplete = notes.filter((n) => !n.completed);
  const completed = notes.filter((n) => n.completed);

  return (
    <Box sx={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <Box
        sx={{
          width: 192,
          flexShrink: 0,
          borderRight: `1px solid ${border}`,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            px: 2,
            pt: 2,
            pb: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography
            sx={{
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: isDark ? "#6e6e80" : "#acacbe",
            }}
          >
            Категории
          </Typography>
          <Tooltip title="Добавить категорию" arrow>
            <IconButton
              size="small"
              onClick={() => {
                setEditCategoryId(null);
                setCatForm({ name: "", color: "#0ea5e9" });
                setCatDialog(true);
              }}
              sx={{ width: 24, height: 24 }}
            >
              <AddRoundedIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
        </Box>

        <List sx={{ flex: 1, overflow: "auto", px: 0.75, pb: 1 }} disablePadding>
          <ListItemButton
            selected={selectedCategoryId === null}
            onClick={() => setSelectedCategory(null)}
            sx={{ mb: 0.25, borderRadius: "6px" }}
          >
            <ListItemIcon sx={{ minWidth: 26 }}>
              <AssignmentOutlinedIcon
                sx={{
                  fontSize: 16,
                  color: selectedCategoryId === null
                    ? isDark ? "#ececec" : "#0d0d0d"
                    : isDark ? "#6e6e80" : "#8e8ea0",
                }}
              />
            </ListItemIcon>
            <ListItemText
              primary="Все"
              primaryTypographyProps={{
                fontSize: "0.875rem",
                color: selectedCategoryId === null
                  ? isDark ? "#ececec" : "#0d0d0d"
                  : isDark ? "#8e8ea0" : "#6e6e80",
                fontWeight: selectedCategoryId === null ? 500 : 400,
              }}
            />
          </ListItemButton>

          {categories.map((cat) => (
            <ListItemButton
              key={cat.id}
              selected={selectedCategoryId === cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              sx={{ mb: 0.25, pr: 7, borderRadius: "6px" }}
            >
              <ListItemIcon sx={{ minWidth: 26 }}>
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    backgroundColor: cat.color,
                    mt: 0.25,
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary={cat.name}
                primaryTypographyProps={{
                  fontSize: "0.875rem",
                  color: selectedCategoryId === cat.id
                    ? isDark ? "#ececec" : "#0d0d0d"
                    : isDark ? "#8e8ea0" : "#6e6e80",
                  fontWeight: selectedCategoryId === cat.id ? 500 : 400,
                }}
              />
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditCategoryId(cat.id);
                  setCatForm({ name: cat.name, color: cat.color });
                  setCatDialog(true);
                }}
                sx={{
                  opacity: 0,
                  ".MuiListItemButton-root:hover &": { opacity: 1 },
                  position: "absolute",
                  right: 28,
                  width: 22,
                  height: 22,
                  transition: "opacity 0.15s",
                }}
              >
                <EditOutlinedIcon sx={{ fontSize: 14 }} />
              </IconButton>
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); setDeleteCatConfirm(cat.id); }}
                sx={{
                  opacity: 0,
                  ".MuiListItemButton-root:hover &": { opacity: 1 },
                  position: "absolute",
                  right: 4,
                  width: 22,
                  height: 22,
                  transition: "opacity 0.15s",
                }}
              >
                <DeleteOutlineRoundedIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </ListItemButton>
          ))}
        </List>
      </Box>

      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Box
          sx={{
            px: 3,
            py: 1.25,
            borderBottom: `1px solid ${border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography
            sx={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: isDark ? "#ececec" : "#0d0d0d",
            }}
          >
            {selectedCategoryId
              ? categories.find((c) => c.id === selectedCategoryId)?.name ?? "Заметки"
              : "Все заметки"}
          </Typography>
          <Button
            startIcon={<AddRoundedIcon sx={{ fontSize: 16 }} />}
            variant="outlined"
            size="small"
            onClick={openCreateNote}
            sx={{ fontSize: "0.8125rem", px: 1.5 }}
          >
            Добавить
          </Button>
        </Box>

        <Box sx={{ flex: 1, overflow: "auto" }}>
          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress size={18} />
            </Box>
          )}

          {!loading && notes.length === 0 && (
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
                Нет заметок
              </Typography>
            </Box>
          )}

          {incomplete.length > 0 && (
            <List disablePadding>
              {incomplete.map((note, idx) => {
                const cat = categories.find((c) => c.id === note.category_id);
                return (
                  <Box key={note.id}>
                    {idx > 0 && <Divider />}
                    <ListItem
                      disablePadding
                      secondaryAction={
                        <Box
                          className="note-actions"
                          sx={{
                            display: "flex",
                            opacity: 0,
                            transition: "opacity 0.15s",
                            ".MuiListItem-root:hover &": { opacity: 1 },
                          }}
                        >
                          <IconButton
                            size="small"
                            onClick={() => openEditNote(note)}
                            sx={{ width: 30, height: 30 }}
                          >
                            <EditOutlinedIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => setDeleteNoteConfirm(note.id)}
                            sx={{ width: 30, height: 30 }}
                          >
                            <DeleteOutlineRoundedIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Box>
                      }
                    >
                      <ListItemButton
                        dense
                        disableRipple
                        sx={{
                          pr: 8,
                          py: 1.25,
                          borderRadius: 0,
                          "&:hover": {
                            backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                          },
                        }}
                        onClick={() => toggleNote(note.id, true)}
                      >
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <Box
                            sx={{
                              width: 15,
                              height: 15,
                              borderRadius: "50%",
                              border: `1.5px solid ${isDark ? "#3a3a3a" : "#d5d5d5"}`,
                              flexShrink: 0,
                            }}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={note.title}
                          secondary={
                            note.content || cat ? (
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.2 }}>
                                {note.content && (
                                  <Typography
                                    component="span"
                                    sx={{
                                      fontSize: "0.8125rem",
                                      color: isDark ? "#6e6e80" : "#8e8ea0",
                                    }}
                                  >
                                    {note.content}
                                  </Typography>
                                )}
                                {cat && (
                                  <Box
                                    sx={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 0.5,
                                      px: 0.75,
                                      py: 0.125,
                                      borderRadius: "3px",
                                      backgroundColor: cat.color + "18",
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        width: 5,
                                        height: 5,
                                        borderRadius: "50%",
                                        backgroundColor: cat.color,
                                        flexShrink: 0,
                                      }}
                                    />
                                    <Typography
                                      component="span"
                                      sx={{
                                        fontSize: "0.75rem",
                                        color: cat.color,
                                        fontWeight: 500,
                                        lineHeight: 1.2,
                                      }}
                                    >
                                      {cat.name}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            ) : undefined
                          }
                          primaryTypographyProps={{
                            fontSize: "0.9375rem",
                            color: isDark ? "#ececec" : "#0d0d0d",
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  </Box>
                );
              })}
            </List>
          )}

          {completed.length > 0 && (
            <>
              {incomplete.length > 0 && <Divider />}
              <Box sx={{ px: 3, py: 1.25 }}>
                <Typography
                  sx={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: isDark ? "#4a4a5a" : "#c5c5d2",
                  }}
                >
                  Выполнено · {completed.length}
                </Typography>
              </Box>
              <List disablePadding sx={{ opacity: 0.5 }}>
                {completed.map((note, idx) => (
                  <Box key={note.id}>
                    {idx > 0 && <Divider />}
                    <ListItem
                      disablePadding
                      secondaryAction={
                        <IconButton
                          size="small"
                          onClick={() => setDeleteNoteConfirm(note.id)}
                          sx={{ width: 30, height: 30, opacity: 0, ".MuiListItem-root:hover &": { opacity: 1 }, transition: "opacity 0.15s" }}
                        >
                          <DeleteOutlineRoundedIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                      }
                    >
                      <ListItemButton
                        dense
                        disableRipple
                        sx={{
                          pr: 6,
                          py: 1.25,
                          borderRadius: 0,
                          "&:hover": {
                            backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                          },
                        }}
                        onClick={() => toggleNote(note.id, false)}
                      >
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <Box
                            sx={{
                              width: 15,
                              height: 15,
                              borderRadius: "50%",
                              backgroundColor: isDark ? "#3a3a3a" : "#d5d5d5",
                              flexShrink: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Box
                              component="svg"
                              viewBox="0 0 10 8"
                              sx={{ width: 8, height: 8 }}
                            >
                              <path
                                d="M1 4L3.5 6.5L9 1.5"
                                stroke={isDark ? "#6e6e80" : "#8e8ea0"}
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="none"
                              />
                            </Box>
                          </Box>
                        </ListItemIcon>
                        <ListItemText
                          primary={note.title}
                          primaryTypographyProps={{
                            sx: {
                              textDecoration: "line-through",
                              color: isDark ? "#4a4a5a" : "#c5c5d2",
                              fontSize: "0.9375rem",
                            },
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  </Box>
                ))}
              </List>
            </>
          )}
        </Box>
      </Box>

      <Dialog open={noteDialog} onClose={() => setNoteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editNote ? "Редактировать заметку" : "Новая заметка"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}>
          <TextField
            label="Заголовок"
            value={noteForm.title}
            onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
            required
            autoFocus
          />
          <TextField
            label="Описание"
            multiline
            rows={3}
            value={noteForm.content}
            onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
          />
          <TextField
            select
            label="Категория"
            value={noteForm.category_id}
            onChange={(e) => setNoteForm({ ...noteForm, category_id: e.target.value })}
          >
            <MenuItem value="">— без категории —</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: c.color }} />
                  {c.name}
                </Box>
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={() => setNoteDialog(false)}>Отмена</Button>
          <Button onClick={handleSaveNote} variant="contained" disabled={!noteForm.title}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={catDialog} onClose={() => setCatDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editCategoryId ? "Редактировать категорию" : "Новая категория"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}>
          <TextField
            label="Название"
            value={catForm.name}
            onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
            required
            autoFocus
          />
          <Box>
            <Typography
              sx={{
                fontSize: "0.75rem",
                color: isDark ? "#8e8ea0" : "#6e6e80",
                mb: 1,
              }}
            >
              Цвет
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {PRESET_COLORS.map((c) => (
                <Box
                  key={c}
                  onClick={() => setCatForm({ ...catForm, color: c })}
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    backgroundColor: c,
                    cursor: "pointer",
                    outline: catForm.color === c ? `2px solid ${c}` : "2px solid transparent",
                    outlineOffset: 2,
                    transition: "transform 0.1s, outline 0.1s",
                    "&:hover": { transform: "scale(1.1)" },
                  }}
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            variant="text"
            onClick={() => {
              setCatDialog(false);
              setEditCategoryId(null);
              setCatForm({ name: "", color: "#0ea5e9" });
            }}
          >
            Отмена
          </Button>
          <Button onClick={handleSaveCategory} variant="contained" disabled={!catForm.name}>
            {editCategoryId ? "Сохранить" : "Создать"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteNoteConfirm} onClose={() => setDeleteNoteConfirm(null)}>
        <DialogTitle>Удалить заметку?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: "0.9rem", color: isDark ? "#8e8ea0" : "#6e6e80" }}>
            Это действие нельзя отменить.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={() => setDeleteNoteConfirm(null)}>Отмена</Button>
          <Button
            variant="contained"
            sx={{
              backgroundColor: isDark ? "#ef4444" : "#dc2626",
              color: "#ffffff",
              "&:hover": { backgroundColor: isDark ? "#dc2626" : "#b91c1c" },
            }}
            onClick={async () => {
              if (deleteNoteConfirm) { await deleteNote(deleteNoteConfirm); setDeleteNoteConfirm(null); }
            }}
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteCatConfirm} onClose={() => setDeleteCatConfirm(null)}>
        <DialogTitle>Удалить категорию?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: "0.9rem", color: isDark ? "#8e8ea0" : "#6e6e80" }}>
            Заметки категории не удалятся, но лишатся привязки к ней.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={() => setDeleteCatConfirm(null)}>Отмена</Button>
          <Button
            variant="contained"
            sx={{
              backgroundColor: isDark ? "#ef4444" : "#dc2626",
              color: "#ffffff",
              "&:hover": { backgroundColor: isDark ? "#dc2626" : "#b91c1c" },
            }}
            onClick={async () => {
              if (deleteCatConfirm) { await deleteCategory(deleteCatConfirm); setDeleteCatConfirm(null); }
            }}
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
