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

export interface UserProfile {
  _id?: string;
  id?: string;
  name: string;
  username: string;
  email: string;
  avatarUrl?: string;
  initials?: string;
  subscriptionPlan?: "monthly" | "quarterly" | "yearly" | string;
  subscriptionStatus?: "active" | "expired" | "pending_payment" | string;
  creditsBalanceUsd?: number;
}

export interface UserConfigData {
  _id?: string;
  activeModel: string;
  provider: string;
  customBaseUrl?: string;
  customApiKeys?: {
    gemini?: string;
    anthropic?: string;
    openAi?: string;
    openRouter?: string;
  };
  customProviders?: Array<{
    id: string;
    name: string;
    baseUrl: string;
    apiKey?: string;
    apiFormat: string;
    isActive: boolean;
    models: Array<{
      id: string;
      name: string;
      contextLength?: number;
      supportsTools?: boolean;
    }>;
  }>;
  operatingMode: OperatingMode;
  systemPersona?: string;
  temperature?: number;
  voiceSettings?: {
    ttsEngine: "local_supertonic" | "cloud_fallback";
    selectedVoiceStyle: string;
    speakingRate: number;
    enableEmotionTags: boolean;
    autoPlayVoiceResponse: boolean;
    customVoiceStyleId?: string;
  };
}

interface NavigationContextType {
  // User & Authentication
  currentUserId: string | null;
  currentUser: UserProfile | null;
  userConfig: UserConfigData | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;

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

  // Auth Methods
  loginWithDevAccount: () => Promise<boolean>;
  loginWithCredentials: (email: string, name?: string, username?: string) => Promise<boolean>;
  logout: () => void;
  updateUserProfile: (data: { name?: string; username?: string; avatarUrl?: string }) => Promise<boolean>;
  updateUserSettings: (data: {
    activeModel?: string;
    provider?: string;
    customBaseUrl?: string;
    customApiKeys?: { gemini?: string; anthropic?: string; openAi?: string; openRouter?: string };
    operatingMode?: OperatingMode;
  }) => Promise<boolean>;

  // Navigation Actions
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
  { id: "ws-2", name: "Const Local Workspace", path: "local://workspace", isCurrent: true },
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
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [userConfig, setUserConfig] = useState<UserConfigData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

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
    process.env.EXPO_PUBLIC_CUSTOM_LLM_BASE_URL || ""
  );

  const [openTabs, setOpenTabs] = useState<SideTabItem[]>(INITIAL_TABS);
  const [activeTabId, setActiveTabId] = useState<string>("tab-review");
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>(INITIAL_WORKSPACES);

  const getOrCreateUser = useMutation(api.users.getOrCreateDefaultUser);
  const updateProfileMutation = useMutation(api.users.updateProfile);
  const updateUserConfigMutation = useMutation(api.users.updateUserConfig);
  const createConv = useMutation(api.conversations.createConversation);

  // Initialize Default User on mount
  useEffect(() => {
    let isMounted = true;
    setIsAuthLoading(true);

    getOrCreateUser({})
      .then((res) => {
        if (isMounted && res?.user?._id) {
          const userObj: UserProfile = {
            _id: res.user._id,
            id: res.user._id,
            name: res.user.name || "Alif Constantine",
            username: res.user.username || "alif",
            email: res.user.email || "alif@constai.platform",
            avatarUrl: res.user.avatarUrl || res.user.image,
            initials: res.user.initials || "AC",
            subscriptionPlan: res.user.subscriptionPlan || "yearly",
            subscriptionStatus: res.user.subscriptionStatus || "active",
            creditsBalanceUsd: res.user.creditsBalanceUsd || 100.0,
          };

          setCurrentUserId(res.user._id);
          setCurrentUser(userObj);
          setIsAuthenticated(true);

          if (res.config) {
            const configObj: UserConfigData = {
              _id: res.config._id,
              activeModel: res.config.activeModel || "Const",
              provider: res.config.provider || "custom_openai",
              customBaseUrl: res.config.customBaseUrl || "",
              customApiKeys: res.config.customApiKeys || {},
              customProviders: res.config.customProviders || [],
              operatingMode: (res.config.operatingMode as OperatingMode) || "ask_before_change",
              systemPersona: res.config.systemPersona,
              temperature: res.config.temperature,
              voiceSettings: res.config.voiceSettings as any,
            };

            setUserConfig(configObj);
            setActiveModel(configObj.activeModel);
            setActiveOperatingMode(configObj.operatingMode);
            if (configObj.customBaseUrl) {
              setCustomBaseUrl(configObj.customBaseUrl);
            }
            if (configObj.customApiKeys?.openAi) {
              setCustomApiKey(configObj.customApiKeys.openAi);
            }
          }
        }
      })
      .catch((err) => {
        console.warn("Convex connection warning (local mode fallback):", err);
      })
      .finally(() => {
        if (isMounted) setIsAuthLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const loginWithDevAccount = async (): Promise<boolean> => {
    setIsAuthLoading(true);
    try {
      const res = await getOrCreateUser({
        email: "alif@constai.platform",
        name: "Alif Constantine",
      });

      if (res?.user?._id) {
        const userObj: UserProfile = {
          _id: res.user._id,
          id: res.user._id,
          name: res.user.name || "Alif Constantine",
          username: res.user.username || "alif",
          email: res.user.email || "alif@constai.platform",
          avatarUrl: res.user.avatarUrl || res.user.image,
          initials: res.user.initials || "AC",
          subscriptionPlan: res.user.subscriptionPlan || "yearly",
          subscriptionStatus: res.user.subscriptionStatus || "active",
          creditsBalanceUsd: res.user.creditsBalanceUsd || 100.0,
        };

        setCurrentUserId(res.user._id);
        setCurrentUser(userObj);
        setIsAuthenticated(true);

        if (res.config) {
          const configObj: UserConfigData = {
            _id: res.config._id,
            activeModel: res.config.activeModel || "Const",
            provider: res.config.provider || "custom_openai",
            customBaseUrl: res.config.customBaseUrl || "",
            customApiKeys: res.config.customApiKeys || {},
            customProviders: res.config.customProviders || [],
            operatingMode: (res.config.operatingMode as OperatingMode) || "ask_before_change",
            systemPersona: res.config.systemPersona,
            temperature: res.config.temperature,
            voiceSettings: res.config.voiceSettings as any,
          };
          setUserConfig(configObj);
          setActiveModel(configObj.activeModel);
          setActiveOperatingMode(configObj.operatingMode);
          if (configObj.customBaseUrl) setCustomBaseUrl(configObj.customBaseUrl);
          if (configObj.customApiKeys?.openAi) setCustomApiKey(configObj.customApiKeys.openAi);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error("Login with dev account failed:", err);
      return false;
    } finally {
      setIsAuthLoading(false);
    }
  };

  const loginWithCredentials = async (
    email: string,
    name?: string,
    username?: string
  ): Promise<boolean> => {
    setIsAuthLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = name?.trim() || cleanEmail.split("@")[0];
      const cleanUsername =
        username?.trim() || cleanEmail.split("@")[0].replace(/[^a-z0-9_]/g, "");

      const res = await getOrCreateUser({
        email: cleanEmail,
        name: cleanName,
      });

      if (res?.user?._id) {
        const userObj: UserProfile = {
          _id: res.user._id,
          id: res.user._id,
          name: res.user.name || cleanName,
          username: res.user.username || cleanUsername,
          email: res.user.email || cleanEmail,
          avatarUrl: res.user.avatarUrl || res.user.image,
          initials: (cleanName.slice(0, 2) || "OP").toUpperCase(),
          subscriptionPlan: res.user.subscriptionPlan || "yearly",
          subscriptionStatus: res.user.subscriptionStatus || "active",
          creditsBalanceUsd: res.user.creditsBalanceUsd || 50.0,
        };

        setCurrentUserId(res.user._id);
        setCurrentUser(userObj);
        setIsAuthenticated(true);

        if (res.config) {
          const configObj: UserConfigData = {
            _id: res.config._id,
            activeModel: res.config.activeModel || "Const",
            provider: res.config.provider || "custom_openai",
            customBaseUrl: res.config.customBaseUrl || "",
            customApiKeys: res.config.customApiKeys || {},
            customProviders: res.config.customProviders || [],
            operatingMode: (res.config.operatingMode as OperatingMode) || "ask_before_change",
            systemPersona: res.config.systemPersona,
            temperature: res.config.temperature,
            voiceSettings: res.config.voiceSettings as any,
          };
          setUserConfig(configObj);
          setActiveModel(configObj.activeModel);
          setActiveOperatingMode(configObj.operatingMode);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error("Login with credentials failed:", err);
      return false;
    } finally {
      setIsAuthLoading(false);
    }
  };

  const logout = () => {
    setCurrentUserId(null);
    setCurrentUser(null);
    setUserConfig(null);
    setIsAuthenticated(false);
    setActiveConversationId("");
  };

  const updateUserProfile = async (data: {
    name?: string;
    username?: string;
    avatarUrl?: string;
  }): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const updated = await updateProfileMutation({
        name: data.name,
        username: data.username,
        avatarUrl: data.avatarUrl,
      });
      if (updated) {
        setCurrentUser((prev) =>
          prev
            ? {
                ...prev,
                name: updated.name || prev.name,
                username: updated.username || prev.username,
                avatarUrl: updated.avatarUrl || prev.avatarUrl,
                initials: (updated.name?.slice(0, 2) || prev.initials || "AC").toUpperCase(),
              }
            : null
        );
      }
      return true;
    } catch (err) {
      console.error("Failed to update profile:", err);
      // Optimistic update
      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              name: data.name ?? prev.name,
              username: data.username ?? prev.username,
              avatarUrl: data.avatarUrl ?? prev.avatarUrl,
            }
          : null
      );
      return true;
    }
  };

  const updateUserSettings = async (data: {
    activeModel?: string;
    provider?: string;
    customBaseUrl?: string;
    customApiKeys?: { gemini?: string; anthropic?: string; openAi?: string; openRouter?: string };
    operatingMode?: OperatingMode;
  }): Promise<boolean> => {
    if (!currentUserId) return false;
    try {
      if (data.activeModel) setActiveModel(data.activeModel);
      if (data.operatingMode) setActiveOperatingMode(data.operatingMode);
      if (data.customBaseUrl !== undefined) setCustomBaseUrl(data.customBaseUrl);
      if (data.customApiKeys?.openAi) setCustomApiKey(data.customApiKeys.openAi);

      const res = await updateUserConfigMutation({
        userId: currentUserId as any,
        activeModel: data.activeModel,
        provider: data.provider,
        customBaseUrl: data.customBaseUrl,
        customApiKeys: data.customApiKeys,
        operatingMode: data.operatingMode,
      });

      if (res) {
        setUserConfig((prev) =>
          prev
            ? {
                ...prev,
                activeModel: res.activeModel || prev.activeModel,
                provider: res.provider || prev.provider,
                customBaseUrl: res.customBaseUrl ?? prev.customBaseUrl,
                customApiKeys: res.customApiKeys || prev.customApiKeys,
                operatingMode: (res.operatingMode as OperatingMode) || prev.operatingMode,
              }
            : null
        );
      }
      return true;
    } catch (err) {
      console.warn("Failed to persist user settings to Convex:", err);
      return true;
    }
  };

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
        currentUser,
        userConfig,
        isAuthenticated,
        isAuthLoading,

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

        loginWithDevAccount,
        loginWithCredentials,
        logout,
        updateUserProfile,
        updateUserSettings,

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
