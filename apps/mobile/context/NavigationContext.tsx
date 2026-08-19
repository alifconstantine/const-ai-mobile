import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { OperatingMode } from "@const-ai/types";
import { useMutation, useQuery } from "convex/react";
import { api } from "@const-ai/backend";
import { useAuth, useUser } from "@clerk/expo";

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
  // User & Authentication (Clerk + Convex)
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

  // Auth & Sync Methods
  logout: () => Promise<void>;
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
  { id: "ws-1", name: "const-ai-mobile", path: "platform://const-ai-mobile", isCurrent: true },
  { id: "ws-2", name: "default", path: "local://workspace/default" },
];

const INITIAL_TABS: SideTabItem[] = [
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
  const { isSignedIn, isLoaded: isAuthLoaded, signOut } = useAuth();
  const { user: clerkUser } = useUser();

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
  const [activeModel, setActiveModel] = useState<string>("");
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

  // Live Convex query for the authenticated user, config, and conversations
  const viewer = useQuery(api.users.viewer);
  const liveUserConfig = useQuery(api.users.getUserConfig, currentUserId ? { userId: currentUserId as any } : {});
  const allConversations = useQuery(api.conversations.listConversations, currentUserId ? { userId: currentUserId as any } : {});
  const syncClerkUserMutation = useMutation(api.users.syncClerkUser);
  const updateProfileMutation = useMutation(api.users.updateProfile);
  const updateUserConfigMutation = useMutation(api.users.updateUserConfig);
  const createConv = useMutation(api.conversations.createConversation);

  // Real-time reactive synchronization of user config from Convex
  useEffect(() => {
    if (liveUserConfig) {
      const customProvs = liveUserConfig.customProviders || [];
      const apiKeys = liveUserConfig.customApiKeys || {};
      const hasAnyProvider =
        customProvs.some((p: any) => p.isActive !== false && p.models?.length > 0) ||
        Boolean(apiKeys.gemini || apiKeys.anthropic || apiKeys.openAi || apiKeys.openRouter);

      let resolvedModel = liveUserConfig.activeModel || "";
      if (!resolvedModel) {
        const firstProvWithModels = customProvs.find(
          (p: any) => p.isActive !== false && p.models?.length > 0
        );
        if (firstProvWithModels) {
          resolvedModel = firstProvWithModels.models[0].id;
        } else if (apiKeys.gemini) {
          resolvedModel = "gemini-2.0-flash";
        } else if (apiKeys.anthropic) {
          resolvedModel = "claude-3-7-sonnet";
        } else if (apiKeys.openAi) {
          resolvedModel = "gpt-4o";
        } else {
          resolvedModel = "Const";
        }
      }

      const configObj: UserConfigData = {
        _id: liveUserConfig._id,
        activeModel: resolvedModel,
        provider: liveUserConfig.provider || "custom_openai",
        customBaseUrl: liveUserConfig.customBaseUrl || "",
        customApiKeys: liveUserConfig.customApiKeys || {},
        customProviders: liveUserConfig.customProviders || [],
        operatingMode: (liveUserConfig.operatingMode as OperatingMode) || "ask_before_change",
        systemPersona: liveUserConfig.systemPersona,
        temperature: liveUserConfig.temperature,
        voiceSettings: liveUserConfig.voiceSettings as any,
      };
      setUserConfig(configObj);
      setActiveModel(resolvedModel);
      setActiveOperatingMode(configObj.operatingMode);
      if (configObj.customBaseUrl) setCustomBaseUrl(configObj.customBaseUrl);
      if (configObj.customApiKeys?.openAi) setCustomApiKey(configObj.customApiKeys.openAi);
    }
  }, [liveUserConfig]);

  // Auto-select latest conversation on initial load if none selected
  useEffect(() => {
    if (!activeConversationId && allConversations && allConversations.length > 0) {
      setActiveConversationId(allConversations[0]._id);
      setActiveTaskTitle(allConversations[0].title);
    }
  }, [allConversations, activeConversationId]);

  // Sync Clerk User and Convex Viewer into state
  useEffect(() => {
    if (viewer && viewer._id) {
      const viewerDoc = viewer as any;
      const email =
        clerkUser?.primaryEmailAddress?.emailAddress ||
        viewer.email ||
        "alif@constai.platform";
      const name =
        clerkUser?.fullName ||
        [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") ||
        viewer?.name ||
        "Alif Constantine";
      const username =
        clerkUser?.username ||
        viewer?.username ||
        "alifconstantine";
      const avatarUrl = clerkUser?.imageUrl || viewer?.avatarUrl || viewer?.image || "";

      // Auto-sync Clerk user with Convex if Clerk is signed in
      if (isSignedIn && clerkUser && email && !viewerDoc.clerkSynced) {
        syncClerkUserMutation({
          email,
          name,
          username,
          avatarUrl,
        }).catch((err) => console.warn("Auto-sync Clerk user to Convex error:", err));
      }

      const userObj: UserProfile = {
        _id: viewer._id,
        id: viewer._id,
        name: viewer.name || name,
        username: viewer.username || username,
        email: viewer.email || email,
        avatarUrl: viewer.avatarUrl || viewer.image || avatarUrl,
        initials: (viewer.name || name).slice(0, 2).toUpperCase(),
        subscriptionPlan: viewerDoc.subscriptionPlan || "yearly",
        subscriptionStatus: viewerDoc.subscriptionStatus || "active",
        creditsBalanceUsd: viewerDoc.creditsBalanceUsd ?? 100.0,
      };

      setCurrentUserId(viewer._id);
      setCurrentUser(userObj);
      setIsAuthenticated(true);

      if (viewer.config) {
        const customProvs = viewer.config.customProviders || [];
        const apiKeys = viewer.config.customApiKeys || {};
        const hasAnyProvider =
          customProvs.some((p: any) => p.isActive !== false && p.models?.length > 0) ||
          Boolean(apiKeys.gemini || apiKeys.anthropic || apiKeys.openAi || apiKeys.openRouter);

        let resolvedModel = viewer.config.activeModel || "";
        if (!hasAnyProvider) {
          resolvedModel = "";
        } else if (!resolvedModel) {
          const firstProvWithModels = customProvs.find((p: any) => p.isActive !== false && p.models?.length > 0);
          if (firstProvWithModels) {
            resolvedModel = firstProvWithModels.models[0].id;
          } else if (apiKeys.gemini) {
            resolvedModel = "gemini-2.0-flash";
          } else if (apiKeys.anthropic) {
            resolvedModel = "claude-3-7-sonnet";
          } else if (apiKeys.openAi) {
            resolvedModel = "gpt-4o";
          }
        }

        const configObj: UserConfigData = {
          _id: viewer.config._id,
          activeModel: resolvedModel,
          provider: viewer.config.provider || "custom_openai",
          customBaseUrl: viewer.config.customBaseUrl || "",
          customApiKeys: viewer.config.customApiKeys || {},
          customProviders: viewer.config.customProviders || [],
          operatingMode: (viewer.config.operatingMode as OperatingMode) || "ask_before_change",
          systemPersona: viewer.config.systemPersona,
          temperature: viewer.config.temperature,
          voiceSettings: viewer.config.voiceSettings as any,
        };
        setUserConfig(configObj);
        setActiveModel(resolvedModel);
        setActiveOperatingMode(configObj.operatingMode);
        if (configObj.customBaseUrl) setCustomBaseUrl(configObj.customBaseUrl);
        if (configObj.customApiKeys?.openAi) setCustomApiKey(configObj.customApiKeys.openAi);
      }
      setIsAuthLoading(false);
    } else if (isSignedIn && clerkUser) {
      // Temporary preview state while Convex syncs
      const email = clerkUser.primaryEmailAddress?.emailAddress || "";
      const name = clerkUser.fullName || "Operator";
      setCurrentUser({
        id: clerkUser.id,
        name,
        username: clerkUser.username || "operator",
        email,
        avatarUrl: clerkUser.imageUrl || "",
        initials: name.slice(0, 2).toUpperCase(),
        subscriptionPlan: "yearly",
        subscriptionStatus: "active",
        creditsBalanceUsd: 100.0,
      });
      setIsAuthenticated(true);
      setIsAuthLoading(false);
    } else if (isAuthLoaded) {
      setIsAuthLoading(false);
    }
  }, [isSignedIn, isAuthLoaded, clerkUser, viewer]);

  const logout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.warn("Sign out error:", err);
    }
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
    try {
      const convId = await createConv({
        userId: currentUserId ? (currentUserId as any) : undefined,
        title,
      });
      if (convId) {
        setActiveConversationId(convId);
        setActiveTaskTitle(title);
        return convId;
      }
    } catch (err) {
      console.warn("Failed to create conversation in DB:", err);
    }
    const fallbackId = `local_conv_${Date.now()}`;
    setActiveConversationId(fallbackId);
    setActiveTaskTitle(title);
    return fallbackId;
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

