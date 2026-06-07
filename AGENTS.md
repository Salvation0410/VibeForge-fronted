# AGENTS

- 认证相关页面继续复用 `src/api/sysUserApi.ts`，不要新建 axios 封装或重复请求模块。
- 登录支持账号 + 密码、邮箱 + 密码；注册支持账号 + 密码、邮箱 + 密码。
- 注册表单仅包含 `account` 或 `email`、`password`、`confirmPassword`、`nickname`、`userProfile`，不要出现普通用户可输入的 `userRole` 输入框。
- 登录成功默认跳转 `/home`，注册成功跳转 `/login`。
- 登录用户状态统一放在 `src/stores/loginUser.ts`，使用 Pinia 管理，并在应用入口拉取当前登录用户信息。
- 首页采用全局顶栏布局，导航项按当前登录用户角色动态显示。
- 管理员角色需要显示“用户管理”菜单，并可进入用户管理页执行 CRUD。
- 前端权限控制统一放在独立权限文件中，并通过 Vue Router 路由守卫在每次进入页面前校验登录态和角色。
- 代码统一使用 Vue 3 + TypeScript + Composition API + `<script setup>`，样式优先使用 `scoped CSS`。
- 页面风格保持简洁、现代、浅色、轻阴影，桌面端优先，避免默认后台模板感。
- 认证页相关实现优先集中在 `src/layouts/AuthLayout.vue`、`src/pages/LoginView.vue`、`src/pages/RegisterView.vue`。
- 应用壳和登录后页面优先集中在 `src/layouts/AppLayout.vue`、`src/pages/HomeView.vue`、`src/pages/UserManageView.vue`。
