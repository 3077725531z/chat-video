# 📤 如何提交代码到GitHub

## 快速步骤（3步完成）

### 步骤1: 添加所有修改的文件

在项目文件夹中打开命令行（PowerShell或CMD），执行：

```bash
git add .
```

这会添加所有修改的文件到暂存区。

### 步骤2: 提交代码

```bash
git commit -m "优化：视频按钮位置调整和功能优化"
```

`-m` 后面的内容是提交说明，你可以改成任何描述，例如：
- `"优化视频实时加载"`
- `"修复消息丢失问题"`
- `"调整全屏按钮位置"`
- `"优化移动端体验"`

### 步骤3: 推送到GitHub

```bash
git push
```

或者如果这是第一次推送：

```bash
git push -u origin main
```

## ✅ 完成！

推送成功后，你的代码就已经更新到GitHub了！

---

## 📋 完整命令序列

```bash
# 1. 查看修改状态（可选）
git status

# 2. 添加所有修改
git add .

# 3. 提交代码
git commit -m "你的提交说明"

# 4. 推送到GitHub
git push
```

---

## ❓ 常见问题

### Q: 提示需要身份验证？

**A:** 使用Personal Access Token：
1. 访问：https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. 勾选 `repo` 权限
4. 生成后复制Token
5. 推送时：
   - 用户名：你的GitHub用户名
   - 密码：粘贴Token（不是GitHub密码）

### Q: 提示 "nothing to commit"？

**A:** 说明没有修改的文件，或者文件已经被提交了。

### Q: 提示 "remote origin does not exist"？

**A:** 需要先添加远程仓库：
```bash
git remote add origin https://github.com/你的用户名/chat-video-app.git
```

### Q: 想查看修改了哪些文件？

**A:** 使用：
```bash
git status
```

### Q: 想查看具体的修改内容？

**A:** 使用：
```bash
git diff
```

---

## 💡 提示

- 每次修改后都可以重复这3个步骤
- 提交说明要清晰，方便以后查看历史
- 建议经常提交，不要积累太多修改

---

## 🚀 提交后部署

如果已经部署到Render，推送代码后：
1. Render会自动检测到更新
2. 自动重新部署（大约5-10分钟）
3. 部署完成后应用会自动更新

