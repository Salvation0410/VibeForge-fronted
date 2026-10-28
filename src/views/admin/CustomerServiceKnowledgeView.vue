<template>
  <CustomerServiceKnowledgeWorkspace
    v-model:tasks-open="tasksOpen"
    :selected-file="selectedFile"
    :uploading="uploading"
    :list-loading="listLoading"
    :documents="documents"
    :health="health"
    :health-items="healthItems"
    :rebuilding="rebuilding"
    :pagination="pagination"
    :tasks-loading="tasksLoading"
    :tasks="tasks"
    :is-task-loading="isTaskLoading"
    :is-operating="isOperating"
    :has-document-operation="hasDocumentOperation"
    @file-input="fileInputRef = $event"
    @file-change="handleFileChange"
    @clear-file="clearSelectedFile"
    @choose-file="chooseFile"
    @upload="handleUpload"
    @refresh="loadDocuments"
    @rebuild="confirmRebuild"
    @open-tasks="openTasks"
    @document-action="handleDocumentAction"
    @delete-document="confirmDelete"
    @page-change="handlePageChange"
    @close-tasks="handleTasksClose"
  />
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from "vue";
import { message, Modal } from "ant-design-vue";
import CustomerServiceKnowledgeWorkspace from "@/components/customer-service/CustomerServiceKnowledgeWorkspace.vue";
import {
  deleteCustomerServiceKnowledgeDocument,
  disableCustomerServiceKnowledgeDocument,
  enableCustomerServiceKnowledgeDocument,
  getCustomerServiceKnowledgeHealth,
  getCustomerServiceKnowledgePage,
  getCustomerServiceKnowledgeTasks,
  rebuildCustomerServiceKnowledge,
  reindexCustomerServiceKnowledgeDocument,
  uploadCustomerServiceKnowledgeDocument,
  type CustomerServiceKnowledgeDocument,
  type CustomerServiceKnowledgeHealth,
  type CustomerServiceKnowledgeId,
  type CustomerServiceKnowledgeTask,
  type CustomerServicePageResult,
} from "@/api/customerService";
import { formatDateTime, isSuccessCode } from "@/utils/appUtils";
import {
  canRetryCustomerServiceKnowledgeDocument,
  createCustomerServiceLatestRequestController,
  createCustomerServiceModalRegistry,
  createCustomerServiceOperationGuard,
  formatCustomerServiceFileSize,
  formatCustomerServiceLongValue,
  getCustomerServiceDocumentStatus,
  getCustomerServiceTaskStatus,
  normalizeCustomerServiceErrorCode,
  reconcileCustomerServicePagination,
  validateCustomerServiceKnowledgeFile,
} from "@/utils/customerService";

type DocumentAction = "reindex" | "enable" | "disable" | "delete";

const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const uploading = ref(false);
const listLoading = ref(false);
const documents = ref<CustomerServiceKnowledgeDocument[]>([]);
const health = ref<CustomerServiceKnowledgeHealth>({
  enabled: false,
  coordinator: false,
  python: false,
});
const operations = ref(new Set<string>());
const tasksOpen = ref(false);
const tasksLoading = ref(false);
const tasks = ref<CustomerServiceKnowledgeTask[]>([]);
let disposed = false;
let activeTasksKey = "";

const pagination = reactive({ current: 1, pageSize: 10, total: 0 });

const healthItems = computed(() => [
  { key: "enabled", label: "知识库功能", ready: health.value.enabled },
  { key: "coordinator", label: "任务协调器", ready: health.value.coordinator },
  { key: "python", label: "AI ETL 服务", ready: health.value.python },
]);

const operationGuard = createCustomerServiceOperationGuard((keys) => {
  operations.value = new Set(keys);
});
const modalRegistry = createCustomerServiceModalRegistry();
const rebuilding = computed(() => operations.value.has("rebuild"));

function documentStatus(status?: string | null) {
  return getCustomerServiceDocumentStatus(status);
}

function taskStatus(status?: string | null) {
  return getCustomerServiceTaskStatus(status);
}

const formatFileSize = formatCustomerServiceFileSize;

function operationLabel(operation?: string) {
  const labels: Record<string, string> = {
    INDEX: "索引",
    DELETE: "删除索引",
    REBUILD: "全量重建",
  };
  return labels[String(operation || "").toUpperCase()] || "未知操作";
}

function operationKey(id: CustomerServiceKnowledgeId, action: DocumentAction) {
  return `${id}:${action}`;
}

function isOperating(id: CustomerServiceKnowledgeId, action: DocumentAction) {
  return operations.value.has(operationKey(id, action));
}

function hasDocumentOperation(id: CustomerServiceKnowledgeId) {
  return Array.from(operations.value).some((key) => key.startsWith(`${id}:`));
}

function isTaskLoading(id: CustomerServiceKnowledgeId) {
  return operations.value.has(`tasks:${id}`);
}

function chooseFile() {
  fileInputRef.value?.click();
}

function clearSelectedFile() {
  selectedFile.value = null;
  if (fileInputRef.value) fileInputRef.value.value = "";
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const validation = validateCustomerServiceKnowledgeFile(file);
  if (!validation.valid) {
    message.error(validation.message);
    clearSelectedFile();
    return;
  }
  selectedFile.value = file;
}

const listController = createCustomerServiceLatestRequestController<
  { pageNum: number; pageSize: number },
  CustomerServicePageResult<CustomerServiceKnowledgeDocument>
>({
  request: async (params: { pageNum: number; pageSize: number }, signal) => {
    const response = await getCustomerServiceKnowledgePage(params, signal);
    if (!isSuccessCode(response.code)) {
      throw new Error("knowledge page unavailable");
    }
    return response.data;
  },
  onSuccess: (page, params) => {
    const normalized = reconcileCustomerServicePagination(
      params,
      page?.totalRow,
    );
    pagination.total = normalized.total;
    if (
      normalized.needsReload &&
      pagination.current === params.pageNum &&
      pagination.pageSize === params.pageSize
    ) {
      pagination.current = normalized.current;
      pagination.pageSize = normalized.pageSize;
      void loadDocuments();
      return;
    }
    documents.value = Array.isArray(page?.records) ? page.records : [];
  },
  onError: () => {
    message.error("知识文档加载失败，请稍后重试");
  },
  onLoadingChange: (loading) => {
    listLoading.value = loading;
  },
});

const healthController = createCustomerServiceLatestRequestController<
  undefined,
  CustomerServiceKnowledgeHealth
>({
  request: async (_params: undefined, signal) => {
    const response = await getCustomerServiceKnowledgeHealth(signal);
    if (!isSuccessCode(response.code)) {
      throw new Error("knowledge health unavailable");
    }
    return response.data;
  },
  onSuccess: (result) => {
    health.value = result;
  },
  onError: () => {
    health.value = { enabled: false, coordinator: false, python: false };
  },
});

const uploadController = createCustomerServiceLatestRequestController<
  File,
  CustomerServiceKnowledgeDocument
>({
  request: async (file: File, signal) => {
    const response = await uploadCustomerServiceKnowledgeDocument(
      file,
      undefined,
      signal,
    );
    if (!isSuccessCode(response.code)) {
      throw new Error("knowledge upload failed");
    }
    return response.data;
  },
  onSuccess: async () => {
    message.success("文档已上传，索引任务已提交");
    pagination.current = 1;
    await loadDocuments();
  },
  onError: () => {
    message.error("文档上传失败，请检查文件后重试");
  },
  onLoadingChange: (loading) => {
    uploading.value = loading;
  },
});

const tasksController = createCustomerServiceLatestRequestController<
  { documentId: CustomerServiceKnowledgeId },
  CustomerServiceKnowledgeTask[]
>({
  request: async (
    params: { documentId: CustomerServiceKnowledgeId },
    signal,
  ) => {
    const response = await getCustomerServiceKnowledgeTasks(
      params.documentId,
      20,
      signal,
    );
    if (!isSuccessCode(response.code)) {
      throw new Error("knowledge tasks unavailable");
    }
    return response.data;
  },
  onSuccess: (result) => {
    tasks.value = Array.isArray(result) ? result : [];
  },
  onError: () => {
    message.error("ETL 历史加载失败，请稍后重试");
  },
  onLoadingChange: (loading) => {
    tasksLoading.value = loading;
  },
});

// 分页属于业务查询条件，展示组件只上报新值，不直接修改父级状态。
function handlePageChange(page: number, size: number) {
  pagination.current = page;
  pagination.pageSize = size;
  void loadDocuments();
}

function loadDocuments() {
  void healthController.run(undefined);
  return listController.run({
    pageNum: pagination.current,
    pageSize: pagination.pageSize,
  });
}

async function handleUpload() {
  const file = selectedFile.value;
  if (!file || uploading.value) return;
  const validation = validateCustomerServiceKnowledgeFile(file);
  if (!validation.valid) {
    message.error(validation.message);
    clearSelectedFile();
    return;
  }

  const request = uploadController.run(file);
  clearSelectedFile();
  await request;
}

async function handleDocumentAction(
  document: CustomerServiceKnowledgeDocument,
  action: Exclude<DocumentAction, "delete">,
) {
  const key = operationKey(document.id, action);
  if (hasDocumentOperation(document.id) || !operationGuard.acquire(key)) return;
  try {
    const actionMap = {
      reindex: reindexCustomerServiceKnowledgeDocument,
      enable: enableCustomerServiceKnowledgeDocument,
      disable: disableCustomerServiceKnowledgeDocument,
    };
    const response = await actionMap[action](document.id);
    if (!isSuccessCode(response.code))
      throw new Error(response.message || "操作失败");
    if (disposed) return;
    message.success(
      action === "disable"
        ? "文档已停用"
        : action === "enable"
          ? "文档已启用"
          : "重试任务已提交",
    );
    await loadDocuments();
  } catch {
    if (!disposed) message.error("操作失败，请稍后重试");
  } finally {
    operationGuard.release(key);
  }
}

function confirmDelete(document: CustomerServiceKnowledgeDocument) {
  const key = operationKey(document.id, "delete");
  const confirmationKey = "destructive-confirmation";
  const guardKeys = [confirmationKey, key];
  if (
    hasDocumentOperation(document.id) ||
    !operationGuard.acquireAll(guardKeys)
  )
    return;
  let releaseModal: () => void = () => undefined;
  const handle = Modal.confirm({
    title: "确认删除该知识文档？",
    content: `“${document.name || "未命名文档"}”删除后无法恢复，并会异步清理对应索引。`,
    okText: "确认删除",
    cancelText: "取消",
    okType: "danger",
    async onOk() {
      if (
        disposed ||
        !operationGuard.has(confirmationKey) ||
        !operationGuard.has(key)
      ) {
        releaseModal();
        return;
      }
      try {
        const response = await deleteCustomerServiceKnowledgeDocument(
          document.id,
        );
        if (!isSuccessCode(response.code))
          throw new Error(response.message || "删除失败");
        if (disposed) return;
        message.success("文档删除任务已提交");
        await loadDocuments();
      } catch {
        if (!disposed) message.error("删除失败，请稍后重试");
      } finally {
        releaseModal();
      }
    },
    onCancel() {
      releaseModal();
    },
  });
  releaseModal = modalRegistry.register(handle, () =>
    operationGuard.releaseAll(guardKeys),
  );
}

async function openTasks(document: CustomerServiceKnowledgeDocument) {
  const key = `tasks:${document.id}`;
  if (!operationGuard.acquire(key)) return;
  activeTasksKey = key;
  tasksOpen.value = true;
  tasks.value = [];
  try {
    await tasksController.run({ documentId: document.id });
  } finally {
    operationGuard.release(key);
    if (activeTasksKey === key) activeTasksKey = "";
  }
}

function handleTasksClose() {
  tasksController.cancel();
  if (activeTasksKey) {
    operationGuard.release(activeTasksKey);
    activeTasksKey = "";
  }
}

function confirmRebuild() {
  const key = "rebuild";
  const confirmationKey = "destructive-confirmation";
  const guardKeys = [confirmationKey, key];
  if (!operationGuard.acquireAll(guardKeys)) return;
  let releaseModal: () => void = () => undefined;
  const handle = Modal.confirm({
    title: "确认全量重建客服知识库？",
    content: "该操作会创建全量重建任务，期间检索结果可能短暂延迟更新。",
    okText: "确认重建",
    cancelText: "取消",
    okType: "danger",
    async onOk() {
      if (
        disposed ||
        !operationGuard.has(confirmationKey) ||
        !operationGuard.has(key)
      ) {
        releaseModal();
        return;
      }
      try {
        const response = await rebuildCustomerServiceKnowledge();
        if (!isSuccessCode(response.code))
          throw new Error(response.message || "重建提交失败");
        if (disposed) return;
        message.success("全量重建任务已提交");
        await loadDocuments();
      } catch {
        if (!disposed) message.error("全量重建提交失败，请稍后重试");
      } finally {
        releaseModal();
      }
    },
    onCancel() {
      releaseModal();
    },
  });
  releaseModal = modalRegistry.register(handle, () =>
    operationGuard.releaseAll(guardKeys),
  );
}

onBeforeUnmount(() => {
  disposed = true;
  listController.dispose();
  healthController.dispose();
  uploadController.dispose();
  tasksController.dispose();
  modalRegistry.dispose();
  operationGuard.dispose();
  clearSelectedFile();
});
void loadDocuments();
</script>
