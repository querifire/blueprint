# Настройка Git для querifire/blueprint

Пересоздание локального репозитория и привязка к GitHub от аккаунта querifire.

## 1. Удалить старую историю и пересоздать репозиторий

В корне проекта (`a:\Projects\Main\blueprint`):

```powershell
cd "a:\Projects\Main\blueprint"
Remove-Item -Recurse -Force .git
git init
```

## 2. Указать автора от querifire

Подставь свой email и имя для аккаунта querifire:

```powershell
git config user.email "твой-email@example.com"
git config user.name "querifire"
```

Для всех репозиториев глобально:

```powershell
git config --global user.email "твой-email@example.com"
git config --global user.name "querifire"
```

## 3. Подключить удалённый репозиторий

```powershell
git remote add origin https://github.com/querifire/blueprint.git
```

## 4. Первый коммит и отправка

```powershell
git add .
git status
git commit -m "Initial commit"
git branch -M main
git push -u origin main --force
```

`--force` нужен, если на GitHub уже есть другие коммиты (например, только LICENSE) и ты хочешь заменить историю своей.

## Дальнейшая работа

- Обновить локальную ветку с GitHub: `git pull origin main`
- Закоммитить изменения: `git add .` → `git commit -m "описание"` → `git push`
- Создать тег для релиза: `git tag v0.1.0` → `git push origin v0.1.0`
