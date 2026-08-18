import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { OperatingMode } from "@const-ai/types";
import { useMutation } from "convex/react";
import { api } from "@const-ai/backend";

export type ReviewTabType =
  | "Review"
  | "File"
  | "Browser"
  | "Explore"
  | "Plan"
  | "Side conversation"
  | "Terminal";

export interface SideTabItem {
  id: string;
  type: ReviewTabType;
  title: string;
  filename?: string;
  url?: string;
  isClosable?: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  timeAgo: string;
  isActive?: boolean;
  hasAwaitingApproval?: boolean;
}

export interface ProjectFolder {
  id: string;
  name: string;
  tasks: TaskItem[];
}

export interface WorkspaceItem {
  id: string;
  name: string;
  path: string;
  isCurrent?: boolean;
}

interface NavigationContextType {
  // User & DB
  currentUserId: string | null;

  // Drawer & Panel States
  isTaskDrawerOpen: boolean;
  isReviewPanelOpen: boolean;
  isTerminalOpen: boolean;
  isWorkspaceModalOpen: boolean;
  isOverflowMenuOpen: boolean;
  isSettingsModalOpen: boolean;
  isOperatingModeModalOpen: boolean;
  isModelSelectorModalOpen: boolean;
  isContextMeterOpen: boolean;

  // Prompt Dock Modals & Input
  isPlusMenuOpen: boolean;
  isMentionOpen: boolean;
  isSlashCommandOpen: boolean;
  promptInput: string;

  // Active Session & Selections
  activeWorkspace: string;
  activeConversationId: string;
  activeTaskTitle: string;
  activeModel: string;
  activeOperatingMode: OperatingMode;
  activeReviewTab: ReviewTabType;
  filterMode: "group" | "project";
  customApiKey: string;
  customBaseUrl: string;

  // Multi-tab Side Panel
  openTabs: SideTabItem[];
  activeTabId: string;

  // Data Collections
  projects: ProjectFolder[];
  workspaces: WorkspaceItem[];

  // Actions
  toggleTaskDrawer: () => void;
  openTaskDrawer: () => void;
  closeTaskDrawer: () => void;

  toggleReviewPanel: () => void;
  openReviewPanel: () => void;
  closeReviewPanel: () => void;

  toggleTerminal: () => void;
  setTerminalOpen: (open: boolean) => void;

  setWorkspaceModalOpen: (open: boolean) => void;
  setOverflowMenuOpen: (open: boolean) => void;
  setSettingsModalOpen: (open: boolean) => void;
  setOperatingModeModalOpen: (open: boolean) => void;
  setModelSelectorModalOpen: (open: boolean) => void;
  setContextMeterOpen: (open: boolean) => void;

  setPlusMenuOpen: (open: boolean) => void;
  setMentionOpen: (open: boolean) => void;
  setSlashCommandOpen: (open: boolean) => void;
  setPromptInput: (text: string) => void;
  insertTextToPrompt: (text: string) => void;

  openSideTab: (tab: SideTabItem) => void;
  closeSideTab: (tabId: string) => void;
  setActiveTabId: (id: string) => void;

  setActiveWorkspace: (workspace: string) => void;
  setActiveConversationId: (id: string) => void;
  setActiveTaskTitle: (title: string) => void;
  setActiveModel: (model: string) => void;
  setActiveOperatingMode: (mode: OperatingMode) => void;
  setActiveReviewTab: (tab: ReviewTabType) => void;
  setFilterMode: (mode: "group" | "project") => void;
  setCustomApiKey: (key: string) => void;
  setCustomBaseUrl: (url: string) => void;

  selectTask: (task: TaskItem) => void;
  createNewConversation: (title?: string) => Promise<string | null>;
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

const INITIAL_WORKSPACES: WorkspaceItem[] = [
  { id: "ws-1", name: "const-ai-mobile", path: "D:/code/platform/const-ai-mobile" },
  { id: "ws-2", name: "Const Local (OmniRoute)", path: "http://localhost:20128/v1", isCurrent: true },
  { id: "ws-3", name: "Gemini 2.0 Flash", path: "https://generativelanguage.googleapis.com" },
];

const INITIAL_TABS: SideTabItem[] = [
  {
    id: "tab-file-server",
    type: "File",
    title: "server.js",
    filename: "server.js",
    isClosable: true,
  },
  {
    id: "tab-browser",
    type: "Browser",
    title: "localhost:8000",
    url: "http://localhost:8000/",
    isClosable: true,
  },
  {
    id: "tab-review",
    type: "Review",
    title: "Review",
    isClosable: false,
  },
  {
    id: "tab-explore",
    type: "Explore",
    title: "Explore",
    isClosable: false,
  },
  {
    id: "tab-plan",
    type: "Plan",
    title: "Plan",
    isClosable: false,
  },
];

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false);
  const [isReviewPanelOpen, setIsReviewPanelOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [isOverflowMenuOpen, setIsOverflowMenuOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isOperatingModeModalOpen, setIsOperatingModeModalOpen] = useState(false);
  const [isModelSelectorModalOpen, setIsModelSelectorModalOpen] = useState(false);
  const [isContextMeterOpen, setIsContextMeterOpen] = useState(false);

  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isMentionOpen, setIsMentionOpen] = useState(false);
  const [isSlashCommandOpen, setIsSlashCommandOpen] = useState(false);
  const [promptInput, setPromptInput] = useState("");

  const [activeWorkspace, setActiveWorkspace] = useState<string>("const-ai-mobile");
  const [activeConversationId, setActiveConversationId] = useState<string>("");
  const [activeTaskTitle, setActiveTaskTitle] = useState<string>("New Task");
  const [activeModel, setActiveModel] = useState<string>("Const");
  const [activeOperatingMode, setActiveOperatingMode] =
    useState<OperatingMode>("ask_before_change");
  const [activeReviewTab, setActiveReviewTab] = useState<ReviewTabType>("Review");
  const [filterMode, setFilterMode] = useState<"group" | "project">("project");

  const [customApiKey, setCustomApiKey] = useState<string>("");
  const [customBaseUrl, setCustomBaseUrl] = useState<string>(
    "http://localhost:20128/v1"
  );

  const [openTabs, setOpenTabs] = useState<SideTabItem[]>(INITIAL_TABS);
  const [activeTabId, setActiveTabId] = useState<string>("tab-review");
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>(INITIAL_WORKSPACES);

  const getOrCreateUser = useMutation(api.users.getOrCreateDefaultUser);
  const createConv = useMutation(api.conversations.createConversation);

  // Initialize Default User on mount
  useEffect(() => {
    let isMounted = true;
    getOrCreateUser({})
      .then((res) => {
        if (isMounted && res?.user?._id) {
          setCurrentUserId(res.user._id);
          if (res.config?.activeModel) {
            setActiveModel(res.config.activeModel);
          }
          if (res.config?.operatingMode) {
            setActiveOperatingMode(res.config.operatingMode);
          }
          if (res.config?.customBaseUrl) {
            setCustomBaseUrl(res.config.customBaseUrl);
          }
          if (res.config?.customApiKeys?.openAi) {
            setCustomApiKey(res.config.customApiKeys.openAi);
          }
        }
      })
      .catch((err) => {
        console.warn("Convex connection warning (local mode fallback):", err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleTaskDrawer = () => setIsTaskDrawerOpen((prev) => !prev);
  const openTaskDrawer = () => setIsTaskDrawerOpen(true);
  const closeTaskDrawer = () => setIsTaskDrawerOpen(false);

  const toggleReviewPanel = () => setIsReviewPanelOpen((prev) => !prev);
  const openReviewPanel = () => setIsReviewPanelOpen(true);
  const closeReviewPanel = () => setIsReviewPanelOpen(false);

  const toggleTerminal = () => setIsTerminalOpen((prev) => !prev);
  const setTerminalOpen = (open: boolean) => setIsTerminalOpen(open);

  const selectTask = (task: TaskItem) => {
    setActiveConversationId(task.id);
    setActiveTaskTitle(task.title);
    if (task.projectName) {
      setActiveWorkspace(task.projectName);
    }
    setIsTaskDrawerOpen(false);
  };

  const createNewConversation = async (
    title: string = "New Task"
  ): Promise<string | null> => {
    if (!currentUserId) {
      const fallbackId = `local_conv_${Date.now()}`;
      setActiveConversationId(fallbackId);
      setActiveTaskTitle(title);
      return fallbackId;
    }
    try {
      const convId = await createConv({
        userId: currentUserId as any,
        title,
      });
      setActiveConversationId(convId);
      setActiveTaskTitle(title);
      return convId;
    } catch (err) {
      console.warn("Failed to create conversation in DB:", err);
      const fallbackId = `local_conv_${Date.now()}`;
      setActiveConversationId(fallbackId);
      setActiveTaskTitle(title);
      return fallbackId;
    }
  };

  const handleSetWorkspace = (workspaceName: string) => {
    setActiveWorkspace(workspaceName);
    setWorkspaces((prev) =>
      prev.map((ws) => ({
        ...ws,
        isCurrent: ws.name === workspaceName,
      }))
    );
  };

  const openSideTab = (tab: SideTabItem) => {
    setOpenTabs((prev) => {
      const existing = prev.find(
        (t) =>
          t.id === tab.id || (t.type === tab.type && t.title === tab.title)
      );
      if (existing) {
        return prev;
      }
      return [...prev, tab];
    });
    setActiveTabId(tab.id);
    setActiveReviewTab(tab.type);
    setIsReviewPanelOpen(true);
  };

  const closeSideTab = (tabId: string) => {
    setOpenTabs((prev) => {
      const filtered = prev.filter((t) => t.id !== tabId);
      if (activeTabId === tabId && filtered.length > 0) {
        setActiveTabId(filtered[0].id);
        setActiveReviewTab(filtered[0].type);
      }
      return filtered;
    });
  };

  const insertTextToPrompt = (text: string) => {
    setPromptInput((prev) => {
      if (prev.endsWith("@") || prev.endsWith("/")) {
        return prev.slice(0, -1) + text;
      }
      return prev ? `${prev} ${text}` : text;
    });
  };

  return (
    <NavigationContext.Provider
      value={{
        currentUserId,
        isTaskDrawerOpen,
        isReviewPanelOpen,
        isTerminalOpen,
        isWorkspaceModalOpen,
        isOverflowMenuOpen,
        isSettingsModalOpen,
        isOperatingModeModalOpen,
        isModelSelectorModalOpen,
        isContextMeterOpen,

        isPlusMenuOpen,
        isMentionOpen,
        isSlashCommandOpen,
        promptInput,

        activeWorkspace,
        activeConversationId,
        activeTaskTitle,
        activeModel,
        activeOperatingMode,
        activeReviewTab,
        filterMode,
        customApiKey,
        customBaseUrl,

        openTabs,
        activeTabId,

        projects: [],
        workspaces,

        toggleTaskDrawer,
        openTaskDrawer,
        closeTaskDrawer,

        toggleReviewPanel,
        openReviewPanel,
        closeReviewPanel,

        toggleTerminal,
        setTerminalOpen,

        setWorkspaceModalOpen: setIsWorkspaceModalOpen,
        setOverflowMenuOpen: setIsOverflowMenuOpen,
        setSettingsModalOpen: setIsSettingsModalOpen,
        setOperatingModeModalOpen: setIsOperatingModeModalOpen,
        setModelSelectorModalOpen: setIsModelSelectorModalOpen,
        setContextMeterOpen: setIsContextMeterOpen,

        setPlusMenuOpen: setIsPlusMenuOpen,
        setMentionOpen: setIsMentionOpen,
        setSlashCommandOpen: setIsSlashCommandOpen,
        setPromptInput,
        insertTextToPrompt,

        openSideTab,
        closeSideTab,
        setActiveTabId: (id: string) => {
          setActiveTabId(id);
          const current = openTabs.find((t) => t.id === id);
          if (current) {
            setActiveReviewTab(current.type);
          }
        },

        setActiveWorkspace: handleSetWorkspace,
        setActiveConversationId,
        setActiveTaskTitle,
        setActiveModel,
        setActiveOperatingMode,
        setActiveReviewTab,
        setFilterMode,
        setCustomApiKey,
        setCustomBaseUrl,

        selectTask,
        createNewConversation,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
};
