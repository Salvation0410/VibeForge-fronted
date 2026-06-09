# AGENTS

本文件是给后续编码代理和协作者看的项目约定。修改代码前先读这里，再按现有结构落地，不要重复造轮子。

## 项目概览

- 项目是 `Vue 3 + TypeScript + Vite + Ant Design Vue + Pinia + axios` 前端。
- 后端通过 Vite 代理访问，开发环境 `/api` 代理到 `http://localhost:8123`，见 `vite.config.ts`。
- 登录态基于 cookie/session，项目内 axios 实例都应保持 `withCredentials: true`。
- 代码风格统一使用 Composition API 和 `<script setup lang="ts">`。
- 样式优先使用 `scoped CSS`，页面风格保持简洁、现代、浅色、轻阴影，桌面端优先，同时兼顾移动端。

## 常用命令

- 启动开发服务：`npm run dev`
- 类型检查：`npm run type-check`
- 生产构建：`npm run build`
- 仅构建：`npm run build-only`
- 代码格式化：`npm run format`
- ESLint 修复：`npm run lint`
- OpenAPI 生成：`npm run openapi2ts`

改完页面、路由、类型、接口调用后，至少运行 `npm run type-check`。涉及依赖、构建链路或较大 UI 改动时运行 `npm run build`。

## 目录职责

- `src/api/`：按业务域封装后端接口。已有模块包括用户、应用、聊天历史、社区、管理后台数据等。
- `src/stores/`：Pinia 状态。登录用户状态在 `loginUser.ts`，社区共享状态在 `community.ts`。
- `src/router/index.ts`：路由表。
- `src/permission.ts`：统一路由权限守卫。
- `src/layouts/`：认证布局和登录后应用壳。
- `src/pages/`：首页、登录注册、个人主页、应用生成、应用/用户/聊天管理等页面。
- `src/views/community/`：社区广场、发帖、帖子详情、社区后台管理页面。
- `src/views/admin/`：管理员后台布局和数据看板。
- `src/components/community/`：社区卡片、评论、发帖表单、后台入口组件。
- `src/components/profile/`：个人主页相关卡片。
- `src/utils/`：通用工具，如应用权限、日期格式、下载、用户 id、社区富文本内容处理等。
- `src/types/`：模块补充声明，如路由 meta 和 wangEditor Vue 类型声明。

## API 约定

- 不要在页面里临时手写 axios 请求。优先复用并扩展 `src/api/*.ts`。
- 用户认证与资料相关接口统一放在 `src/api/sysUserApi.ts`。
- 应用生成与应用管理接口统一放在 `src/api/app.ts`。
- 聊天历史接口统一放在 `src/api/chatHistory.ts`。
- 社区帖子、标签、评论、点赞、审核、置顶接口统一放在 `src/api/community.ts`。
- 管理后台数据看板接口统一放在 `src/api/adminDashboard.ts`。
- 后端可能返回 16 位以上长整型 id，接口实例应继续使用 `apiTransformResponse`，避免大整数精度丢失。
- 业务成功码统一按 `src/utils/appUtils.ts` 中的 `isSuccessCode` 判断。

## 登录与权限

- 当前登录用户状态统一由 `src/stores/loginUser.ts` 管理。
- 应用入口在 `src/main.ts` 通过 `ensureLoginUserBootstrapped` 拉取当前登录用户。
- 路由登录态和角色校验统一放在 `src/permission.ts`，不要在页面里重复实现路由守卫。
- 路由 `meta.requiresAuth` 表示必须登录，`meta.roles` 表示角色限制，管理员角色值为 `admin`。
- 普通用户只能看到首页和交流社区等普通入口；管理员才显示并进入后台管理。
- 顶栏导航在 `src/layouts/AppLayout.vue` 中根据登录用户角色动态展示。
- 首页点击“交流社区”时会新开浏览器标签页，这是已有交互，不要无意改回当前页跳转。

## 认证模块

- 认证页优先维护：
  - `src/layouts/AuthLayout.vue`
  - `src/pages/LoginView.vue`
  - `src/pages/RegisterView.vue`
- 登录支持账号 + 密码、邮箱 + 密码。
- 注册支持账号 + 密码、邮箱 + 密码。
- 注册表单只允许普通用户填写 `account` 或 `email`、`password`、`confirmPassword`、`nickname`、`userProfile` 等基础资料，不要暴露 `userRole` 输入。
- 登录成功默认跳转 `/home`，注册成功跳转 `/login`。

## 应用生成模块

- 首页在 `src/pages/HomeView.vue`，应用卡片在 `src/components/AppCard.vue`。
- 应用聊天生成页在 `src/pages/AppChatView.vue`。
- 应用编辑页在 `src/pages/AppEditView.vue`。
- 应用可见与可管理判断使用 `src/utils/appAccess.ts`：
  - 管理员可以管理应用。
  - 应用创建者可以管理自己的应用。
  - 精选应用按 `priority >= 99` 允许公开查看。
- 聊天历史加载使用 `src/api/chatHistory.ts`，不要重新请求。
- SSE 生成代码通过 `chatToGenCodeStream`，需要保留 `withCredentials`。
- 进入已有应用聊天页时不要带 `?mode=create`；新建应用后首次进入才使用创建模式。

## 交流社区模块

- 社区广场：`src/views/community/CommunitySquareView.vue`
- 发帖页：`src/views/community/PostCreateView.vue`
- 帖子详情：`src/views/community/CommunityPostDetailView.vue`
- 帖子卡片：`src/components/community/CommunityPostCard.vue`
- 评论列表/评论项：`src/components/community/CommunityCommentList.vue`、`CommunityCommentItem.vue`
- 社区共享状态：`src/stores/community.ts`
- 社区后台管理：
  - 帖子审核：`CommunityPostReviewView.vue`
  - 评论管理：`CommunityCommentAdminView.vue`
  - 标签管理：`CommunityTagAdminView.vue`

社区接口规则：

- 帖子广场是游标分页，不是 pageNum 分页。
- 帖子广场参数包括 `pageSize`、`cursor`、`keyword`、`tagId`、`sortType`。
- `sortType` 取值为 `latest` 或 `hot`。
- 切换搜索词、标签、排序时必须重置列表、游标和 `hasMore`。
- 发帖接口是 `multipart/form-data`，字段为 `title`、`content`、`tagId`、`imageFiles`。
- 新发帖默认进入待审核状态，不要假设会立刻公开显示。
- 点赞接口是切换型接口，前端收到返回后直接用 `liked` 和 `likeCount` 更新 UI。
- 评论支持嵌套回复：顶层评论 `parentId = 0`，子评论查询传对应 `parentId`。
- 评论列表也是游标分页，支持 `latest` / `hot`。
- 未登录用户可以浏览；发帖、点赞、评论前必须提示登录，不要让页面报错。

富文本规则：

- 发帖页使用 `@wangeditor/editor` 和 `@wangeditor/editor-for-vue`。
- 帖子正文 `content` 存 HTML 字符串。
- 展示帖子正文和摘要时使用 `src/utils/communityContent.ts`。
- 渲染 HTML 前必须经过 `DOMPurify`，不要直接把接口原文 `v-html` 到页面。
- 老帖子如果是纯文本，应继续兼容展示。

## 个人主页

- 页面文件：`src/pages/ProfileView.vue`。
- `/profile` 是当前用户个人中心，需要登录。
- `/profile/:userId` 是公开个人主页，可以未登录查看。
- 只有当前用户查看自己的主页时可以编辑资料。
- 其他用户查看公开主页时只能看该用户公开应用和社区文章，不需要粉丝、关注功能。
- 当前用户资料更新走 `updateCurrentUserProfileWithAvatar`，邮箱不是必填字段。
- 当前用户帖子列表和指定用户公开帖子列表使用 `src/api/community.ts` 中对应接口。
- 当前用户应用列表使用 `getMyAppPage`；公开主页应用列表使用 `getUserPublicAppPage`。

## 管理后台

- 后台入口路由统一在 `/admin` 下，仅管理员可访问。
- 后台布局：`src/views/admin/AdminLayoutView.vue`。
- 数据看板：`src/views/admin/AdminDashboardView.vue`。
- 用户管理：`src/pages/UserManageView.vue`。
- 应用管理：`src/pages/AppManageView.vue`。
- 聊天管理：`src/pages/ChatManageView.vue`。
- 社区管理页面放在 `src/views/community/`。
- 后台页面可以更偏操作型，但仍保持轻量、清爽，不要做成默认模板表格堆砌。

## UI 与体验约定

- 主品牌名称使用“智创 · AI应用平台”，Logo 使用 `src/assets/logo.png`。
- 交流社区可在副标题或页面局部体现，但不要再把品牌写成 NoCode。
- 页面文本应使用正常中文，避免乱码或 mojibake。
- Ant Design Vue 可用于表单、按钮、表格、弹窗、抽屉、分页、提示等。
- 社区广场应保持内容社区流体验，不要改成纯后台表格。
- 发帖页应保持类似写作页的专注体验，不要增加复杂侧边栏。
- 图片上传需要本地预览和删除能力。
- 移动端和桌面端都要可用，避免文字溢出、按钮重叠、布局错位。

## 编辑注意事项

- 当前仓库可能存在未提交改动。不要回滚或覆盖与当前任务无关的修改。
- 手工编辑文件优先使用 `apply_patch`。
- 搜索文件和文本优先使用 `rg`。
- 不要新增重复的 axios 封装模块。
- 不要把所有逻辑塞进单个大文件；优先沿用已有组件和工具拆分。
- 改接口类型时同步检查调用方。
- 改路由 meta 时同步检查 `src/types/vue-router.d.ts`。
- 引入第三方库时更新 `package.json` 和 `package-lock.json`，并说明用途。

## 验证清单

常规改动：

- 运行 `npm run type-check`。

较大前端或依赖改动：

- 运行 `npm run build`。

社区发帖/富文本相关改动：

- 检查 `/community/create` 可输入标题、选择标签、编辑富文本、预览、上传图片。
- 检查发帖提交仍走 `createCommunityPost`。
- 检查帖子详情页能展示富文本和图片。
- 检查帖子卡片摘要不显示 HTML 标签。

个人主页相关改动：

- 检查 `/profile` 当前用户视角。
- 检查 `/profile/:userId` 公开用户视角。
- 检查只有本人能看到并使用编辑资料入口。

权限相关改动：

- 检查普通用户无法进入 `/admin`。
- 检查管理员能看到后台菜单并进入后台页面。
- 检查未登录用户可浏览社区，但发帖、点赞、评论会提示登录。
